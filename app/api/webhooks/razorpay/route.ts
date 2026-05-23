import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/prisma"
import { verifyRazorpaySignature } from "@/lib/billing/razorpay"
import { transitionSubscription } from "@/lib/billing/state-machine"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature")
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 401 })
    }

    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const providerEventId = event.id || req.headers.get("x-razorpay-event-id")

    if (!providerEventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }

    // Idempotency Check
    const existingEvent = await db.billingWebhookEvent.findUnique({
      where: { providerEventId },
    })

    if (existingEvent?.isProcessed) {
      return NextResponse.json({ received: true, status: "already_processed" })
    }

    if (!existingEvent) {
      await db.billingWebhookEvent.create({
        data: {
          providerEventId,
          eventType: event.event,
          rawPayload: event,
        },
      })
    }

    // Process the event within a try-catch to update isProcessed on success
    try {
      switch (event.event) {
        case "subscription.charged":
          await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity)
          break
        case "subscription.halted":
          await handleSubscriptionHalted(event.payload.subscription.entity)
          break
        case "subscription.cancelled":
          await handleSubscriptionCancelled(event.payload.subscription.entity)
          break
        case "subscription.authenticated":
          await handleSubscriptionAuthenticated(event.payload.subscription.entity)
          break
        default:
          console.log(`Unhandled Razorpay event: ${event.event}`)
      }

      // Mark as processed
      await db.billingWebhookEvent.update({
        where: { providerEventId },
        data: { isProcessed: true },
      })

      return NextResponse.json({ received: true })
    } catch (err: any) {
      console.error(`Error processing webhook ${providerEventId}:`, err)
      // Log the error but don't mark as processed so it can be retried
      await db.billingWebhookEvent.update({
        where: { providerEventId },
        data: { processingError: err.message },
      })
      // Return 500 so Razorpay retries
      return NextResponse.json({ error: "Processing failed" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Webhook endpoint error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Handler functions for specific events

async function handleSubscriptionAuthenticated(subscriptionData: any) {
  const schoolId = subscriptionData.notes?.schoolId
  const planId = subscriptionData.notes?.planId
  const billingCycle = subscriptionData.notes?.billingCycle

  if (!schoolId) throw new Error("Missing schoolId in subscription notes")

  const localSub = await db.subscription.findUnique({ where: { schoolId } })
  if (localSub) {
    await db.subscription.update({
      where: { schoolId },
      data: {
        providerSubscriptionId: subscriptionData.id,
        providerCustomerId: subscriptionData.customer_id,
        planId: planId || undefined,
        billingCycle: billingCycle || undefined,
      },
    })
    
    await transitionSubscription(
      db, 
      localSub.id, 
      schoolId, 
      localSub.status, 
      "ACTIVE", 
      { action: "SUBSCRIPTION_AUTHENTICATED" }
    );
  }
}

async function handleSubscriptionCharged(subscriptionData: any, paymentData: any) {
  const rzpSubId = subscriptionData.id
  const schoolId = subscriptionData.notes?.schoolId

  const localSub = await db.subscription.findFirst({
    where: {
      OR: [
        { providerSubscriptionId: rzpSubId },
        { schoolId: schoolId },
      ]
    },
    include: { school: true }
  })

  if (!localSub) {
    throw new Error(`Subscription not found for rzpSubId: ${rzpSubId}`)
  }

  const currentPeriodEnd = new Date(subscriptionData.current_end * 1000)

  // 1. Update End Date
  await db.subscription.update({
    where: { id: localSub.id },
    data: {
      currentPeriodEnd,
      graceEndsAt: null,
    },
  })
  
  await db.school.update({
    where: { id: localSub.schoolId },
    data: { 
      currentPeriodEnd 
    }
  })

  // 2. State transition
  await transitionSubscription(
    db, 
    localSub.id, 
    localSub.schoolId, 
    localSub.status, 
    "ACTIVE", 
    { action: "SUBSCRIPTION_CHARGED" }
  );

  // 3. Record Payment Transaction
  await db.paymentTransaction.upsert({
    where: { razorpayPaymentId: paymentData.id },
    update: {
      status: "COMPLETED",
    },
    create: {
      schoolId: localSub.schoolId,
      provider: "RAZORPAY",
      razorpayPaymentId: paymentData.id,
      razorpayOrderId: paymentData.order_id,
      razorpaySubscriptionId: rzpSubId,
      amount: paymentData.amount, // in paise
      currency: paymentData.currency,
      status: "COMPLETED",
      invoiceReference: paymentData.invoice_id,
      paidAt: new Date(paymentData.created_at * 1000),
    },
  })
}

async function handleSubscriptionHalted(subscriptionData: any) {
  const rzpSubId = subscriptionData.id
  const localSub = await db.subscription.findUnique({
    where: { providerSubscriptionId: rzpSubId },
  })

  if (!localSub) return

  await transitionSubscription(
    db, 
    localSub.id, 
    localSub.schoolId, 
    localSub.status, 
    "PAST_DUE", 
    { action: "PAYMENT_FAILED", description: "Subscription halted by Razorpay due to payment failures." }
  );
}

async function handleSubscriptionCancelled(subscriptionData: any) {
  const rzpSubId = subscriptionData.id
  const localSub = await db.subscription.findUnique({
    where: { providerSubscriptionId: rzpSubId },
  })

  if (!localSub) return

  await transitionSubscription(
    db, 
    localSub.id, 
    localSub.schoolId, 
    localSub.status, 
    "CANCELED", 
    { action: "SUBSCRIPTION_CANCELLED" }
  );
}

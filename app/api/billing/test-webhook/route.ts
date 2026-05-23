import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma as db } from "@/lib/prisma"

export const dynamic = "force-dynamic";

// WARNING: This is for local/testing only.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 })
  }

  const session = await auth();
  if (!session || session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, schoolId, rzpSubId } = body;

    // Simulate sending a payload to the actual webhook endpoint locally
    const mockPayload = {
      event,
      id: `evt_mock_${Date.now()}`,
      payload: {
        subscription: {
          entity: {
            id: rzpSubId || "sub_mock123",
            customer_id: "cust_mock123",
            status: event === "subscription.halted" ? "halted" : "active",
            current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), // +30 days
            notes: {
              schoolId: schoolId
            }
          }
        },
        payment: {
          entity: {
            id: `pay_mock_${Date.now()}`,
            order_id: `order_mock_${Date.now()}`,
            amount: 199900,
            currency: "INR",
            invoice_id: `inv_mock_${Date.now()}`,
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      }
    };

    // We can directly call the webhook logic, but it's better to insert the mock directly 
    // or call the exported POST function from the webhook route. However, we can't easily bypass
    // signature verification inside the standard route. 
    // To cleanly test it, we'll insert a mock event and call the handlers. 
    // BUT since we just want a test harness, we will POST to the local URL without signature 
    // and rely on a bypass flag? No, it's safer to just replicate the handler call here.

    // For full E2E testing without Razorpay, let's just trigger the state machine directly.
    const { transitionSubscription } = await import("@/lib/billing/state-machine");

    const subscription = await db.subscription.findUnique({ where: { schoolId } });
    if (!subscription) throw new Error("No subscription found for school");

    if (event === "subscription.charged") {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      });
      await transitionSubscription(db, subscription.id, schoolId, subscription.status, "ACTIVE", { action: "MOCK_CHARGED" });
    } else if (event === "subscription.halted") {
      await transitionSubscription(db, subscription.id, schoolId, subscription.status, "PAST_DUE", { action: "MOCK_HALTED" });
    } else if (event === "subscription.cancelled") {
      await transitionSubscription(db, subscription.id, schoolId, subscription.status, "CANCELED", { action: "MOCK_CANCELLED" });
    }

    return NextResponse.json({ success: true, message: `Mocked ${event} successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

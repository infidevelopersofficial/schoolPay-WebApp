import { transitionSubscription } from "../lib/billing/state-machine";

async function testP001() {
  console.log("Running unit test for P0-01: transitionSubscription schoolId check...");
  
  let updatedSubscription: any = null;
  let createdBillingEvent: any = null;
  
  const mockDb = {
    subscription: {
      update: async (args: any) => {
        updatedSubscription = args;
        return args;
      }
    },
    billingEvent: {
      create: async (args: any) => {
        createdBillingEvent = args;
        return args;
      }
    }
  };

  const subId = "sub_12345";
  const schoolId = "school_abc999";
  
  await transitionSubscription(mockDb, subId, schoolId, "ACTIVE", "PAST_DUE", {
    action: "WEBHOOK_FAILED_PAYMENT",
    description: "Payment failed due to insufficient card funds"
  });

  // Verify assertions
  if (!updatedSubscription || updatedSubscription.where.id !== subId || updatedSubscription.data.status !== "PAST_DUE") {
    throw new Error("Subscription update assertion failed: " + JSON.stringify(updatedSubscription));
  }

  if (!createdBillingEvent || createdBillingEvent.data.subscriptionId !== subId || createdBillingEvent.data.schoolId !== schoolId) {
    throw new Error("BillingEvent create assertion failed! Expected schoolId in payload: " + JSON.stringify(createdBillingEvent));
  }

  console.log("✅ P0-01 Unit Test Passed! BillingEvent create payload correctly contains schoolId:", createdBillingEvent.data.schoolId);
}

testP001().catch(err => {
  console.error("❌ P0-01 Unit Test Failed:", err);
  process.exit(1);
});

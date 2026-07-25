import { enforcePlanLimit, enforceFeatureAccess, PlanLimitExceededError, FeatureNotAvailableError } from "../lib/billing/limits";

// Mocking Prisma DB in global scope by overriding require or using custom test harness
async function testP009() {
  console.log("Running unit test for P0-09: enforcePlanLimit and enforceFeatureAccess FREE_TRIAL fallback...");

  // Let's test the logic directly by mocking prisma.school.findUnique
  const mockDb = require("../lib/prisma").prisma;
  const originalFindUnique = mockDb.school.findUnique;

  try {
    // 1. Mock a school with NO subscription (un-onboarded / demo school) and usage at 50 students
    mockDb.school.findUnique = async () => ({
      id: "school_no_sub",
      subscription: null,
      usageRecord: {
        currentStudents: 50,
        currentStaff: 2,
        currentStorageGb: 0.5
      }
    });

    // Attempting to increment by 1 student (50 + 1 > 50 FREE_TRIAL limit) should throw PlanLimitExceededError
    let threwLimitError = false;
    try {
      await enforcePlanLimit({ schoolId: "school_no_sub", limitType: "studentLimit", incrementBy: 1 });
    } catch (err: any) {
      if (err instanceof PlanLimitExceededError) {
        threwLimitError = true;
        console.log("✅ Caught expected PlanLimitExceededError on fallback student limit:", err.message);
      } else {
        throw err;
      }
    }

    if (!threwLimitError) {
      throw new Error("Failed to throw PlanLimitExceededError when exceeding FREE_TRIAL quota!");
    }

    // Attempting to increment within capacity (e.g. staffLimit: 2 + 1 <= 5) should succeed
    const staffRes = await enforcePlanLimit({ schoolId: "school_no_sub", limitType: "staffLimit", incrementBy: 1 });
    if (staffRes !== true) {
      throw new Error("Expected true for staffLimit within capacity!");
    }
    console.log("✅ Staff limit within FREE_TRIAL capacity correctly allowed.");

    // 2. Test feature access on trial account (e.g. LMS feature should be blocked on FREE_TRIAL)
    let threwFeatureError = false;
    try {
      await enforceFeatureAccess({ schoolId: "school_no_sub", feature: "lms" });
    } catch (err: any) {
      if (err instanceof FeatureNotAvailableError) {
        threwFeatureError = true;
        console.log("✅ Caught expected FeatureNotAvailableError on fallback feature check:", err.message);
      } else {
        throw err;
      }
    }

    if (!threwFeatureError) {
      throw new Error("Failed to throw FeatureNotAvailableError for premium LMS feature on FREE_TRIAL!");
    }

    // But studentPortal should be allowed
    const portalRes = await enforceFeatureAccess({ schoolId: "school_no_sub", feature: "studentPortal" });
    if (portalRes !== true) {
      throw new Error("Expected true for studentPortal feature on FREE_TRIAL!");
    }
    console.log("✅ Basic studentPortal feature correctly allowed on FREE_TRIAL.");

    console.log("✅ P0-09 Unit Test Passed! Silent billing bypass removed and FREE_TRIAL quotas strictly enforced.");
  } finally {
    mockDb.school.findUnique = originalFindUnique;
  }
}

testP009().catch(err => {
  console.error("❌ P0-09 Unit Test Failed:", err);
  process.exit(1);
});

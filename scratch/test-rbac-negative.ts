import { deleteParentAction } from "../app/(dashboard)/dashboard/parents/actions";

async function run() {
  console.log("Mocked lib/tenant-context.ts to return PARENT role.");
  console.log("Attempting to call deleteParentAction (requires ADMIN)...");
  try {
    const result = await deleteParentAction("123");
    console.log("Action Result:", result);
  } catch (err) {
    console.error("Caught error:", err);
  }
}
run();

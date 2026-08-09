import { prisma } from "./lib/prisma";
import { deleteFeeStructure } from "./lib/dal/fee-structure";
import * as tc from "./lib/tenant-context";
import fs from "fs";

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) return;
  const schoolId = school.id;

  Object.defineProperty(tc, "getSchoolId", { value: async () => schoolId });

  // 1. Create a mock fee structure directly
  const structure = await prisma.feeStructure.create({
    data: {
      schoolId,
      name: "Test Fee Structure For Deletion",
      isActive: true,
    }
  });

  let output = `Created fee structure. isActive: ${structure.isActive}\n`;

  // 2. Soft delete it
  const result = await deleteFeeStructure(structure.id);
  output += `Deleted fee structure. isActive: ${result.isActive}\n`;

  if (result.isActive === false) {
    output += "✅ SUCCESS: Fee structure was successfully soft-deleted (isActive = false).\n";
  } else {
    output += "❌ FAILED: Fee structure was not soft-deleted.\n";
  }

  // Cleanup
  await prisma.feeStructure.delete({ where: { id: structure.id } });
  
  fs.writeFileSync("e2e-result.txt", output);
}

main().finally(() => process.exit(0));

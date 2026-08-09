import { prisma } from "./lib/prisma";

async function main() {
  const feeStructure = await prisma.feeStructure.findFirst({
    select: { id: true, name: true, isActive: true }
  });
  console.log(feeStructure);
}

main().finally(() => process.exit(0));

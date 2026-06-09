import { prisma } from '../lib/prisma';

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("Connection successful! Result:", result);
  } catch (error) {
    console.error("Connection failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

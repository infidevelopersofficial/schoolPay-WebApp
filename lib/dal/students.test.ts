import { prisma } from "../../lib/prisma"
import { createStudentSchema, createStudent } from "./students"

async function testStudentCreation() {
  console.log("=== RUNNING STUDENT CREATION TESTS ===")
  const school = await prisma.school.findFirst()
  if (!school) {
    console.error("No school found in DB")
    return
  }
  const schoolId = school.id
  console.log("Using School ID:", schoolId)

  // Set env var for CLI test
  process.env.CLI_TEST_SCHOOL_ID = schoolId

  const testInputs = [
    {
      name: "Test Student DD/MM/YYYY",
      dateOfBirth: "25/05/2015", // DD/MM/YYYY
      class: "Class 10",
      section: "A",
      parentName: "Test Parent 1",
      parentEmail: "testparent_1@example.com",
      parentMobile: "9876543210",
      totalFees: 5000,
    },
    {
      name: "Test Student DD-MM-YYYY",
      dateOfBirth: "25-05-2015", // DD-MM-YYYY
      class: "10-A",
      parentName: "Test Parent 2",
      parentEmail: "testparent_2@example.com",
      parentMobile: "9876543210",
      totalFees: "5000",
    },
    {
      name: "Test Student DD.MM.YYYY",
      dateOfBirth: "25.05.2015", // DD.MM.YYYY
      class: "Class 10",
      section: "",
      parentName: "Test Parent 3",
      parentEmail: "testparent_3@example.com",
      parentMobile: "987-654-3210",
      totalFees: 0,
    },
    {
      name: "Test Student YYYY-MM-DD",
      dateOfBirth: "2015-05-25", // YYYY-MM-DD
      class: "Class 10 A",
      section: "B",
      parentName: "Test Parent 4",
      parentEmail: "testparent_4@example.com",
      parentMobile: "9876543210",
      totalFees: 5000,
    }
  ]

  let allPassed = true

  for (const [idx, input] of testInputs.entries()) {
    console.log(`\n========================================`)
    console.log(`--- Test Input #${idx + 1} ---`)
    console.log("Input:", input)
    
    try {
      await prisma.$transaction(async (tx) => {
        // Validate schema first
        const parsed = createStudentSchema.parse(input)
        
        // Execute creation
        const res = await createStudent(parsed as any)
        console.log("createStudent() SUCCESS! Result Student Name:", res.name)
        console.log("Parsed ISO Date of Birth:", res.dateOfBirth)
        // Rollback so we don't pollute the DB
        throw new Error("ROLLBACK_SUCCESS")
      })
    } catch (e: any) {
      if (e.message === "ROLLBACK_SUCCESS") {
        console.log("✅ Test Passed (Successfully rolled back test transaction).")
      } else {
        allPassed = false
        console.error("❌ CAUGHT ERROR IN TEST LOOP ===")
        console.error("Error Message:", e.message)
        if (e.issues) {
          console.error("ZOD ISSUES:", JSON.stringify(e.issues, null, 2))
        }
      }
    }
  }

  if (allPassed) {
    console.log("\n✅ ALL TESTS PASSED.")
  } else {
    console.log("\n❌ SOME TESTS FAILED.")
    process.exitCode = 1
  }
}

testStudentCreation().catch(e => {
  console.error("Test execution failed:", e)
  process.exitCode = 1
})

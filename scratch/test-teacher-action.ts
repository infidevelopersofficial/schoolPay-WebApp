import { createTeacherSchema } from '../lib/dal/teachers'

function mockAddTeacherAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  
  const subjectIds = formData.getAll("subjectIds") as string[]
  
  let classAssignments = undefined
  const classAssignmentsData = formData.get("classAssignmentsData") as string
  if (classAssignmentsData) {
    try {
      classAssignments = JSON.parse(classAssignmentsData)
    } catch (e) {
      return { error: "Validation failed", fieldErrors: { classAssignments: ["Invalid JSON payload for class assignments"] } }
    }
  }

  const payload = {
    ...raw,
    subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
    classAssignments,
  }

  const result = createTeacherSchema.safeParse(payload)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  return { success: true, parsedData: result.data }
}

async function runTest() {
  console.log("=== Testing Valid FormData ===")
  const validForm = new FormData()
  validForm.append("name", "John Doe")
  validForm.append("email", "john@example.com")
  validForm.append("phone", "9876543210")
  validForm.append("subjectIds", "sub_1")
  validForm.append("subjectIds", "sub_2")
  validForm.append("classAssignmentsData", JSON.stringify([
    { classId: "cls_1", isClassTeacher: true },
    { classId: "cls_2", isClassTeacher: false }
  ]))

  const validResult = mockAddTeacherAction(validForm)
  console.log(JSON.stringify(validResult, null, 2))

  console.log("\n=== Testing Invalid JSON ===")
  const invalidJsonForm = new FormData()
  invalidJsonForm.append("name", "Jane")
  invalidJsonForm.append("email", "jane@example.com")
  invalidJsonForm.append("phone", "1234567890")
  invalidJsonForm.append("classAssignmentsData", "invalid-json-string")
  
  const invalidResult = mockAddTeacherAction(invalidJsonForm)
  console.log(JSON.stringify(invalidResult, null, 2))
}

runTest()

import { prisma } from '../lib/prisma'

async function setClassTeacherLocal(classId: string, teacherId: string | null, schoolId: string) {
  // Replicating the exact transaction logic from lib/dal/teachers.ts
  return prisma.$transaction(async (tx) => {
    // 1. Unset old isClassTeacher flag
    await tx.teacherClassAssignment.updateMany({
      where: { classId, schoolId },
      data: { isClassTeacher: false }
    })

    // 2. Set new classTeacherId on Class
    await tx.class.update({
      where: { id: classId, schoolId },
      data: { classTeacherId: teacherId }
    })

    // 3. Ensure the new teacher has an active assignment and isClassTeacher = true
    if (teacherId) {
      await tx.teacherClassAssignment.upsert({
        where: { teacherId_classId: { teacherId, classId } },
        create: { teacherId, classId, schoolId, isActive: true, isClassTeacher: true },
        update: { isActive: true, isClassTeacher: true, schoolId }
      })
    }
  })
}

async function runTest() {
  console.log("Creating test fixtures...")
  const school = await prisma.school.create({ 
    data: { name: "Test School", slug: "test-school-12345", schoolCode: "TS12345" } 
  })
  const cls = await prisma.class.create({ 
    data: { name: "Test Class", section: "A", schoolId: school.id } 
  })
  const teacher1 = await prisma.teacher.create({ 
    data: { name: "T1", email: "t1@test.com", phone: "111", subject: "Math", class: "10", schoolId: school.id } 
  })
  const teacher2 = await prisma.teacher.create({ 
    data: { name: "T2", email: "t2@test.com", phone: "222", subject: "Science", class: "10", schoolId: school.id } 
  })

  try {
    console.log("Calling setClassTeacher with T1...")
    await setClassTeacherLocal(cls.id, teacher1.id, school.id)

    console.log("Calling setClassTeacher with T2...")
    await setClassTeacherLocal(cls.id, teacher2.id, school.id)

    const assignments = await prisma.teacherClassAssignment.findMany({
      where: { classId: cls.id, schoolId: school.id },
      select: { teacherId: true, isClassTeacher: true }
    })
    
    console.log("Final TeacherClassAssignment states for the class:")
    console.table(assignments.map(a => ({
      teacherName: a.teacherId === teacher1.id ? "T1" : "T2",
      isClassTeacher: a.isClassTeacher
    })))
  } finally {
    console.log("Cleaning up test fixtures...")
    await prisma.teacherClassAssignment.deleteMany({ where: { schoolId: school.id } })
    await prisma.class.delete({ where: { id: cls.id } })
    await prisma.teacher.deleteMany({ where: { id: { in: [teacher1.id, teacher2.id] } } })
    await prisma.school.delete({ where: { id: school.id } })
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect())

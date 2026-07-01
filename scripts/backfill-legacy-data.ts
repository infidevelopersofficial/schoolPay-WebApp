import * as fs from 'fs'
import * as path from 'path'

// Must load env before importing prisma due to hoisting
require('dotenv').config({ path: '.env' })
const { prisma } = require('../lib/prisma')

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  console.log(`Starting backfill script. Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'}`)

  const warnings: any[] = []
  const report = {
    teacherSubjectsCreated: 0,
    teacherClassAssignmentsCreated: 0,
    classTeacherIdUpdates: 0,
    warningsCount: 0,
  }

  // 1. Backfill Teacher -> Subject and Teacher -> Class
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, subject: true, class: true, schoolId: true }
  })

  // Load all subjects and classes keyed by schoolId for quick lookup
  const allSubjects = await prisma.subject.findMany({ select: { id: true, name: true, schoolId: true } })
  const allClasses = await prisma.class.findMany({ select: { id: true, name: true, section: true, schoolId: true } })
  
  const subjectsBySchool = allSubjects.reduce((acc, sub) => {
    if (!acc[sub.schoolId]) acc[sub.schoolId] = []
    acc[sub.schoolId].push(sub)
    return acc
  }, {} as Record<string, typeof allSubjects>)

  const classesBySchool = allClasses.reduce((acc, cls) => {
    if (!acc[cls.schoolId]) acc[cls.schoolId] = []
    acc[cls.schoolId].push(cls)
    return acc
  }, {} as Record<string, typeof allClasses>)

  console.log(`Processing ${teachers.length} teachers...`)

  for (const t of teachers) {
    // Subject backfill
    if (t.subject && t.subject.trim() !== '') {
      const schoolSubjects = subjectsBySchool[t.schoolId] || []
      const matchedSubject = schoolSubjects.find(s => s.name.toLowerCase() === t.subject.trim().toLowerCase())
      
      if (matchedSubject) {
        if (!isDryRun) {
          await prisma.teacherSubject.upsert({
            where: {
              teacherId_subjectId: { teacherId: t.id, subjectId: matchedSubject.id }
            },
            create: { schoolId: t.schoolId, teacherId: t.id, subjectId: matchedSubject.id },
            update: {}
          })
        }
        report.teacherSubjectsCreated++
      } else {
        warnings.push({
          type: 'MISSING_SUBJECT',
          schoolId: t.schoolId,
          teacherId: t.id,
          teacherName: t.name,
          legacyValue: t.subject
        })
      }
    }

    // Class backfill (regular assignment)
    if (t.class && t.class.trim() !== '') {
      const schoolClasses = classesBySchool[t.schoolId] || []
      // Match by combining name + section, or just name depending on how legacy data looks
      // In legacy, class was just a string e.g. "10A"
      const matchedClass = schoolClasses.find(c => {
        const fullClass = `${c.name}${c.section}`.toLowerCase()
        const fullClassSpaced = `${c.name} ${c.section}`.toLowerCase()
        const legacyVal = t.class.trim().toLowerCase()
        return fullClass === legacyVal || fullClassSpaced === legacyVal || c.name.toLowerCase() === legacyVal
      })
      
      if (matchedClass) {
        if (!isDryRun) {
          await prisma.teacherClassAssignment.upsert({
            where: {
              teacherId_classId: { teacherId: t.id, classId: matchedClass.id }
            },
            create: { schoolId: t.schoolId, teacherId: t.id, classId: matchedClass.id, isClassTeacher: false },
            update: {}
          })
        }
        report.teacherClassAssignmentsCreated++
      } else {
        warnings.push({
          type: 'MISSING_CLASS_FOR_TEACHER',
          schoolId: t.schoolId,
          teacherId: t.id,
          teacherName: t.name,
          legacyValue: t.class
        })
      }
    }
  }

  // 2. Backfill Class -> classTeacherLegacy
  const classesWithLegacyTeacher = await prisma.class.findMany({
    where: { classTeacherLegacy: { not: null, not: '' } },
    select: { id: true, name: true, section: true, schoolId: true, classTeacherLegacy: true }
  })
  
  const allTeachers = await prisma.teacher.findMany({ select: { id: true, name: true, schoolId: true } })
  const teachersBySchool = allTeachers.reduce((acc, t) => {
    if (!acc[t.schoolId]) acc[t.schoolId] = []
    acc[t.schoolId].push(t)
    return acc
  }, {} as Record<string, typeof allTeachers>)

  console.log(`Processing ${classesWithLegacyTeacher.length} classes with legacy class teachers...`)

  for (const c of classesWithLegacyTeacher) {
    if (!c.classTeacherLegacy) continue
    const schoolTeachers = teachersBySchool[c.schoolId] || []
    const matchedTeacher = schoolTeachers.find(t => t.name.toLowerCase() === c.classTeacherLegacy!.trim().toLowerCase())
    
    if (matchedTeacher) {
      if (!isDryRun) {
        // Update class.classTeacherId
        await prisma.class.update({
          where: { id: c.id },
          data: { classTeacherId: matchedTeacher.id }
        })
        
        // Also ensure a TeacherClassAssignment exists with isClassTeacher = true
        await prisma.teacherClassAssignment.upsert({
          where: {
            teacherId_classId: { teacherId: matchedTeacher.id, classId: c.id }
          },
          create: { schoolId: c.schoolId, teacherId: matchedTeacher.id, classId: c.id, isClassTeacher: true },
          update: { isClassTeacher: true }
        })
      }
      report.classTeacherIdUpdates++
    } else {
      warnings.push({
        type: 'MISSING_TEACHER_FOR_CLASS',
        schoolId: c.schoolId,
        classId: c.id,
        className: `${c.name} ${c.section}`,
        legacyValue: c.classTeacherLegacy
      })
    }
  }

  report.warningsCount = warnings.length

  // Write warnings to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(process.cwd(), `backfill-warnings-${isDryRun ? 'dry-run' : 'live'}-${timestamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify({ report, warnings }, null, 2))

  console.log('\n--- BACKFILL REPORT ---')
  console.log(`Teacher-Subject Assignments (Planned/Created): ${report.teacherSubjectsCreated}`)
  console.log(`Teacher-Class Assignments (Planned/Created): ${report.teacherClassAssignmentsCreated}`)
  console.log(`Class Teacher Mappings (Planned/Created): ${report.classTeacherIdUpdates}`)
  console.log(`Warnings generated: ${report.warningsCount}`)
  console.log(`\nDetailed report and warnings written to: ${reportPath}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

async function main(){
  const email = 'admin@schoolpay.com'
  const password = 'SchoolPay!2026$Admin' // test credential
  const hashed = await bcrypt.hash(password, 12)

  // Find default school
  const school = await prisma.school.findUnique({ where: { slug: 'default-school' } })
  if (!school) {
    console.error('Default school not found')
    process.exit(1)
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Admin SchoolPay', hashedPassword: hashed, role: 'ADMIN' },
    create: { name: 'Admin SchoolPay', email, hashedPassword: hashed, role: 'ADMIN' },
  })

  // Link to school
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: user.id, schoolId: school.id } },
    update: {},
    create: { userId: user.id, schoolId: school.id, role: 'ADMIN' },
  })

  console.log('Created/updated user:', email)
  console.log('Password (for testing):', password)
  process.exit(0)
}

main().catch(e=>{console.error(e); process.exit(1)})

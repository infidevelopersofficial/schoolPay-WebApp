import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

async function main(){
  const email = 'admin@schoolpay.com'
  const password = 'SchoolPay!2026$Admin'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { console.error('User not found'); process.exit(1) }
  const ok = await bcrypt.compare(password, user.hashedPassword || '')
  console.log('Login test for', email, '=>', ok ? 'SUCCESS' : 'FAIL')
  process.exit(ok?0:1)
}

main().catch(e=>{console.error(e); process.exit(1)})

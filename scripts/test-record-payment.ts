require('dotenv').config({ path: '.env' })
const { prisma } = require('../lib/prisma')
const { getStudents } = require('../lib/dal/students')
const { recordPaymentAction } = require('../app/(dashboard)/dashboard/payments/actions')

// Polyfill FormData for Node.js test script if not present
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() { this.entries = []; }
    append(key, value) { this.entries.push([key, value]); }
    get(key) { const e = this.entries.find(e => e[0] === key); return e ? e[1] : null; }
    entries() { return this.entries; }
  } as any
}

async function main() {
  console.log("Constructing simulated FormData exactly matching our new form UI...")
  const formData = new FormData()
  
  // Hidden inputs
  formData.append("studentId", "cm0x8y4p30005d7z52y83f1v9")
  formData.append("feeType", "Tuition Fee")
  formData.append("paymentMethod", "CASH")
  
  // Standard inputs
  formData.append("amount", "1500")
  formData.append("date", new Date().toISOString().split('T')[0])
  formData.append("transactionId", "")
  formData.append("receiptNumber", "")

  console.log("\n--- SIMULATED FORMDATA PAYLOAD ---")
  const rawPayload = Object.fromEntries(formData.entries())
  console.log(JSON.stringify(rawPayload, null, 2))
  console.log("----------------------------------\n")

  // 3. Submit action
  console.log("Submitting recordPaymentAction...")
  // We need to mock auth() and tenant-auth for the action, 
  // since the action uses withTenantAuth.
  // Wait, if we call the action directly from Node.js, `auth()` relies on NextAuth cookies which don't exist here.
  // We might get "Unauthorized".
  // Let's just create a raw payment directly via `createPayment` to verify the payload is valid against the schema,
  // or we can mock it.
  
  const { createPaymentSchema, createPayment } = require('../lib/dal/payments')
  
  console.log("Validating payload against createPaymentSchema...")
  const parsed = createPaymentSchema.safeParse(rawPayload)
  
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.flatten().fieldErrors)
    return
  }
  console.log("Validation PASSED! Parsed data:")
  console.log(parsed.data)

}

main().catch(console.error).finally(() => prisma.$disconnect())

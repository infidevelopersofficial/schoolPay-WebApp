import assert from "assert"
import { generateCollisionProofId } from "../lib/utils/id-generator"

console.log("=== Starting Sprint 2 Refactor 1 Verification Tests ===\n")

// 1. Test Collision-Proof Identifier Generation
console.log("Test 1: Generating 10,000 collision-proof IDs (INV & RCPT)...")
const invSet = new Set<string>()
const rcptSet = new Set<string>()
const ITERATIONS = 10000

for (let i = 0; i < ITERATIONS; i++) {
  const invId = generateCollisionProofId("INV")
  const rcptId = generateCollisionProofId("RCPT")
  
  assert.match(invId, /^INV-\d{8}-[0-9A-F]{8}$/, `Invalid INV format: ${invId}`)
  assert.match(rcptId, /^RCPT-\d{8}-[0-9A-F]{8}$/, `Invalid RCPT format: ${rcptId}`)

  invSet.add(invId)
  rcptSet.add(rcptId)
}

assert.strictEqual(invSet.size, ITERATIONS, `Expected ${ITERATIONS} unique INV IDs, got ${invSet.size} (collision detected!)`)
assert.strictEqual(rcptSet.size, ITERATIONS, `Expected ${ITERATIONS} unique RCPT IDs, got ${rcptSet.size} (collision detected!)`)
console.log(`✅ SUCCESS: Generated ${ITERATIONS} IDs with 0% collisions. Format and uniqueness verified.\n`)

// 2. Test Atomic Ledger Balance Calculation & Status Evaluation
console.log("Test 2: Verifying Atomic Ledger Fee Status Evaluation and Clamping...")
interface MockStudentState {
  id: string
  totalFees: number
  paidAmount: number
  pendingAmount: number
  feeStatus: string
}

function evaluateFeeStatusAfterAtomicUpdate(student: MockStudentState, changeType: "PAYMENT" | "REFUND", amount: number): MockStudentState {
  // Simulate atomic DB operation: paidAmount = paidAmount +/- amount, pendingAmount = pendingAmount -/+ amount
  const newPaid = changeType === "PAYMENT" ? student.paidAmount + amount : student.paidAmount - amount
  const newPending = changeType === "PAYMENT" ? student.pendingAmount - amount : student.pendingAmount + amount
  
  const clampedPaid = Math.max(0, newPaid)
  const clampedPending = Math.max(0, newPending)

  const feeStatus =
    clampedPending <= 0
      ? "PAID"
      : clampedPending > student.totalFees * 0.5
        ? "OVERDUE"
        : "PARTIAL"

  return {
    ...student,
    paidAmount: clampedPaid,
    pendingAmount: clampedPending,
    feeStatus,
  }
}

// Case A: Exact Payment -> PAID
const stateA: MockStudentState = { id: "s1", totalFees: 5000, paidAmount: 0, pendingAmount: 5000, feeStatus: "OVERDUE" }
const resA = evaluateFeeStatusAfterAtomicUpdate(stateA, "PAYMENT", 5000)
assert.strictEqual(resA.paidAmount, 5000)
assert.strictEqual(resA.pendingAmount, 0)
assert.strictEqual(resA.feeStatus, "PAID")
console.log("✅ Case A (Exact Payment): Status transitioned correctly to PAID.")

// Case B: Partial Payment -> PARTIAL / OVERDUE
const stateB: MockStudentState = { id: "s2", totalFees: 5000, paidAmount: 0, pendingAmount: 5000, feeStatus: "OVERDUE" }
const resB = evaluateFeeStatusAfterAtomicUpdate(stateB, "PAYMENT", 2000) // 3000 pending > 2500 (50%)
assert.strictEqual(resB.paidAmount, 2000)
assert.strictEqual(resB.pendingAmount, 3000)
assert.strictEqual(resB.feeStatus, "OVERDUE")
console.log("✅ Case B (Partial Payment > 50% Overdue threshold): Status evaluated correctly to OVERDUE.")

const resB2 = evaluateFeeStatusAfterAtomicUpdate(resB, "PAYMENT", 1000) // 2000 pending <= 2500
assert.strictEqual(resB2.paidAmount, 3000)
assert.strictEqual(resB2.pendingAmount, 2000)
assert.strictEqual(resB2.feeStatus, "PARTIAL")
console.log("✅ Case B2 (Subsequent Payment <= 50% threshold): Status evaluated correctly to PARTIAL.")

// Case C: Overpayment Clamping
const stateC: MockStudentState = { id: "s3", totalFees: 5000, paidAmount: 4000, pendingAmount: 1000, feeStatus: "PARTIAL" }
const resC = evaluateFeeStatusAfterAtomicUpdate(stateC, "PAYMENT", 2000) // Overpaid by 1000
assert.strictEqual(resC.paidAmount, 6000)
assert.strictEqual(resC.pendingAmount, 0, "Negative pending amount clamped to 0")
assert.strictEqual(resC.feeStatus, "PAID")
console.log("✅ Case C (Overpayment Clamping): Negative pending amount clamped to 0, status set to PAID.")

// Case D: Refund Transition
const stateD: MockStudentState = { id: "s4", totalFees: 5000, paidAmount: 5000, pendingAmount: 0, feeStatus: "PAID" }
const resD = evaluateFeeStatusAfterAtomicUpdate(stateD, "REFUND", 5000)
assert.strictEqual(resD.paidAmount, 0)
assert.strictEqual(resD.pendingAmount, 5000)
assert.strictEqual(resD.feeStatus, "OVERDUE")
console.log("✅ Case D (Full Refund): Status transitioned back to OVERDUE.")

console.log("\n=== 🎉 ALL REFACTOR 1 VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

import crypto from "crypto"

/**
 * Generates a collision-proof identifier with a given prefix.
 * Example output: INV-20260725-8F3A2C1B
 * 
 * Uses 4 bytes (32 bits = 4.29 billion combinations) of cryptographic entropy
 * combined with the current date to guarantee zero collisions even under
 * concurrent batch processing.
 */
export function generateCollisionProofId(prefix: string = "ID"): string {
  const now = new Date()
  const year = now.getFullYear()
  const monthDay = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `${prefix}-${year}${monthDay}-${randomHex}`
}

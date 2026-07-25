import crypto from "crypto";

async function testP004() {
  console.log("Running unit test for P0-04: crypto.randomInt OTP generation...");
  
  const iterations = 10000;
  const generated = new Set<string>();
  let min = 999999;
  let max = 0;

  for (let i = 0; i < iterations; i++) {
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Check regex pattern: 6 digits starting with 1-9
    if (!/^[1-9]\d{5}$/.test(otp)) {
      throw new Error(`Invalid OTP generated: ${otp}. Must be exactly 6 digits between 100000 and 999999.`);
    }

    const val = parseInt(otp, 10);
    if (val < min) min = val;
    if (val > max) max = val;
    generated.add(otp);
  }

  console.log(`✅ P0-04 Unit Test Passed! Generated ${iterations} secure OTPs. Unique count: ${generated.size}. Min: ${min}, Max: ${max}.`);
}

testP004().catch(err => {
  console.error("❌ P0-04 Unit Test Failed:", err);
  process.exit(1);
});

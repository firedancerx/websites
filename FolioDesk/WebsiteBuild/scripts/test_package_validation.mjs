import mysql from "mysql2/promise";

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== "string" || phone.trim() === "") return true;
  const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
  if (!phoneRegex.test(phone.trim())) return false;
  const digitCount = (phone.trim().match(/\d/g) || []).length;
  return digitCount >= 7;
}

async function testValidation() {
  console.log("=== Testing Email & Phone Format Validation ===");

  const invalidEmail = "itaaajurutera.com.my";
  const validEmail = "contact@jurutera.com.my";
  console.log(`Email '${invalidEmail}': ${isValidEmail(invalidEmail) === false ? "PASS (Rejected missing '@')" : "FAIL"}`);
  console.log(`Email '${validEmail}': ${isValidEmail(validEmail) === true ? "PASS (Accepted valid email)" : "FAIL"}`);

  if (isValidEmail(invalidEmail) || !isValidEmail(validEmail)) {
    console.error("Email validation test failed!");
    process.exit(1);
  }

  const invalidPhone = "+012345aass";
  const validPhone = "+60 12-345 6789";
  console.log(`Phone '${invalidPhone}': ${isValidPhone(invalidPhone) === false ? "PASS (Rejected letters in phone)" : "FAIL"}`);
  console.log(`Phone '${validPhone}': ${isValidPhone(validPhone) === true ? "PASS (Accepted valid phone)" : "FAIL"}`);

  if (isValidPhone(invalidPhone) || !isValidPhone(validPhone)) {
    console.error("Phone validation test failed!");
    process.exit(1);
  }

  console.log("=== Testing Database Package Records ===");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const conn = await mysql.createConnection(url);
  const [rows] = await conn.execute("SELECT * FROM packages WHERE is_active = 1");
  await conn.end();

  console.log(`Fetched ${rows.length} active packages from DB:`);
  rows.forEach((p) => console.log(` - [${p.package_code}] ${p.package_name}: RM ${p.unit_price_myr} (${p.billing_cycle})`));

  if (rows.length < 2) {
    console.error("Expected at least 2 seeded packages in DB!");
    process.exit(1);
  }

  console.log("SUCCESS: All email/phone format validation and package queries verified!");
}

testValidation().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

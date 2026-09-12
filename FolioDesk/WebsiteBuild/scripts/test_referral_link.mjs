async function run() {
  console.log("Testing referral link registration page auto-fill...");
  const testCode = "FDTEST123";
  const res = await fetch(`http://127.0.0.1:80/foliodesk/register?upline=${testCode}`);
  console.log(`HTTP Status: ${res.status}`);
  const text = await res.text();
  
  if (res.status === 200 && text.includes(testCode)) {
    console.log("SUCCESS: Upline affiliate code auto-filled in registration page HTML!");
  } else {
    console.error("FAILURE: Upline code not found in response HTML.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Error running test:", err);
  process.exit(1);
});

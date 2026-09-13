async function testAllAdminPages() {
  const baseUrl = (process.env.TEST_BASE_URL || "http://localhost:3000/foliodesk").replace(/\/$/, "");
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD are required");
  }
  console.log(`=== TESTING ADMIN & AFFILIATE PORTAL AT ${baseUrl} ===`);

  const adminForm = new FormData();
  adminForm.append('email', adminEmail);
  adminForm.append('password', adminPassword);

  const loginRes = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    body: adminForm,
    redirect: 'manual',
  });

  const rawCookie = loginRes.headers.get('set-cookie') || '';
  const cleanCookie = rawCookie.split(';')[0];
  console.log("Cookie obtained successfully.");

  const pages = [
    { url: `${baseUrl}/admin`, title: 'Affiliate Network' },
    { url: `${baseUrl}/admin/invoices`, title: 'Issued Tax Invoices' },
    { url: `${baseUrl}/admin/approvals`, title: 'Action Center' },
    { url: `${baseUrl}/admin/deals`, title: 'Sales Funnel' },
    { url: `${baseUrl}/portal`, title: 'Portal' },
  ];

  let failed = false;

  for (const page of pages) {
    console.log(`\nTesting ${page.url}...`);
    const res = await fetch(page.url, { headers: { cookie: cleanCookie } });
    console.log(`Status Code: ${res.status}`);
    const html = await res.text();
    console.log(`HTML Length: ${html.length} bytes`);
    if (res.status !== 200) {
      console.error(`FAILED: ${page.url} returned status ${res.status}`);
      failed = true;
    } else {
      console.log(`✓ SUCCESS: ${page.url}`);
    }
  }

  if (failed) {
    console.error("\n❌ VERIFICATION FAILED!");
    process.exit(1);
  } else {
    console.log("\n✅ ALL ENDPOINTS PASSED WITH HTTP 200 SUCCESS!");
  }
}

testAllAdminPages().catch(console.error);

async function testAllAdminPages() {
  console.log("=== TESTING ALL IIS ENDPOINTS FOR ADMIN & AFFILIATE PORTAL ===");

  const adminForm = new FormData();
  adminForm.append('email', 'admin@foliodesk.local');
  adminForm.append('password', 'ChangeMe!FolioDesk2026');

  const loginRes = await fetch('http://127.0.0.1:80/foliodesk/api/login', {
    method: 'POST',
    body: adminForm,
    redirect: 'manual',
  });

  const rawCookie = loginRes.headers.get('set-cookie') || '';
  const cleanCookie = rawCookie.split(';')[0];
  console.log("Cookie obtained successfully.");

  const pages = [
    { url: 'http://127.0.0.1:80/foliodesk/admin', title: 'Affiliate Network' },
    { url: 'http://127.0.0.1:80/foliodesk/admin/invoices', title: 'Issued Tax Invoices' },
    { url: 'http://127.0.0.1:80/foliodesk/admin/approvals', title: 'Action Center' },
    { url: 'http://127.0.0.1:80/foliodesk/admin/deals', title: 'Sales Funnel' },
    { url: 'http://127.0.0.1:80/foliodesk/portal', title: 'Portal' },
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

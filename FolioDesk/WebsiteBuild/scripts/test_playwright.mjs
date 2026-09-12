import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login');
  await page.screenshot({ path: 'D:\\Firedancerx\\OneDrive\\Work2026\\Mujib\\Work\\documentations\\v1\\screenshots\\test_login.png' });
  console.log('Successfully captured test_login.png!');

  await browser.close();
}

test().catch(err => {
  console.error('Playwright Test Error:', err);
  process.exit(1);
});

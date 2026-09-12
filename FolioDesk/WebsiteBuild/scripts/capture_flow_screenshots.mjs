import { chromium } from 'file:///C:/Users/omnitech/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'D:\\Firedancerx\\OneDrive\\Work2026\\Mujib\\Work\\documentations\\v1\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const routes = [
  // 1. Onboarding & Authentication
  { url: 'http://localhost:3000/foliodesk/register', filename: '01_01_applicant_registration_flow.png', title: '1.1 Applicant Registration & KYC Form' },
  { url: 'http://localhost:3000/foliodesk/login', filename: '01_02_login_authentication_flow.png', title: '1.2 Login Authentication' },
  { url: 'http://localhost:3000/foliodesk/roles/applicant', filename: '01_03_applicant_onboarding_status.png', title: '1.3 Applicant Onboarding Status Dashboard' },
  { url: 'http://localhost:3000/foliodesk/admin/approvals', filename: '01_04_admin_kyc_review_queue.png', title: '1.4 Admin KYC Application Review Queue' },
  { url: 'http://localhost:3000/foliodesk/admin/applications/1/correction', filename: '01_05_admin_kyc_correction_view.png', title: '1.5 Admin Document Correction View' },

  // 2. Affiliate Portal & Deal Pipeline
  { url: 'http://localhost:3000/foliodesk/portal', filename: '02_01_affiliate_portal_dashboard.png', title: '2.1 Affiliate Portal Master Dashboard' },
  { url: 'http://localhost:3000/foliodesk/portal/prospects', filename: '02_02_prospects_lead_filing.png', title: '2.2 Prospect Lead Filing & SLA Protection' },
  { url: 'http://localhost:3000/foliodesk/portal/prospects/1', filename: '02_03_funnel_stage_progression.png', title: '2.3 Funnel Milestone Advancement & Step Proof' },
  { url: 'http://localhost:3000/foliodesk/portal/change-password', filename: '02_04_affiliate_profile_settings.png', title: '2.4 Affiliate Profile & Password Settings' },

  // 3. Admin Deals, SLA & Appeals
  { url: 'http://localhost:3000/foliodesk/admin/deals', filename: '03_01_admin_deals_protection_queue.png', title: '3.1 Admin Deals SLA Queue & Force Closure' },
  { url: 'http://localhost:3000/foliodesk/admin/deals/1', filename: '03_02_admin_deal_detail_appeal_adjudication.png', title: '3.2 Admin Deal Detail & Appeal Adjudication' },

  // 4. Invoicing, Collections & Payouts
  { url: 'http://localhost:3000/foliodesk/admin/invoices', filename: '04_01_admin_invoices_attribution.png', title: '4.1 Admin Invoices & Target Attribution' },
  { url: 'http://localhost:3000/foliodesk/admin/collections', filename: '04_02_admin_collections_2tier_rate_lock.png', title: '4.2 Admin Collections & 2-Tier Rate Lock' },
  { url: 'http://localhost:3000/foliodesk/admin/payouts', filename: '04_03_admin_payout_batches_disbursement.png', title: '4.3 Admin Payout Batches & Settlement' },
  { url: 'http://localhost:3000/foliodesk/admin/settings', filename: '04_04_admin_system_settings.png', title: '4.4 Admin Global System Settings' },

  // 5. Visualizer & System Modules
  { url: 'http://localhost:3000/foliodesk/cash-cycle', filename: '05_01_cash_cycle_visualizer.png', title: '5.1 Cash Cycle Visualizer Engine' },
  { url: 'http://localhost:3000/foliodesk/platform', filename: '05_02_platform_overview.png', title: '5.2 Platform Overview' },
  { url: 'http://localhost:3000/foliodesk/genai', filename: '05_03_genai_module.png', title: '5.3 GenAI Automation Module' }
];

async function captureAll() {
  console.log('Launching Edge browser for automated flow screenshot capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const item of routes) {
    try {
      console.log(`Capturing: ${item.title} (${item.url})...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);
      const targetPath = path.join(SCREENSHOT_DIR, item.filename);
      await page.screenshot({ path: targetPath, fullPage: false });
      console.log(`Saved screenshot: ${item.filename}`);
    } catch (err) {
      console.warn(`Failed to capture ${item.url}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Finished capturing all flow screenshots successfully!');
}

captureAll().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});

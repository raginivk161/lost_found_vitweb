const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../server/src/db/database');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'report_images');

async function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    defaultViewport: { width: 1200, height: 750, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('1. Capturing Fig 4.2: Student Sign-In Interface...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_2_login.png') });

  console.log('2. Capturing Fig 4.8: Admin Login Portal...');
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_8_admin_login.png') });

  console.log('3. Logging in as Priya Patel (Student)...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'priya.patel2023@vit.edu');
  await page.type('input[type="password"]', 'Student@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 800));

  console.log('4. Capturing Fig 4.3: Student Central Dashboard...');
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_3_dashboard.png') });

  console.log('5. Capturing Fig 4.4: Lost and Found Reporting Interface with Secret Detail...');
  await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const foundBtn = btns.find(b => b.textContent.toLowerCase().includes('found'));
    if (foundBtn) foundBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => window.scrollTo(0, 350));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_4_report.png') });

  console.log('6. Capturing Fig 4.5: Match Inspection & 5-Factor Score Breakdown...');
  await page.goto('http://localhost:5173/matches/17', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_5_match_detail.png') });

  console.log('7. Capturing Fig 4.10: Persistent 6-Digit Handover Code & Unlocked Contact Card...');
  await page.evaluate(() => window.scrollTo(0, 480));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_10_handover_code.png') });

  console.log('8. Capturing Fig 4.11: Direct Gmail Webmail Pre-Composed Recovery Draft...');
  await page.evaluate(() => {
    const details = document.querySelector('details');
    if (details) details.open = true;
    window.scrollTo(0, 560);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_11_gmail_draft.png') });

  console.log('9. Capturing Fig 4.6: Ownership Claim Verification Interface (Step 1)...');
  await page.goto('http://localhost:5173/matches/16', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 420));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_6_claim_verification.png') });

  console.log('10. Capturing Fig 4.7: Locked Claim Notification after 3 Failed Attempts...');
  const db = getDb();
  // Temporarily set Match 16 to rejected
  db.prepare("UPDATE matches SET status = 'rejected' WHERE id = 16").run();
  await page.goto('http://localhost:5173/matches/16', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 420));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_7_locked_claim.png') });
  // Restore Match 16 to pending
  db.prepare("UPDATE matches SET status = 'pending' WHERE id = 16").run();

  console.log('11. Logging in as Campus Security Admin...');
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@vit.edu');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('12. Capturing Fig 4.9: Admin Flagged Claims Dispute Resolution Desk...');
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_9_admin_flagged_desk.png') });

  console.log('13. Capturing Fig 4.12: Handover Completion, Karma Credit & Photo Purge...');
  // Log in as Aarav Sharma who has returned Match 54
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'aarav.sharma2024@vit.edu');
  await page.type('input[type="password"]', 'Student@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });
  await page.goto('http://localhost:5173/matches/54', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, 'fig_4_12_handover_completion.png') });

  await browser.close();
  console.log('SUCCESS: All 11 figures have been saved to report_images/ !');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer-core');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1200, height: 750, deviceScaleFactor: 2 },
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'aarav.sharma2024@vit.edu');
  await page.type('input[type="password"]', 'Student@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });
  await page.goto('http://localhost:5173/matches/54', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, '..', 'report_images', 'fig_4_12_handover_completion.png') });
  await browser.close();
  console.log('fig_4_12 captured successfully!');
}

run().catch(console.error);

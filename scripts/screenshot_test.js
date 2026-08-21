const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--window-position=-32000,-32000'] });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36' });
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  console.log('Navigating...');
  await page.goto('https://embedindia.st/embed/admin/skysports-main-event/1', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Taking screenshot...');
  
  await page.screenshot({ path: path.join(__dirname, 'screenshot1.png'), fullPage: true });

  await page.click('body', { force: true });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: path.join(__dirname, 'screenshot2.png'), fullPage: true });

  await browser.close();
}

run().catch(console.error);

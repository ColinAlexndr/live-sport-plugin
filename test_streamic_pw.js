const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('response', async res => {
    if (res.url().includes('m3u8')) {
      console.log('RES:', res.url(), res.status());
    }
  });
  await page.goto('https://streami.fit/live/?channel_id=sky-sport-austria-1');
  await page.waitForTimeout(5000);
  await browser.close();
}
run();

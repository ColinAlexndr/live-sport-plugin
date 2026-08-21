const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.wasm') || url.includes('lock.js') || url.includes('.js')) {
      if (url.includes('lock.wasm')) {
        console.log('Got Wasm:', url);
        fs.writeFileSync('lock.wasm', await response.body());
      }
      if (url.includes('lock.js') || url.includes('gasm')) {
        console.log('Got JS:', url);
        fs.writeFileSync('lock.js', await response.body());
      }
    }
  });

  console.log('Navigating...');
  await page.goto('https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1');
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('Done');
})();

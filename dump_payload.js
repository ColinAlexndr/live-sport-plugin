const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    if (response.url().includes('/fetch')) {
      const buffer = await response.body();
      fs.writeFileSync('fetch_payload.bin', buffer);
      
      const headers = response.headers();
      fs.writeFileSync('fetch_headers.json', JSON.stringify(headers, null, 2));
      
      console.log('Saved fetch_payload.bin! Size:', buffer.length);
      console.log('Saved headers! Goat header:', headers['goat'] || headers['Goat']);
      await browser.close();
      process.exit(0);
    }
  });
  
  await page.goto('https://embed.st/embed/admin/ppv-celtic-vs-lask-linz/1');
})();

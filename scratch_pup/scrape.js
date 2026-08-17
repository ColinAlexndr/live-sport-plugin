const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept all network requests to look for m3u8
  await page.setRequestInterception(true);
  
  let foundM3u8 = null;
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('.m3u8')) {
      console.log('FOUND M3U8 DIRECTLY IN NETWORK:', url);
      console.log('Headers:', request.headers());
      foundM3u8 = url;
    }
    request.continue();
  });
  
  console.log('Navigating to watch page...');
  await page.goto('https://ntv.cx/watch/kobra/cracovia-vs-rak-w-cz-stochowa-2490222', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for iframe injection...');
  try {
      await page.waitForSelector('iframe#streamPlayer', { timeout: 15000 });
      const iframeElement = await page.$('iframe#streamPlayer');
      const iframeSrc = await page.evaluate(el => el.src, iframeElement);
      console.log('Found iframe source:', iframeSrc);
      
      console.log('Waiting another 10s to let the player load the m3u8...');
      await new Promise(r => setTimeout(r, 10000));
  } catch (e) {
      console.log('Iframe did not appear within 15 seconds.', e.message);
  }
  
  if (!foundM3u8) {
      console.log('No m3u8 found in network traffic.');
  }

  await browser.close();
})();

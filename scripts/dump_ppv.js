const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.route('**/*', route => {
    if (['image', 'stylesheet', 'font'].includes(route.request().resourceType())) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto('https://api.ppv.st/api/streams', { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  const jsonStr = await page.evaluate(() => document.body.innerText);
  
  try {
    const data = JSON.parse(jsonStr);
    const categoryObj = data.streams[0];
    console.log(categoryObj.category);
    console.log(categoryObj.streams[0].iframe);
    
    // Check if ANY of them contain embed.st
    let embedStCount = 0;
    data.streams.forEach(c => {
       c.streams.forEach(s => {
          if (s.iframe && s.iframe.includes('embed')) embedStCount++;
       });
    });
    console.log(`Found ${embedStCount} total streams with 'embed' in iframe URL.`);
  } catch(e) {
    console.log("Error parsing:", e);
  }
  
  await browser.close();
}

test();

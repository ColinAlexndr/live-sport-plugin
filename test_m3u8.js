const { chromium } = require('playwright');
const fs = require('fs');

const STREAM_URL = "https://lb8.strmd.st/secure/DhdrqtcYFHpDIMjtNEwsaxwKVkaZlIqu/rtmp/stream/bKb6nEceVDLnpv7bUo-GhltBlzKXUXvHPpL4ZlCq1xBKKGM_gN-rdzgoEc_w4S9_rpNfyGCwaTcR4g/1/playlist.m3u8";

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        extraHTTPHeaders: {
            'Referer': 'https://embed.st/',
            'Origin': 'https://embed.st'
        }
    });
    
    console.log('Fetching m3u8 playlist directly...');
    const page = await context.newPage();
    const response = await page.goto(STREAM_URL);
    
    console.log('Status:', response.status());
    const body = await response.text();
    console.log('Body snippet:');
    console.log(body.substring(0, 300));
    
    await browser.close();
})();

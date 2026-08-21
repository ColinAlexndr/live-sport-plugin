const { chromium, request } = require('playwright');

(async () => {
    console.log("Testing APIRequestContext against Cloudflare...");
    const browser = await chromium.launch({ headless: true });
    
    // We need a proper context with a valid user agent
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    });
    
    const reqContext = context.request;
    
    try {
        const response = await reqContext.post('https://embed.st/fetch', {
            headers: {
                'Referer': 'https://embed.st/embed/admin/ppv-celtic-vs-lask-linz/1',
                'Origin': 'https://embed.st'
            },
            data: Buffer.from("dummy data") // The WASM usually sends binary here
        });
        
        console.log("Status:", response.status());
        console.log("Goat header:", response.headers()['goat']);
    } catch(e) {
        console.error("Failed:", e);
    }
    
    await browser.close();
})();

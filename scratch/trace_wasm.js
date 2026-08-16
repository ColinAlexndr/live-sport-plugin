const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Intercept the WASM module creation
  await page.addInitScript(() => {
    // Evasions
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // WASM Hook
    const originalInstantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = async function(buffer, imports) {
      console.log('WASM Instantiated with imports:', Object.keys(imports));
      if (imports['./wasmgasm_bg.js']) {
        const bg = imports['./wasmgasm_bg.js'];
        for (const key of Object.keys(bg)) {
          if (typeof bg[key] === 'function') {
            const original = bg[key];
            bg[key] = function(...args) {
              console.log(`[WASM IMPORT CALLED] ${key}(${args.join(', ')})`);
              const res = original.apply(this, args);
              console.log(`[WASM IMPORT RETURNED] ${res}`);
              return res;
            }
          }
        }
      }
      return originalInstantiate.call(this, buffer, imports);
    };
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('https://embedindia.st/embed/247-south-park');
  
  // Wait a bit for decryption
  await page.waitForTimeout(5000);
  await browser.close();
})();

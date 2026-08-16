const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  
  // Read WASM as base64 so we can mock fetch easily
  const wasmBase64 = fs.readFileSync('scratch/gasm.wasm').toString('base64');
  let js = fs.readFileSync('scratch/real_gasm.js', 'utf8');
  js = js.replace(/import\.meta/g, '({url: "http://localhost/"})');
  js = js.replace(/export\s+function\s+([a-zA-Z0-9_]+)/g, 'window.$1 = function');
  js = js.replace(/export\s*\{[^}]+\};/g, 'window.WrLiSv = window.default;');  
  const html = `
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<script>
// Mock fetch to return the WASM
const wasmBase64 = "${wasmBase64}";
const wasmBuffer = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));

const originalFetch = window.fetch;
window.fetch = async (req, ...args) => {
  if (req && req.url && req.url.includes('wasmgasm.js')) {
    // Actually we can just let it fetch normally if we serve it, or we can just mock it
    return new Response("export default function() {}");
  }
  
  // They fetch gasm_bg.wasm
  return new Response(wasmBuffer, {
    headers: { 'Content-Type': 'application/wasm' }
  });
};

const originalInstantiate = WebAssembly.instantiateStreaming;
WebAssembly.instantiateStreaming = async function(res, imports) {
  const buf = await (await res).arrayBuffer();
  return WebAssembly.instantiate(buf, imports);
};

// Also mock their api call?
const origFetch = window.fetch;
window.fetch = async (...args) => {
    console.log("Fetch called with:", args);
    return origFetch(...args);
}
</script>
<script type="module">
${js}
WrLiSv().then(() => {
  console.log("WASM Initialized!");
  const encryptedHex = '302b46274f7b2f795c5a4f5a477a4a5f6b496c70282d6d275d656f4b2d675f304d7c2a5b4c4631282367266f672e5e2261475b24212e4c6321242c4c5f6e695b644a587c2a5a2b7d5c477b7c473064254e2d627a322c7e7a4f287c784d4771585c507d6f607b317b4f2e6c687a31654e666f65677d4d2a5d66496d2b62274b4f336d2e4f276b5b7c676f5b216b686b33637a24485f7c79484b26674e7c2d3064636b31582a71262b2a4f616a2f2f687a477e5454';
  const encryptedBuf = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  console.log("Calling set_stream_jw!");
  
  // In JSFuck it might expect the string directly if it parses it internally.
  // Wait, let's just pass the buffer? Or a string?
  // I will just pass encryptedHex first, or encryptedBuf if it wants Uint8Array.
  
  const encryptedStr = Array.from(encryptedBuf).map(c => String.fromCharCode(c)).join('');
  
  window.set_stream_jw(encryptedStr).then(res => {
    console.log("Decrypted result:", res);
  }).catch(e => console.error("set_stream_jw error:", e));

}).catch(e => console.error("WASM INIT ERROR:", e));
</script>
</body>
</html>
  `;
  
  await page.setContent(html);
  await page.waitForTimeout(2000);
  
  await browser.close();
})();

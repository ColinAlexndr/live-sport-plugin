const fs = require('fs');

class Window {}
class Document {}
global.Window = Window;
global.Document = Document;
Object.setPrototypeOf(global, Window.prototype);

global.window = global;
global.self = global;
global.location = { hostname: 'embed.st', href: 'https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1' };
global.document = new Document();
global.document.location = global.location;

const OriginalRequest = global.Request;
global.Request = function(input, init) {
  if (typeof input === 'string' && input.startsWith('/')) {
    input = 'https://embed.st' + input;
  }
  return new OriginalRequest(input, init);
};

const OriginalHeadersGet = global.Headers.prototype.get;
global.Headers.prototype.get = function(name) {
  console.log('[HOOK] Headers.get requested:', name);
  return OriginalHeadersGet.call(this, name);
};

global.document.createElement = () => ({ id: 'mocked-id' });
global.document.body = { appendChild: () => {} };
global.document.querySelector = () => ({ id: 'mocked-id' });
global.document.getElementById = () => ({ id: 'mocked-id' });

global.P2PEngineHls = {
  tryRegisterServiceWorker: () => Promise.resolve()
};
global.Clappr = {
  Player: class {
    constructor(options) {
      console.log('Clappr Player instantiated with options:', JSON.stringify(options, null, 2));
    }
  }
};
global.navigator = { userAgent: 'Mozilla' };

global.WebAssembly.instantiateStreaming = async (resp, importObject) => {
  const r = await resp;
  const buffer = await r.arrayBuffer();
  console.log('Instantiating WebAssembly with imports:', Object.keys(importObject));
  if (importObject['./locked_bg.js']) {
    console.log('locked_bg.js imports:', Object.keys(importObject['./locked_bg.js']).length);
    // Let's hook all functions to trace what it calls!
    const bg = importObject['./locked_bg.js'];
    for (const key of Object.keys(bg)) {
      if (typeof bg[key] === 'function') {
        const orig = bg[key];
        bg[key] = function(...args) {
          if (args[1] === 'source' && typeof args[2] === 'string' && args[2].includes('.m3u8')) {
             console.log('\n==================================================');
             console.log('SUCCESS! DECRYPTED STREAM URL:');
             console.log(args[2]);
             console.log('==================================================\n');
             process.exit(0);
          }
          try {
             return orig.apply(this, args);
          } catch(e) {
             throw e;
          }
        };
      }
    }
  }
  return global.WebAssembly.instantiate(buffer, importObject);
};

const originalFetch = global.fetch;
global.fetch = async (url, opts) => {
  const urlStr = typeof url === 'string' ? url : (url.url || url.href);
  console.log('Intercepted fetch:', urlStr);
  if (urlStr.includes('lock.wasm')) {
    const wasmBuffer = fs.readFileSync('lock.wasm');
    return new Response(wasmBuffer, {
      status: 200,
      headers: { 'Content-Type': 'application/wasm' }
    });
  }
  if (urlStr.includes('/fetch')) {
    console.log('Returning mocked embed.st/fetch payload');
    const buffer = fs.readFileSync('fetch_payload.bin');
    const savedHeaders = JSON.parse(fs.readFileSync('fetch_headers.json', 'utf8'));
    
    return new Response(buffer, {
      status: 200,
      headers: savedHeaders
    });
  }
  return new Response('Not found', { status: 404 });
};

(async () => {
  try {
    const lock = await import('./lock.js');
    console.log('Imported lock.js!');
    console.log(Object.keys(lock));
    
    // Attempt initialization
    await lock.default(); // wasm-bindgen default export usually initializes it
    console.log('Initialized!');
    
    const user = process.argv[2] || 'admin';
    const event = process.argv[3] || 'ppv-barcelona-vs-al-ahly';
    const id = process.argv[4] || '1';
    
    lock.set_stream(user, event, id);
    console.log('Called set_stream');
  } catch (err) {
    console.error('Import error:', err);
  }
})();

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

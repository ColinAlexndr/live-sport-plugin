const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class Window {}
class Document {}
global.Window = Window;
global.Document = Document;
Object.setPrototypeOf(global, Window.prototype);

global.window = global;
global.self = global;
const fullEmbedUrl = process.argv[5] || "https://embedindia.st/embed/laliga/2026-08-19/atm-mcf?gid=Ad7PiU9cdsfFnGyv%2FdNpxC2Cl9IM6lAGzsmUGAtIggr7j4DU3ZPcV0aMzrHKiqti%2BHwM4E2NSCpEjPeEyUsycp1hoOtzLIiczZq%2BOh0Z6oIjpXhlMoHTw4BJJzok2dl2%2BngePrAgWVK91bAf%2F7r5uLVn3C22nQeEtMuGkwPSCL9N%2FOJRu7QQIWhrj0u6vS9P6xI4zY7Camr086aVvxceN5PLsHdMUrArZ%2FlGihTwUPrtmnIasjkVg3I3cUHb5Vm27Lol3abUdhGcHwAIeccr9H%2BF%2FozqV1xq1eAd90772zcExTa6kYLdV4mfJzQCsL4tHpYtZ7CRXZRN%2FcOUepxgNT18%2BqfihGAMVipRr1cpIKqA8e1nhqwzxMO9s7O9XZCjqX5Yj1NUvVk7ZxF%2BsAU2gTqEqX7UWHaPJmidzK4VQl2UliHI9jYiWHuAmZ54ZOHVLx2YrWQ7yLCdAiBvaK1BiFVsQ%2FEQObaMO6caD3KXOQPwCyuX074JULBpjzONj1JCPusOe208071YNsUFNUzdrbcZCMny2ug%2Fwn8sWIfm%2BEqolgf3La1jA%2Bb0vsB8ct2h3BEWqW4SNAh87CEJY15isERy56kartJPt83zo8ybdnTWIWoxXF%2BrMoC%2BJ%2BFUofIWcvrWVUQa8G4jEtuciN2ISMs6MSNxt2G8sf0Jd%2FvtJYJkzT6Br%2BFReIneuvipRy2gT%2F7RWrPEJuitE0KZIYW%2B2zFt71KtkKboTVWPiVR6pwnQacXP8ZMyJVkquSFKnndJRVQN3VYd%2BLJX4%2FrFi8GyxV0OTbXW9v0kxnuLxWSy0f9hrnG5lB53CSbcyPJRxvRYH5Oj1CHvoXdCw0qLg0J5p4NeKMo1%2BXjuZhHGB8TMAPGtava1NHF6hdpu%2FyD4B9DH%2Fq6xo4KOIBG5FX%2F9TxwnRT%2B41EXa2%2FiLbk0b1o1KHYEjGM6KPo942rAHqELcsKlsw47%2BbFCqjn9hUkg6%2BsEXyPGsMKNcL9coZtc%2F%2BLAR27zY9xG9HyeF4UajWYIVqRPad%2BcqaC4LtlLktP%2FH5QoEwK7WpPm8Vfp6y2AO2ulSD16UFz96mEGQ%2FN13DZd0J6yR9H4LHBPmXNTmgkUXNnTFvgauK4D%2B9ZlsegFwhplAn6LcniesUFND0VT3bXE%2B81DRWwLBlBGdY1PGBa7cSIdM8kAUqcTf4to%2B%2BVw9eXh4XiBUGt4t%2BvN4Vid5iVAFiYzjaAmAXjX0XkJz1Ey%2FVUrKIhM9Q5JWByilzFeukFtQrqsRw69QseSM6eKWucUicfe6LG6xr2eZZbHUMDsPjcjPDVdEXZLpGWL7M2jEqrZrp12%2FYP25MNuOBIaGP3pB0gZQ0pFdUt8s8xil4POUcovq71RGx58leBAahlLxNXTlU24Rv9%2B3kCa8lpr8fdqjfBizCKwOL2n9mdrpfPJ8Xft6j7pVHHMS43OYZ8kWPE7fhwdYAGoe6sXAB6s25tdo8iK6GF%2BGqPyJAU%2BlmuOvqqIIV8Brdek%2BjOxh%2FrNASSFda4cUAwUixzqjO%2Bvilo%2B8SWZUzaeEALBNz7xSEl%2FrhiXqi0h3NIKyK9wtldqlrjkPADqeJreAOJAgTDje51%2FdfZ2Rg5lrsetfinaqUbVFkj2JQHLK1JTC9GxDWdL0oqzaVl6Y9YLdDsUL6nPuTM0AcyuBgUrdBWD6h%2BfJVTgLG1Y20w%3D%3D";
let targetOrigin = 'https://embedindia.st';
let hostName = 'embedindia.st';
let searchParams = '';
let pathName = '/embed/admin/dummy/1';
if (fullEmbedUrl) {
    try {
        const u = new URL(fullEmbedUrl);
        targetOrigin = u.origin;
        hostName = u.hostname;
        searchParams = u.search;
        pathName = u.pathname;
    } catch(e) {}
}

global.location = { 
  hostname: hostName, 
  href: fullEmbedUrl,
  search: searchParams,
  pathname: pathName
};
global.document = new Document();
global.document.location = global.location;
global.crypto = require('crypto').webcrypto;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.btoa = (str) => Buffer.from(str).toString('base64');
global.atob = (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString();

const OriginalRequest = global.Request;
global.Request = function(input, init) {
  if (typeof input === 'string' && input.startsWith('/')) {
    input = targetOrigin + input;
  }
  return new OriginalRequest(input, init);
};

let capturedGoat = null;

const OriginalHeadersGet = global.Headers.prototype.get;
global.Headers.prototype.get = function(name) {
  if (name.toLowerCase() === 'goat') return capturedGoat;
  return OriginalHeadersGet.call(this, name);
};

global.document.createElement = () => ({ id: 'mocked-id' });
global.document.body = { appendChild: () => {} };
global.document.querySelector = () => ({ id: 'mocked-id' });
global.document.getElementById = () => ({ id: 'mocked-id' });
global.P2PEngineHls = { tryRegisterServiceWorker: () => Promise.resolve() };
global.Clappr = { Player: class { constructor() {} } };
global.navigator = { userAgent: 'Mozilla' };

global.WebAssembly.instantiateStreaming = async (resp, importObject) => {
  const r = await resp;
  const buffer = await r.arrayBuffer();
  
  // Hook the exports to catch the string (m3u8 URL) when it's passed back to JS
  if (importObject['./gasm_new.js']) {
    const bg = importObject['./gasm_new.js'];
    for (const key of Object.keys(bg)) {
      if (typeof bg[key] === 'function') {
        const orig = bg[key];
        bg[key] = function(...args) {
          for (const arg of args) {
              if (typeof arg === 'string' && arg.includes('.m3u8')) {
                  console.log(`[FOUND M3U8] ${arg}`);
                  process.exit(0);
              }
          }
          try { return orig.apply(this, args); } 
          catch(e) { throw e; }
        };
      }
    }
  }
  return global.WebAssembly.instantiate(buffer, importObject);
};

global.fetch = async (url, opts) => {
  const urlStr = typeof url === 'string' ? url : (url.url || url.href);
  console.log(`[WASM] Intercepted fetch: ${urlStr}`);
  
  if (urlStr.includes('gasm.wasm')) {
    const wasmBuffer = fs.readFileSync(path.join(__dirname, '..', 'gasm_new.wasm'));
    return new Response(wasmBuffer, { status: 200, headers: { 'Content-Type': 'application/wasm' } });
  }
  
  if (urlStr.includes('/fetch')) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    });
    const reqContext = context.request;
    
    let reqBody = opts ? opts.body : (url.body ? await url.arrayBuffer() : undefined);
    if (url.arrayBuffer && typeof url.arrayBuffer === 'function' && !reqBody) {
      reqBody = await url.arrayBuffer();
    }
    
    const refererUrl = fullEmbedUrl || `${targetOrigin}/embed/${process.argv[2]}/${process.argv[3]}/${process.argv[4]}`;
    
    try {
      console.log(`[WASM] Fetching POST ${targetOrigin}/fetch`);
      const response = await reqContext.post(`${targetOrigin}/fetch`, {
        headers: {
            'Referer': refererUrl,
            'Origin': targetOrigin
        },
        data: reqBody ? Buffer.from(reqBody) : undefined
      });
      
      console.log(`[WASM] /fetch response status: ${response.status()}`);
      const responseBody = await response.body();
      capturedGoat = response.headers()['goat'];
      console.log(`[WASM] /fetch goat header: ${capturedGoat ? 'FOUND' : 'MISSING'}`);
      await browser.close();
      
      return new Response(responseBody, { status: response.status() });
    } catch (e) {
      console.error(`[WASM] Playwright POST error: ${e.message}`);
      await browser.close();
      throw e;
    }
  }
  
  return new Response('Not found', { status: 404 });
};

(async () => {
  try {
    const gasm = await import('../gasm_new.js');
    await gasm.default();
    
    const user = process.argv[2] || "laliga";
    const event = process.argv[3] || "2026-08-19";
    const id = process.argv[4] || "atm-mcf";
    
    console.log(`[WASM] Initiating decryption using gasm_new.js for ${user}/${event}/${id}...`);
    await gasm.HQ83VtA(user, event, id);
    
    // Give it a moment just in case
    await new Promise(r => setTimeout(r, 10000));
  } catch (err) {
    console.error('CRASH:', err.message || err);
    process.exit(1);
  }
})();

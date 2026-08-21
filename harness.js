const { JSDOM } = require('jsdom');
const fs = require('fs');

const dom = new JSDOM('<div id="player"></div>', {
  url: 'https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1',
  referrer: 'https://embed.st/',
  contentType: 'text/html',
  includeNodeLocations: true,
  runScripts: 'dangerously'
});

const window = dom.window;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.self = window;
global.URL = window.URL;
global.atob = window.atob;
global.btoa = window.btoa;
global.TextEncoder = window.TextEncoder;
global.TextDecoder = window.TextDecoder;

global.fetch = async (url, opts) => {
  console.log('Intercepted fetch:', url, opts);
  if (url.includes('/fetch')) {
    // Actually fetch the real encrypted blob from embed.st
    console.log('Fetching real blob from embed.st');
    const realResp = await require('node-fetch')(url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body
    });
    const buffer = await realResp.buffer();
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    };
  }
  return window.fetch(url, opts);
};

const code = fs.readFileSync('lock.js', 'utf8');

// Load lock.wasm via file system to mock fetch for WASM
const wasmBuffer = fs.readFileSync('lock.wasm');
global.fetch = async (url, opts) => {
  console.log('fetch():', url);
  if (url.includes('lock.wasm')) {
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength),
      headers: { get: () => 'application/wasm' }
    };
  }
  if (url.includes('/fetch')) {
    const realResp = await fetch('https://embed.st/fetch', {
      method: opts.method,
      headers: opts.headers,
      body: opts.body
    });
    const buffer = await realResp.arrayBuffer();
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer
    };
  }
};

window.eval(code);

setTimeout(() => {
  console.log('Keys in window:', Object.keys(window).filter(k => k.includes('init') || k.includes('stream') || k.includes('wasm')));
}, 1000);

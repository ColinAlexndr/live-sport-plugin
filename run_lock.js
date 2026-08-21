const fs = require('fs');

global.window = global;
global.self = global;
global.document = {
  getElementById: () => ({ remove: () => {} }),
  createElement: () => ({}),
  body: { appendChild: () => {} }
};

global.fetch = async (url, opts) => {
  console.log('Intercepted fetch:', url);
  if (url.includes('lock.wasm')) {
    const wasmBuffer = fs.readFileSync('lock.wasm');
    return {
      ok: true,
      arrayBuffer: async () => wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength),
      headers: { get: () => 'application/wasm' }
    };
  }
  if (url.includes('/fetch')) {
    const realResp = await require('node-fetch')('https://embed.st/fetch', {
      method: opts.method,
      headers: opts.headers,
      body: opts.body
    });
    const buffer = await realResp.buffer();
    return {
      ok: true,
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    };
  }
  return { ok: false };
};

const code = fs.readFileSync('lock.js', 'utf8')
  .replace(/import\.meta/g, '({url:""})')
  .replace(/export default function/g, 'function defaultExport')
  .replace(/export function ([a-zA-Z0-9_]+)/g, 'global.$1 = function ')
  .replace(/export\s*\{[^}]+\}/g, '');
fs.writeFileSync('lock_patched.js', code);
try {
  eval(code);
  console.log('Loaded lock.js');
  console.log('Global keys:', Object.keys(global).filter(k => typeof global[k] === 'function'));
} catch (e) {
  console.error('Eval error:', e);
}

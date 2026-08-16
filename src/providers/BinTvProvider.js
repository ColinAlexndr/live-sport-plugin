const BaseProvider = require('./BaseProvider');
const MatchEntity = require('../domain/MatchEntity');
const StreamEntity = require('../domain/StreamEntity');
const { BASE_URL } = require('../config');
const vm = require('vm');

let cachedWasmBase64 = null;
let cachedJsCode = null;

class BinTvProvider extends BaseProvider {
  constructor(opts) {
    super(opts);
    this.name = 'BinTv';
    this.mainUrl = 'https://api.ppv.st/api/streams';
    
    this.fetchMain = this.circuitBreaker.wrap(`${this.name}_fetchMain`, async () => {
      const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36' };
      const res = await fetch(this.mainUrl, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    });
  }

  async getMatches() {
    const matches = [];
    try {
      const data = await this.fetchMain.fire();
      if (data && Array.isArray(data.streams)) {
        data.streams.forEach(categoryObj => {
          if (Array.isArray(categoryObj.streams)) {
            categoryObj.streams.forEach((s) => {
              const title = s.name || `Event ${s.id}`;
              const sources = [];
              if (s.iframe) {
                sources.push({ source: 'bintv', id: s.uri_name || s.id.toString(), url: s.iframe });
              }
              if (Array.isArray(s.substreams)) {
                s.substreams.forEach(sub => {
                  if (sub.iframe) {
                    sources.push({ source: 'bintv', id: sub.uri_name || sub.id.toString(), url: sub.iframe });
                  }
                });
              }
              if (sources.length > 0) {
                let cat = s.category_name || categoryObj.category || 'other';
                matches.push(new MatchEntity({
                  id: `bintv_${s.id}`,
                  title: title,
                  category: this.normalizeCategory(cat),
                  date: s.starts_at ? (s.starts_at * 1000).toString() : Date.now().toString(),
                  popular: '0',
                  sources: sources,
                  thumbnail_url: s.poster || ''
                }));
              }
            });
          }
        });
      }
    } catch (e) {
      console.error(`[${this.name}] Error fetching PPV JSON:`, e.message);
    }
    return matches;
  }

  async loadWasmDependencies() {
    if (cachedWasmBase64 && cachedJsCode) return { wasmBase64: cachedWasmBase64, jsCode: cachedJsCode };
    
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    
    // Fetch WASM
    const wasmRes = await fetch('https://assets.embedindia.st/js/wasm/gasm.wasm', { headers });
    if (!wasmRes.ok) throw new Error("Failed to fetch gasm.wasm");
    const wasmBuffer = await wasmRes.arrayBuffer();
    cachedWasmBase64 = Buffer.from(wasmBuffer).toString('base64');
    
    // Fetch JS
    const jsRes = await fetch('https://assets.embedindia.st/js/wasm/gasm.js', { headers });
    if (!jsRes.ok) throw new Error("Failed to fetch gasm.js");
    let jsCode = await jsRes.text();
    
    // Strip module exports and import.meta so it runs cleanly in vm
    jsCode = jsCode.replace(/import\.meta/g, '{}');
    jsCode = jsCode.replace(/export function /g, 'function ');
    jsCode = jsCode.replace(/export class /g, 'class ');
    jsCode = jsCode.replace(/export const /g, 'const ');
    jsCode = jsCode.replace(/export default[^;]+;/g, '');
    jsCode = jsCode.replace(/export\s*\{[^}]+\};?/g, '');
    
    cachedJsCode = jsCode;
    return { wasmBase64: cachedWasmBase64, jsCode: cachedJsCode };
  }

  async extractDirectUrl(watchUrl) {
    const urlObj = new URL(watchUrl);
    const streamId = urlObj.pathname.split('/embed/')[1];
    const { wasmBase64, jsCode } = await this.loadWasmDependencies();

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for jwplayer.setup')), 8000);

        const sandbox = {
            console: console,
            resolve: (val) => { clearTimeout(timeout); resolve(val); },
            reject: (err) => { clearTimeout(timeout); reject(err); },
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
            atob: atob,
            TextEncoder: TextEncoder,
            TextDecoder: TextDecoder,
            URL: URL,
            Request: Request,
            Response: Response,
            Uint8Array: Uint8Array,
            Promise: Promise,
            Buffer: Buffer,
            sharedWasmBase64: wasmBase64,
            nodeFetch: async (input, init) => {
                const headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'Origin': 'https://embedindia.st',
                    'Referer': 'https://embedindia.st/'
                };
                if (input instanceof Request) {
                    input.headers.forEach((v, k) => headers[k] = v);
                }
                if (init && init.headers) {
                    if (init.headers instanceof Headers) {
                        init.headers.forEach((v, k) => headers[k] = v);
                    } else {
                        Object.assign(headers, init.headers);
                    }
                }
                const url = typeof input === 'string' ? input : input.url;
                const method = init?.method || (input instanceof Request ? input.method : 'GET');
                let body = init?.body;
                if (!body && input instanceof Request && method !== 'GET' && method !== 'HEAD') {
                    body = await input.clone().arrayBuffer();
                }
                const fetchOptions = { ...init, method, headers };
                if (body) fetchOptions.body = body;
                const res = await fetch(url, fetchOptions);
                return res;
            }
        };

        const vmContext = vm.createContext(sandbox);

        // Add globals inside the context
        vm.runInContext(`
            globalThis.global = globalThis;
            globalThis.self = globalThis;
            globalThis.window = new Proxy(globalThis, {
                get: (t, p) => {
                    if (typeof p === 'string' && !(p in t) && p !== 'Math' && p !== 'Object' && p !== 'then') {
                        console.log('GLOBAL MISSING ACCESS:', p);
                    }
                    return t[p];
                }
            });
            globalThis.navigator = { 
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                maxTouchPoints: 0,
                deviceMemory: 8,
                platform: 'Win32',
                hardwareConcurrency: 8,
                mimeTypes: [{ type: 'application/pdf' }, { type: 'text/pdf' }],
                plugins: [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }, { name: 'Native Client' }]
            };
            globalThis.location = {
                href: 'https://embedindia.st/embed/${streamId}',
                protocol: 'https:',
                host: 'embedindia.st',
                hostname: 'embedindia.st'
            };
            const glConstants = {
                VENDOR: 7936,
                RENDERER: 7937,
                VERSION: 7938,
                SHADING_LANGUAGE_VERSION: 35724,
                ALIASED_LINE_WIDTH_RANGE: 33902,
                ALIASED_POINT_SIZE_RANGE: 33901,
                ALPHA_BITS: 3413,
                BLUE_BITS: 3412,
                DEPTH_BITS: 3414,
                GREEN_BITS: 3411,
                MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
                MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
                MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
                MAX_RENDERBUFFER_SIZE: 34024,
                MAX_TEXTURE_IMAGE_UNITS: 34930,
                MAX_TEXTURE_SIZE: 3379,
                MAX_VARYING_VECTORS: 36348,
                MAX_VERTEX_ATTRIBS: 34921,
                MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
                MAX_VERTEX_UNIFORM_VECTORS: 36347,
                RED_BITS: 3410,
                STENCIL_BITS: 3415
            };
            const _contextHandler = {
                get: (t, p) => {
                    if (p in glConstants) return glConstants[p];
                    if (p === 'getExtension') return (name) => {
                        if (name === 'WEBGL_debug_renderer_info') return {
                            UNMASKED_VENDOR_WEBGL: 37445,
                            UNMASKED_RENDERER_WEBGL: 37446
                        };
                        return { loseContext: () => {} };
                    };
                    if (p === 'getParameter') return (id) => {
                        if (id === 7936 || id === 37445) return "Google Inc. (Apple)"; // VENDOR
                        if (id === 7937 || id === 37446) return "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)"; // RENDERER
                        if (id === 7938) return "WebGL 1.0 (OpenGL ES 2.0 Chromium)"; // VERSION
                        if (id === 35724) return "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)"; // SHADING_LANGUAGE_VERSION
                        if (id === 33902 || id === 33901) return new Float32Array([1, 1]); // ALIASED_LINE_WIDTH_RANGE
                        return 8;
                    };
                    if (p === 'getSupportedExtensions') return () => ["WEBGL_debug_renderer_info"];
                    return t[p] || (() => ({}));
                }
            };
            const _elementHandler = {
                get: (t, p) => {
                    if (p === 'getContext') return () => new Proxy({}, _contextHandler);
                    if (p === 'toDataURL') return () => "data:image/png;base64,...";
                    return t[p] || (() => ({}));
                }
            };
            globalThis.document = {
                location: globalThis.location,
                createElement: (tag) => {
                    return new Proxy({ style: {}, width: 0, height: 0 }, _elementHandler);
                },
                getElementById: () => ({ getAttribute: () => "", setAttribute: () => {} }),
                head: { appendChild: () => {} },
                querySelector: () => null
            };
            const _handler = {
                get: (t, p) => {
                    return t[p];
                }
            };
            globalThis.document = new Proxy(globalThis.document, _handler);
            globalThis.navigator = new Proxy(globalThis.navigator, _handler);
            globalThis.P2PEngineHls = { tryRegisterServiceWorker: () => Promise.resolve() };
            globalThis.jwplayer = () => ({
                setup: (config) => {
                    clearTimeout(${timeout[Symbol.toPrimitive]()});
                    resolve(config.file);
                },
                once: () => {}
            });
        `, vmContext);

        vm.runInContext(jsCode, vmContext);

        vm.runInContext(`
            globalThis.window = globalThis;
            
            const binaryString = atob(globalThis.sharedWasmBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            globalThis.fetch = async (input, init) => {
                if (typeof input === 'string') {
                    input = new URL(input, 'https://embedindia.st/embed/${streamId}').href;
                }
                return globalThis.nodeFetch(input, init);
            };

            class MockRequest extends Request {
                constructor(input, init) {
                    if (typeof input === 'string') {
                        input = new URL(input, 'https://embedindia.st/embed/${streamId}').href;
                    }
                    super(input, init);
                }
            }
            globalThis.Request = MockRequest;

            const origInstantiate = WebAssembly.instantiate;
            WebAssembly.instantiate = function(buffer, imports) {
                if (imports && imports["./wasmgasm_bg.js"]) {
                    const wbg = imports["./wasmgasm_bg.js"];
                    for (const key in wbg) {
                        if (typeof wbg[key] === 'function' && key.includes('instanceof')) {
                            wbg[key] = function() { return true; };
                        }
                    }
                }
                return origInstantiate.call(this, buffer, imports);
            };

            (async () => {
                try {
                    const wasm = await WrLiSv(bytes.buffer);
                    console.log("WASM EXPORTS:", Object.keys(wasm));
                    const streamId = "${streamId}";
                    const streamBytes = new TextEncoder().encode(streamId);
                    const ptr = wasm.__wbindgen_malloc(streamBytes.length, 1);
                    const mem = new Uint8Array(wasm.memory.buffer);
                    mem.set(streamBytes, ptr);
                    
                    if (wasm.__wbindgen_start) wasm.__wbindgen_start();
                    if (wasm.init_wasm) wasm.init_wasm();

                    setTimeout(() => {
                        try {
                            const ret = wasm.set_stream_jw(ptr, streamBytes.length, 4);
                            if (ret instanceof Promise) ret.catch(e => {});
                        } catch (e) {}
                    }, 100);
                } catch (e) {
                    // Ignore instantiation failures, handled by timeout if broken
                }
            })();
        `, vmContext);
    });
  }

  async resolveStream(sourceId, matchCategory, matchTitle) {
    const streams = [];
    try {
      const matches = await this.getMatches();
      const match = matches.find(m => m.id === `bintv_${sourceId}` || m.sources.some(s => s.id === sourceId));
      let watchUrl = '';
      
      if (match) {
        const src = match.sources.find(s => s.id === sourceId);
        if (src && src.url) watchUrl = src.url;
      }
      
      if (watchUrl) {
        let directUrl = '';
        try {
            console.log(`[BinTv] Extracting direct stream from WASM for ${watchUrl}...`);
            directUrl = await this.extractDirectUrl(watchUrl);
            console.log(`[BinTv] Successfully extracted direct stream: ${directUrl}`);
        } catch (e) {
            console.error(`[BinTv] Failed to extract WASM URL, falling back to Web Player: ${e.message}`);
        }

        if (directUrl) {
            streams.push(new StreamEntity({
                name: `BinTv Direct`,
                title: `BinTV Direct (${sourceId.split('/').pop()})`,
                /* url: directUrl, */
                behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: {
                        "request": {
                            "Origin": "https://embedindia.st",
                            "Referer": "https://embedindia.st/",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
                        }
                    }
                }
            }));
        } else {
            streams.push(new StreamEntity({
                name: `Nuvio Web Player`,
                title: `BinTV (${sourceId.split('/').pop()})`,
                externalUrl: `${BASE_URL}/watch?url=${encodeURIComponent(watchUrl)}&title=${encodeURIComponent(matchTitle || 'Live Event')}`
            }));
        }
      }
    } catch (err) {
      console.error(`[${this.name}] resolveStream failed for ${sourceId}:`, err.message);
    }
    return streams;
  }
}

module.exports = BinTvProvider;

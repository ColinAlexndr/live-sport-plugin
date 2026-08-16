const fs = require('fs');

global.window = global;
global.document = {
  createElement: () => ({ style: {} }),
  getElementById: () => null,
  head: { appendChild: () => {} },
  querySelector: () => null
};
global.navigator = { userAgent: "Node" };
global.location = { href: "https://embedindia.st/embed/247-south-park", protocol: "https:", host: "embedindia.st", hostname: "embedindia.st" };
global.P2PEngineHls = {
    tryRegisterServiceWorker: () => Promise.resolve()
};
global.jwplayer = () => {
    return {
        setup: (config) => {
            console.log("JWPLAYER SETUP CALLED WITH CONFIG:", config);
        }
    };
};

const origReject = Promise.reject;
Promise.reject = function(reason) {
    console.error("Promise.reject called with:", typeof reason, reason);
    console.error(new Error().stack);
    return origReject.call(this, reason);
};

const originalFetch = global.fetch;
global.fetch = async (...args) => {
    if (String(args[0]).includes('.wasm')) {
        return {
            ok: true,
            status: 200,
            arrayBuffer: async () => fs.readFileSync('scratch/gasm.wasm')
        };
    }
    console.log("Real fetch called with:", args[0], args[1]);
    return originalFetch(...args);
};

const OriginalRequest = global.Request;
global.Request = class Request extends OriginalRequest {
    constructor(input, init) {
        if (typeof input === 'string' && input.startsWith('/')) {
            input = 'https://embedindia.st' + input;
        }
        super(input, init);
    }
};

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.btoa = str => Buffer.from(str, 'binary').toString('base64');
global.atob = str => Buffer.from(str, 'base64').toString('binary');
global.crypto = require('crypto').webcrypto;

// Proxy Uint8Array
global.Uint8Array = new Proxy(Uint8Array, {
    apply(target, thisArg, argumentsList) {
        return new target(...argumentsList);
    }
});

let capturedImports = null;
let instantiateResolve = null;
const OriginalInstantiate = WebAssembly.instantiate;
const origInstantiate = WebAssembly.instantiate;
WebAssembly.instantiate = function(buffer, imports) {
    if (imports && imports["./wasmgasm_bg.js"]) {
        console.log("Captured WASM imports via instantiate!");
        console.log("Captured imports keys:", Object.keys(imports));
        
        capturedImports = imports;
        return new Promise(r => { instantiateResolve = r; });
    }
    return origInstantiate.call(this, buffer, imports);
};

WebAssembly.instantiateStreaming = async function(responsePromise, imports) {
    if (imports && imports["./wasmgasm_bg.js"]) {
        console.log("Captured WASM imports via instantiateStreaming!");
        capturedImports = imports;
        return new Promise(r => { instantiateResolve = r; });
    }
    return OriginalInstantiateStreaming(responsePromise, imports);
};

let gasmJs = fs.readFileSync('scratch/real_gasm.js', 'utf8');

try {
  gasmJs = gasmJs.replace(/import\.meta/g, '({url: "http://localhost/wasmgasm.js"})');
  gasmJs = gasmJs.replace(/export\s+function/g, 'function');
  gasmJs = gasmJs.replace(/export\s*\{[^}]+\};/g, 'window.WrLiSv = WrLiSv; window.HQ83VtA = HQ83VtA; window.set_stream_jw = set_stream_jw;');
  
  eval(gasmJs);
  // Start the WASM load!
  window.WrLiSv().catch(e => console.error("WrLiSv error:", e));
} catch(e) {
  console.error("Error executing JS:", e);
}

setTimeout(() => {
    if (!capturedImports) {
        console.error("Failed to capture imports!");
        return;
    }
    
    // Now WE instantiate the WASM with the captured imports!
    console.log("Captured imports keys:", Object.keys(capturedImports));
    if (capturedImports.env) console.log("Captured env keys:", Object.keys(capturedImports.env).length);
    console.log(capturedImports.env);
    const wasmBuffer = fs.readFileSync('scratch/gasm.wasm');
    // Hook imports BEFORE instantiate
    const wbg = capturedImports["./wasmgasm_bg.js"];
    for (const key in wbg) {
        if (typeof wbg[key] === 'function') {
            const orig = wbg[key];
            wbg[key] = function(...args) {
                console.log(`[JS Import Call] ${key}`, args);
                
                if (key.includes('instanceof')) {
                    console.log(`  -> mock returned true`);
                    return true;
                }

                try {
                    const res = orig.apply(this, args);
                    console.log(`  -> returned:`, res);
                    return res;
                } catch(e) {
                    console.error(`  -> THREW:`, e);
                    throw e;
                }
            };
        }
    }

    OriginalInstantiate(wasmBuffer, capturedImports).then(async result => {
        instantiateResolve(result); // Feed it back to real_gasm.js!
        window.wasm = result.instance.exports;
        
        console.log("WASM Exports:", Object.keys(result.instance.exports));

        // Remove exportsProxy
        
        // Mock DOM
        global.document = {
            location: global.location,
            getElementById: (id) => {
                console.log("getElementById called with:", id);
                return {
                    getAttribute: (attr) => { console.log("getAttribute:", attr); return ""; },
                    setAttribute: (attr, val) => { console.log("setAttribute:", attr, val); }
                };
            }
        };

        setTimeout(() => {
            try {
                console.log("Calling WASM set_stream_jw directly...");
                const wasmExports = result.instance.exports;
                
                try {
                    console.log("Calling __wbindgen_start...");
                    if (wasmExports.__wbindgen_start) wasmExports.__wbindgen_start();
                } catch(e) { console.error(e); }

                try {
                    console.log("Calling init_wasm...");
                    if (wasmExports.init_wasm) wasmExports.init_wasm();
                } catch(e) { console.error(e); }

                const malloc = wasmExports.__wbindgen_malloc;
                const wasmMemory = wasmExports.memory;
                
                const str = "247-south-park";
                const bytes = new TextEncoder().encode(str);
                const ptr = malloc(bytes.length, 1);
                
                const memArray = new Uint8Array(wasmMemory.buffer);
                memArray.set(bytes, ptr);
                
                console.log("Calling set_stream_jw(ptr, len, 4)...");
                const ret = wasmExports.set_stream_jw(ptr, bytes.length, 4);
                console.log("WASM Returned:", ret);
                
                if (ret instanceof Promise) {
                    ret.catch(e => console.error("Caught rejection:", e));
                }
            } catch(e) {
                console.error("WASM set_stream_jw error:", e);
                if (e && e.stack) console.error(e.stack);
            }
        }, 100);
    }).catch(e => {
        console.error("Instantiate error:", e);
    });
}, 500);

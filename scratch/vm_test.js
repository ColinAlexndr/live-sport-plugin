const fs = require('fs');
const vm = require('vm');

async function extractM3u8(streamId) {
    const wasmBuffer = fs.readFileSync('scratch/gasm.wasm');
    let jsCode = fs.readFileSync('scratch/gasm.js', 'utf8');
    
    // Fix import.meta for vm execution
    jsCode = jsCode.replace(/import\.meta/g, '{}');
    jsCode = jsCode.replace(/export function /g, 'function ');
    jsCode = jsCode.replace(/export class /g, 'class ');
    jsCode = jsCode.replace(/export const /g, 'const ');
    jsCode = jsCode.replace(/export default[^;]+;/g, '');
    jsCode = jsCode.replace(/export\s*\{[^}]+\};?/g, '');

    return new Promise((resolve, reject) => {
        const sandbox = {
            console: console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            setImmediate,
            clearImmediate,
            queueMicrotask,
            Buffer,
            URL,
            crypto: require('crypto').webcrypto,
            performance: performance,
            atob: atob,
            btoa: btoa,
            TextEncoder: require('util').TextEncoder,
            TextDecoder: require('util').TextDecoder,
            fetch: fetch,
            Request: Request,
            Error: Error,
            sharedWasmBase64: wasmBuffer.toString('base64'),
            nodeFetch: async (input, init) => {
                if (typeof input === 'string' && input.startsWith('/')) {
                    input = 'https://embedindia.st' + input;
                } else if (input instanceof sandbox.Request) {
                    if (input.url.startsWith('/')) {
                        // Handled by sandbox.Request
                    }
                }
                return fetch(input, init);
            }
        };

        const OriginalRequest = Request;
        sandbox.Request = class SandboxRequest extends OriginalRequest {
            constructor(input, init) {
                if (typeof input === 'string' && input.startsWith('/')) {
                    input = 'https://embedindia.st' + input;
                }
                super(input, init);
            }
        };

        sandbox.global = sandbox;
        sandbox.window = sandbox;
        
        sandbox.navigator = { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
        sandbox.location = { 
            href: `https://embedindia.st/embed/${streamId}`, 
            protocol: "https:", 
            host: "embedindia.st", 
            hostname: "embedindia.st" 
        };
        sandbox.document = {
            location: sandbox.location,
            getElementById: () => ({ getAttribute: () => "", setAttribute: () => {} })
        };
        sandbox.P2PEngineHls = { tryRegisterServiceWorker: () => Promise.resolve() };
        
        sandbox.jwplayer = () => ({
            setup: (config) => {
                resolve(config.file); // Successfully extracted!
            },
            once: () => {}
        });

        const context = vm.createContext(sandbox);

        try {
            // Run the WASM glue code
            vm.runInContext(jsCode, context);
            
            // Execute the WASM decryption natively
            vm.runInContext(`
                globalThis.window = globalThis;
                
                // Decode base64 inside the VM so the ArrayBuffer belongs to this context
                const binaryString = atob(globalThis.sharedWasmBase64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                globalThis.fetch = async (input, init) => {
                    if (typeof input === 'string' && input.startsWith('/')) {
                        input = 'https://embedindia.st' + input;
                    }
                    return globalThis.nodeFetch(input, init);
                };

                class MockRequest extends Request {
                    constructor(input, init) {
                        if (typeof input === 'string' && input.startsWith('/')) {
                            input = 'https://embedindia.st' + input;
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
                                if (ret instanceof Promise) {
                                    ret.catch(e => {});
                                }
                            } catch (e) {
                                // Ignore expected throw
                            }
                        }, 100);
                    } catch (e) {
                        // ignore
                    }
                })();
            `, context);
            
            // Timeout in case it fails
            setTimeout(() => reject(new Error("Timeout waiting for jwplayer.setup")), 5000);
        } catch (err) {
            reject(err);
        }
    });
}

extractM3u8("247-south-park")
    .then(url => console.log("SUCCESS URL:", url))
    .catch(err => console.error("FAILED:", err));

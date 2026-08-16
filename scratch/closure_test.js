const fs = require('fs');

process.on('unhandledRejection', (reason) => {
    // ignore
});

async function extractM3u8(streamId) {
    const wasmBuffer = fs.readFileSync('scratch/gasm.wasm');
    
    // We will build a clean context for the provider
    // Mock the DOM and browser globals
    const originalGlobals = {
        window: global.window,
        navigator: global.navigator,
        location: global.location,
        document: global.document,
        P2PEngineHls: global.P2PEngineHls,
        jwplayer: global.jwplayer,
        fetch: global.fetch,
        Request: global.Request
    };

    try {
        global.window = global;
        global.navigator = { userAgent: "Mozilla/5.0" };
        global.location = { 
            href: `https://embedindia.st/embed/${streamId}`, 
            protocol: "https:", 
            host: "embedindia.st", 
            hostname: "embedindia.st" 
        };
        global.document = {
            location: global.location,
            createElement: () => ({ style: {} }),
            getElementById: (id) => {
                // Return a mock element
                return {
                    getAttribute: () => "",
                    setAttribute: () => {}
                };
            },
            head: { appendChild: () => {} },
            querySelector: () => null
        };
        global.P2PEngineHls = { tryRegisterServiceWorker: () => Promise.resolve() };
        
        let extractedUrl = null;
        global.jwplayer = () => ({
            setup: (config) => {
                extractedUrl = config.file;
            },
            once: () => {}
        });

        const originalFetch = fetch;
        global.fetch = async (input, init) => {
            console.log('Mock fetch called:', input);
            if (typeof input === 'string' && input.includes('.wasm')) {
                // Copy the Node buffer to a fresh ArrayBuffer so it's not part of the 8MB pool
                const arrayBuffer = new ArrayBuffer(wasmBuffer.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < wasmBuffer.length; ++i) {
                    view[i] = wasmBuffer[i];
                }
                return {
                    ok: true,
                    status: 200,
                    arrayBuffer: async () => arrayBuffer,
                    headers: { get: () => 'application/wasm' }
                };
            }
            if (typeof input === 'string' && input.startsWith('/')) {
                input = 'https://embedindia.st' + input;
            } else if (input instanceof global.Request && input.url.startsWith('/')) {
                // Handled in mocked Request
            }
            return originalFetch(input, init);
        };

        const OriginalRequest = global.Request;
        global.Request = class MockRequest extends OriginalRequest {
            constructor(input, init) {
                if (typeof input === 'string' && input.startsWith('/')) {
                    input = 'https://embedindia.st' + input;
                }
                super(input, init);
            }
        };

        // Load real_gasm inside a closure
        let jsCode = fs.readFileSync('scratch/real_gasm.js', 'utf8');
        jsCode = jsCode.replace(/import\.meta/g, '{}');
        jsCode = jsCode.replace(/export function /g, 'function ');
        jsCode = jsCode.replace(/export const /g, 'const ');
        jsCode = jsCode.replace(/export \{[^}]+\};/g, '');
        
        const initFn = new Function(`
            ${jsCode}
            return { WrLiSv };
        `)();

        // Pass the actual ArrayBuffer to WrLiSv!
        const arrayBuffer = new ArrayBuffer(wasmBuffer.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < wasmBuffer.length; ++i) {
            view[i] = wasmBuffer[i];
        }

        const wasm = await initFn.WrLiSv(arrayBuffer);
        const streamBytes = new TextEncoder().encode(streamId);
        const ptr = wasm.__wbindgen_malloc(streamBytes.length, 1);
        const mem = new Uint8Array(wasm.memory.buffer);
        mem.set(streamBytes, ptr);
        
        return new Promise((resolve, reject) => {
            global.jwplayer = (id) => {
                console.log("jwplayer called with id:", id);
                return {
                    setup: (config) => {
                        console.log("jwplayer.setup called with file:", config.file);
                        resolve(config.file);
                    },
                    once: () => {}
                };
            };

            // Start the WASM
            try {
                if (wasm.__wbindgen_start) wasm.__wbindgen_start();
                if (wasm.init_wasm) wasm.init_wasm();
                setTimeout(() => {
                    try {
                        wasm.set_stream_jw(ptr, streamId.length, 4);
                    } catch (e) {
                        console.error("set_stream_jw threw:", e);
                    }
                }, 100);
            } catch (e) {
                console.error("WASM setup threw:", e);
            }

            setTimeout(() => reject(new Error("Timeout waiting for jwplayer.setup")), 5000);
        });

    } finally {
        for (const [key, value] of Object.entries(originalGlobals)) {
            if (value === undefined) {
                delete global[key];
            } else {
                Object.defineProperty(global, key, { value, configurable: true, writable: true });
            }
        }
    }
}

extractM3u8("247-south-park")
    .then(url => console.log("SUCCESS URL:", url))
    .catch(err => console.error("FAILED:", err));

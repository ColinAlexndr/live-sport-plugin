const fs = require('fs');

async function testWasm() {
  const wasmBuffer = fs.readFileSync('scratch/gasm.wasm');
  
  let memory;
  let heapObjects = [null, undefined, true, false]; // wasm-bindgen uses an array to hold objects
  
  function getObject(idx) {
    return heapObjects[idx];
  }
  function addObject(obj) {
    heapObjects.push(obj);
    return heapObjects.length - 1;
  }
  function getStringFromWasm(ptr, len) {
    if (len === 0) return "";
    const bytes = new Uint8Array(memory.buffer, ptr, len);
    return new TextDecoder('utf-8').decode(bytes);
  }

  const imports = {
    './wasmgasm_bg.js': new Proxy({}, {
      get(target, prop) {
        return function(...args) {
          console.log(`[WASM IMPORT] ${prop}`, args);
          
          if (prop.includes('__wbg_eval_')) {
            const ptr = args[0];
            const len = args[1];
            console.log("================================");
            console.log("EVAL CALLED WITH STRING:");
            console.log(getStringFromWasm(ptr, len));
            console.log("================================");
            return addObject(undefined);
          }
          if (prop.includes('__wbg_new_b5d9e2fb389fef91')) {
            try {
              const str = getStringFromWasm(args[0], args[1]);
              console.log("Error string:", str);
            } catch(e) {}
          }
          
          return 0; // dummy return
        };
      }
    }),
    wbg: {}
  };

  try {
    const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);
    memory = instance.exports.memory;
    
    // The encrypted string from fetch, represented as hex
    const encryptedHex = '302b46274f7b2f795c5a4f5a477a4a5f6b496c70282d6d275d656f4b2d675f304d7c2a5b4c4631282367266f672e5e2261475b24212e4c6321242c4c5f6e695b644a587c2a5a2b7d5c477b7c473064254e2d627a322c7e7a4f287c784d4771585c507d6f607b317b4f2e6c687a31654e666f65677d4d2a5d66496d2b62274b4f336d2e4f276b5b7c676f5b216b686b33637a24485f7c79484b26674e7c2d3064636b31582a71262b2a4f616a2f2f687a477e5454';
    
    // PASS DIRECTLY AS BYTES
    const encoded = Buffer.from(encryptedHex, 'hex');
    const ptr = instance.exports.__wbindgen_malloc(encoded.length, 1);
    
    const mem = new Uint8Array(memory.buffer);
    mem.set(encoded, ptr);
    
    console.log(`Calling set_stream_jw(${ptr}, ${encoded.length})...`);
    instance.exports.set_stream_jw(ptr, encoded.length);
    console.log("Done!");
    
  } catch (e) {
    console.error("WASM Error:", e);
  }
}

testWasm();

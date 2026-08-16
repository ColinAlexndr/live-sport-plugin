const fs = require('fs');

async function main() {
  const wasmBuffer = fs.readFileSync('scratch/gasm.wasm');
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  
  const imports = WebAssembly.Module.imports(wasmModule);
  console.log("IMPORTS:");
  console.log(imports.map(i => `${i.module}.${i.name}`).join('\n'));
  
  const exports = WebAssembly.Module.exports(wasmModule);
  console.log("\nEXPORTS:");
  console.log(exports.map(e => e.name).join('\n'));
}

main().catch(console.error);

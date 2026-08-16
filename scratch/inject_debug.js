const fs = require('fs');
let s = fs.readFileSync('scratch/inner.js', 'utf8');
s = s.replace('R3ApVih.decompressFromUTF16(afFXvu)', '(console.log("decompress input type:", typeof afFXvu, "value:", afFXvu === null ? "null" : String(afFXvu).substring(0, 100)), R3ApVih.decompressFromUTF16(afFXvu))');
fs.writeFileSync('scratch/inner_debug.js', s);

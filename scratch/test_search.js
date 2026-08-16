const fs = require('fs');
const js = fs.readFileSync('scratch/bundle-jw.js', 'utf8');

// Find all strings in the code
const strings = [...js.matchAll(/(['"`])(.*?)\1/g)].map(m => m[2]);
for (const s of strings) {
    if (s.length > 5 && s.includes('wasm')) {
        console.log(s);
    }
}
console.log("Done checking bundle strings.");

const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const decoded = {};
while ((m = regex.exec(js)) !== null) {
  decoded[m[1]] = e(m[2]);
}

console.log('=== ALL DECODED STRINGS ===');
Object.entries(decoded).forEach(([k, v]) => {
  if (v.length > 0) console.log(k + ' = ' + JSON.stringify(v));
});

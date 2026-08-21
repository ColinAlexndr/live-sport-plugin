const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// wI decoded to "oior8ed8ew" - that's a random-looking string, probably a key/token
// Let's find all potential domain strings in decoded map
console.log('=== POTENTIAL DOMAINS / TOKENS ===');
Object.entries(D).forEach(([k, v]) => {
  if (v.includes('.com') || v.includes('.net') || v.includes('.io') || v.includes('http')) {
    console.log(k + ' = ' + JSON.stringify(v));
  }
});

// Also look for url-like strings
console.log('\n=== URL-LIKE STRINGS ===');
Object.entries(D).forEach(([k, v]) => {
  if (v.startsWith('/') || v.startsWith('http') || v.match(/\.[a-z]{2,4}\//)) {
    console.log(k + ' = ' + JSON.stringify(v));
  }
});

// Find ur() function body to see domain rotation
const urStart = js.indexOf(',ur=()=>');
const urChunk = js.substring(urStart, urStart+600);
console.log('\n=== ur() full body ===');
console.log(urChunk);

// The real domain comes from uk[yk] - let's decode uk and yk
console.log('\nuk =', D['uk']);
console.log('yk =', D['yk']);
console.log('uk context...');
const ukIdx = js.indexOf(',uk=');
console.log(js.substring(ukIdx, ukIdx+200));

// Also check the multiTagDomain var (vI)
console.log('\nvI = multiTagDomain:', D['vI']);

const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

// Build full decode map
const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// Also decode number constants
const numRegex = /,([A-Za-z_$][A-Za-z0-9_$]*)=(\d+)[,;]/g;
const N = {};
while ((m = numRegex.exec(js)) !== null) {
  N[m[1]] = parseInt(m[2]);
}

// Key vars for URL construction from Hr():
// n = Xu + s + TI + p + NI + Wr(...)
// Xu = "https://"
// TI = "/5/"  
// NI = "/?"
// s = originalDomain (from options)
// p = e[zo] = pointer/zone type

// Find Xu - the base URL host - look for what comes after https://
console.log('=== URL STRUCTURE ===');
console.log('Xu =', JSON.stringify(D['Xu']));  // "https://"
console.log('TI =', JSON.stringify(D['TI']));  // "/5/"
console.log('NI =', JSON.stringify(D['NI']));  // "/?"
console.log('qE =', JSON.stringify(D['qE']));  // "/4/"
console.log('');

// The full URL pattern from Hr():
// n = Xu.concat(s || ur(), TI).concat(p, NI).concat(Wr(y(h(y(h($o(...), jr(f||"")), $o(...)), Ur()), $o(FI, a))))
// where:
// s = OI (originalDomain) - the domain to call
// p = zo (the "pointer" path/type)
// Wr = encodeQueryString helper
// Query params decoded:
console.log('=== QUERY PARAMS ===');
console.log('DI =', D['DI']);   // "oo" -- likely "op" = operation? 
console.log('xI =', D['xI']);   // "abt_opts"
console.log('us =', D['us']);   // "js_build"
console.log('fs =', D['fs']);   // "iclick-v1.1888.0" -- SDK version!
console.log('MI =', D['MI']);   // "userId"
console.log('LI =', D['LI']);   // "dmn" -- domain param
console.log('zI =', D['zI']);   // "fc"
console.log('FI =', D['FI']);   // "rfo"
console.log('zE =', D['zE']);   // "branch"
console.log('Yf =', D['Yf']);   // look up
console.log('Ql =', D['Ql']);   // look up
console.log('hI =', D['hI']);   // "force_ip"
console.log('AI =', D['AI']);   // "tagType"
console.log('');

// Find Yf and Ql in the decoded map
const interesting = ['Yf', 'Ql', 'Bf', 'Ar', 'Pr', 'Sr', 'fr', 'ur', 'zo', 'OI', 'VI'];
interesting.forEach(k => {
  if (D[k]) console.log(k + ' = ' + JSON.stringify(D[k]));
});

// Look at the XHR surrounding context - find the endpoint domain
// It's built as: Xu + s (domain) + TI ("/5/") + p (zone id) + NI ("/?")
// The domain comes from originalDomain or ur() fallback
// Let's find ur() function
const urIdx = js.indexOf('ur=()=>');
const urChunk = js.substring(urIdx, urIdx+300);
console.log('\n=== ur() function ===');
console.log(urChunk);

// Find the actual API domain being called
const hostMatches = [...js.matchAll(/llvpn\.com|oior8ed8ew|iclick\.com|adsterra|exoclick/gi)];
console.log('\n=== Domain mentions ===');
hostMatches.forEach(m => {
  const ctx = js.substring(Math.max(0,m.index-50), m.index+100);
  console.log(ctx);
  console.log('---');
});

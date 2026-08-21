const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// Decode the Gr() function fully - this is the SECOND request that gets the pop URL
// pa = fetch, sb="method", ub="POST", ZI="credentials", GI="include"
// lb="headers", cb="application/json", Ho="body"
// The URL: c = a[qo] - the "qo" field from first response
// qo is a URL from the options response

// Let's find qo
console.log('qo =', D['qo']);
console.log('r_ =', D['r_']);
console.log('fb =', D['fb']);
console.log('pb =', D['pb']);
console.log('db =', D['db']);
console.log('qb =', D['qb']);

// The Vr() function generates request body
// Vr=async()=>{ let e=await Xe($o(pb:true, db:300), {}) }
// Xe is likely the collect/gather function
// pb and db are bool/number options

// Find Xe function
const xeIdx = js.indexOf('Xe=');
console.log('\n=== Xe function start ===');
console.log(js.substring(xeIdx, xeIdx+500));

// Find qo definition - what type of URL is it?
const qoIdx = js.indexOf('[qo]');
const qoCtx = js.substring(Math.max(0,qoIdx-100), qoIdx+300);
console.log('\n=== qo context ===');
console.log(qoCtx);

// The full chain is:
// 1. Hr() XHR GET to: https://beegrenugoz.com/5/{zoneId}/?params -> returns JSON with:
//    - qo: the actual pop/redirect URL
//    - DI: additional options JSON to merge
//    - YI: cache TTL
// 2. Gr() fetch POST to: a[qo] URL -> returns JSON with rb: <final URL>
// 3. That rb URL is the actual click/stream redirect

// Let's verify by looking for what's done with rb value
const jIIdx = js.indexOf('e[JI]');
console.log('\n=== What happens with rb response (e[JI]) ===');
// Find all JI usages
let pos = 0;
let count = 0;
while ((pos = js.indexOf('[JI]', pos)) !== -1 && count < 15) {
  const ctx = js.substring(Math.max(0,pos-100), pos+200);
  console.log('--- pos ' + pos + ' ---');
  console.log(ctx);
  pos += 4;
  count++;
}

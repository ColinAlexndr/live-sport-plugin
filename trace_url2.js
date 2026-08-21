const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// nI is the fallback domain from ur() - key!
console.log('nI (fallback domain from ur()) =', JSON.stringify(D['nI']));
// "beegrenugoz.com" is what we decoded earlier - that's the API host!

// Now let's reconstruct the full API endpoint URL pattern:
// From Hr():  n = Xu + (s || ur()) + TI + p + NI + Wr(queryParams)
// Xu = "https://"
// s = OI (originalDomain) - the domain passed in options
// ur() fallback = nI = "beegrenugoz.com"  
// TI = "/5/"
// p = zoneId (e.g., 11024385 from the embed page)
// NI = "/?"
// Query params include:
//   js_build = "iclick-v1.1888.0"
//   abt_opts = {abt_first_match results}
//   dmn = current domain
//   fc = ?
//   tt = tagType
//   ix = ?
//   userId = user ID
//   tspl/cslt = timestamps

console.log('\n=== RECONSTRUCTED API ENDPOINT ===');
console.log('Pattern: https://{domain}/5/{zoneId}/?{query_params}');
console.log('');
console.log('Example URL for zone 11024385:');
console.log('https://beegrenugoz.com/5/11024385/?js_build=iclick-v1.1888.0&dmn=embed.st&...');

// Now let's find the Gr() fetch call - the second request with actual ad data
console.log('\n=== Gr() fetch call analysis ===');
const grIdx = js.indexOf('Gr=async e=>{');
const grChunk = js.substring(grIdx, grIdx+800);
console.log(grChunk);

// Look for what "zo" path segments are used
// The response from this API contains the actual redirect/stream URL
// Let's check what the JI ("rb") field contains - that's the key response field
console.log('\n=== Response field "rb" (JI) ===');
const rbIdx = js.indexOf('e[JI]');
const rbCtx = js.substring(Math.max(0,rbIdx-200), rbIdx+400);
console.log(rbCtx);

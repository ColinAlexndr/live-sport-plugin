const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

// ur() tries: document.currentScript.dataset.domain 
// (which is set in the <script> tag that loaded tag.min.js)
// The script is injected via: s.dataset.zone='11024385', s.src='https://llvpn.com/tag.min.js'
// Only zone is set, NOT domain -- so ur() falls through to nI = "beegrenugoz.com"

// BUT: rc is also checked: "Mii^t.)=ow" 
// Let's decode rc:
const rcIdx = js.indexOf(',rc=');
const rcChunk = js.substring(rcIdx, rcIdx+100);
console.log('rc assignment:', rcChunk);
// rc = "Mii^t.)=ow" is the obfuscated version of something

// Also look for Xt() function - it processes the rc string
const xtIdx = js.indexOf(',Xt=');
console.log('\nXt function:', js.substring(xtIdx, xtIdx+300));

// Find ak - decoded to: "matrrk..ynme/t//:gsipdt.tjhs"
// let's decode that properly 
const akDecoded = e("matrrk..ynme/t//:gsipdt.tjhs");
console.log('\nak decoded:', akDecoded);

// Also decode gm = "/o/k:/tfiogo"
const gmDecoded = e("/o/k:/tfiogo");
console.log('gm decoded:', gmDecoded);

// The actual flow for embed.st:
// 1. Script loaded with dataset.zone=11024385
// 2. ur() returns "beegrenugoz.com" (the fallback)
// 3. GET https://beegrenugoz.com/5/11024385/?params -> OPTIONS response with "url" field
// 4. The "url" field IS the pop/stream redirect URL

// Since beegrenugoz.com doesn't resolve, let's try alternate iclick CDN domains
// iclick-v1.1888.0 is their SDK version
// Let's check if there are backup domains

// Find all string patterns that look like domain names (word.word)
const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// rc is the hardcoded fallback domain test string
console.log('\nrc =', JSON.stringify(D['rc']));
// It was: "Mii^t.)=ow" 
const rc = js.match(/,rc="([^"]+)"/);
if(rc) console.log('rc raw string:', rc[1]);

// Look for the Xt function which extracts the domain from rc
const xtMatch = js.match(/Xt=function\(([^)]+)\)\{([^}]{1,400})\}/);
if(xtMatch) console.log('Xt body:', xtMatch[0]);
else {
  // try arrow
  const xtArrow = js.match(/,Xt=([^,]{1,300}),/);
  if(xtArrow) console.log('Xt:', xtArrow[1]);
}

// Find the multiTagDomain logic - that's what connects back to the actual streaming domain
const multiIdx = js.indexOf('multiTagDomain');
const multiChunk = js.substring(Math.max(0,multiIdx-200), multiIdx+400);
console.log('\n=== multiTagDomain context ===');
console.log(multiChunk);

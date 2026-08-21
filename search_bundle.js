const fs = require('fs');
const js = fs.readFileSync('bundle-jw.js', 'utf8');

// Search for all pathname/location usages that might construct an API call
const patterns = [
  'pathname',
  'split(\'/\')',
  'location.path',
  'href.split',
  '/embed/',
  'jwplayer(',
  '.setup(',
  'const sources',
  'var sources',
  'let sources',
  'file:',
  'playlist:',
];

patterns.forEach(p => {
  let pos = 0, count = 0;
  while((pos = js.indexOf(p, pos)) !== -1 && count < 5) {
    console.log(`\n"${p}" at ${pos}:`);
    console.log(js.substring(Math.max(0,pos-100), pos+300));
    console.log('---');
    pos += p.length; count++;
  }
});

// The key insight: bundle-jw.js initializes JWPlayer but the PLAYLIST/sources 
// come from the embed.st server as a JSON response
// Let's look at how JWPlayer fetches its playlist when given a URL string
// If setup({playlist: "URL"}) is called, JWPlayer does a GET to that URL
// What URL does it call on embed.st?

// Look for ajax/fetch calls within bundle-jw.js
console.log('\n\n=== AJAX/FETCH in bundle ===');
let pos = 0, count = 0;
while((pos = js.indexOf('.ajax(', pos)) !== -1 && count < 10) {
  console.log(`ajax at ${pos}:`, js.substring(Math.max(0,pos-50), pos+200));
  console.log('---');
  pos += 6; count++;
}

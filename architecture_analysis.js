const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// Vr() sends browser performance timing + connection info
// Let's decode the keys in $o(pb:true, db:300) context
// pb = "async", db = "timeout"
// And Vr returns: { connection: {...}, async: true, timeout: 300 }

// The full OPTIONS request body from Vr():
// { pb: true (async), db: 300 (timeout), ...connection info }
// connection comes from navigator.connection API

// Key insight: the 0x50004 = zone disabled/no ad for this zone from server side
// The zone 11024385 is an "onclick" popunder zone -- not related to the STREAM

// The STREAM URL is NOT in the ad network response!
// Let's re-read the embed page flow more carefully
// The embed page loads: strmd.b-cdn.net/js/bundle-jw.js (JWPlayer)
// AND: llvpn.com/tag.min.js (ad/popunder layer)
// These are SEPARATE systems!
// 
// The JWPlayer is what actually serves the stream
// Let's look at the JW player initialization in the embed page

// The embed HTML had: <script src="https://strmd.b-cdn.net/js/bundle-jw.js">
// Then the player div: <div id="player">
// JWPlayer is initialized via jwplayer("player").setup({...})
// The setup config contains the file/playlist URL

// Let's look at what OTHER scripts are loaded dynamically by bundle-jw.js
// or what the JW player setup config fetches

// Since the embed page is server-side rendered for embed.st/admin URLs
// Let's try fetching the page with a cookie/session to see if there's more content

console.log('=== KEY ARCHITECTURAL FINDING ===');
console.log('llvpn.com/tag.min.js = ad network (popunder/onclick ads)');
console.log('strmd.b-cdn.net/js/bundle-jw.js = JWPlayer (actual video player)');
console.log('');
console.log('The STREAM URL is fetched by JWPlayer from the embed server');
console.log('embed.st is the backend that resolves stream URLs for this piracy site');
console.log('');
console.log('Next step: find the JWPlayer setup({playlist/file}) call');
console.log('This is likely fetched from an embed.st API endpoint');

// Let's check what API embed.st exposes
const D_all = D;
console.log('\nAll decoded strings with "stream" or "m3u8" or "hls":');
Object.entries(D_all).forEach(([k,v]) => {
  if (v.toLowerCase().includes('stream') || v.includes('m3u8') || v.includes('hls') || v.includes('.ts')) {
    console.log(k, '=', v);
  }
});

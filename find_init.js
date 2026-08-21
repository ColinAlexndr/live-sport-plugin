const fs = require('fs');

// The swarmcloud P2P HLS engine hooks into an existing HLS stream
// It intercepts the m3u8 fetch and distributes via P2P
// But it doesn't INITIATE the player - it hooks into an existing player

// KEY REALIZATION: 
// The embed.st page has NO player setup JS in the HTML
// The bundle-jw.js is a CDN-hosted JWPlayer - it can't know embed.st's streams
// CONCLUSION: The setup must come from one of the DEFERRED scripts:
//   - clappr.min.js (another player library)
//   - clappr-chromecast-plugin
// OR from a script that gets loaded AFTER the page renders

// Wait - let me re-read the HTML more carefully
// There's: <script src="...p2p-engine.min.js">
//          <script defer src="...clappr.min.js">
//          <script defer src="...clappr-chromecast-plugin">
//          <script src="strmd.b-cdn.net/js/bundle-jw.js">
//          <script>(ad iframe rotation code)</script>

// bundle-jw.js is NOT deferred - it loads synchronously
// The deferred scripts (clappr) load AFTER it
// BUT: bundle-jw.js doesn't call setup() itself

// CRITICAL MISSING PIECE: There must be a script AFTER bundle-jw.js that:
// 1. Reads window.location to get the stream slug
// 2. Calls an embed.st API to get sources
// 3. Calls jwplayer("player").setup({...})

// The bundle-jw.js exposes window.jwplayer
// The setup call would typically look like:
// jwplayer("player").setup({ file: "...", type: "hls", ... })

// Since it's NOT in the HTML, it must come from ONE of the loaded scripts
// Let's check if bundle-jw.js has any post-load initialization

// Actually: let's search bundle-jw.js for the string that defines 
// where it expects to be hosted or what config to load

const bundle = fs.readFileSync('bundle-jw.js', 'utf8');

// Look for any hardcoded API endpoints or path constructions
const interesting = [
  '/embed',
  'slug',
  'source',
  'strm',
  'getSource',
  '/v1/',
  '/v2/',
  'api/',
  '//s.',
  'playlist-',
  'live-',
  'ppv',
  'barcelona',
];

interesting.forEach(p => {
  const idx = bundle.indexOf(p);
  if(idx >= 0) {
    console.log(`"${p}" at ${idx}:`);
    console.log(bundle.substring(Math.max(0,idx-80), idx+200));
    console.log('---');
  }
});

// Also: strmd.b-cdn.net is the CDN for this embed service
// Let's try to find the main entry point JS file
console.log('\n=== Possible entry point scripts on strmd.b-cdn.net ===');
// From the bundle, n.p = the base path for chunks
const npMatch = bundle.match(/n\.p\s*=\s*"([^"]+)"/);
if(npMatch) console.log('webpack publicPath (n.p):', npMatch[1]);

// Find __webpack_public_path__
const wppMatch = bundle.match(/__webpack_require__\.p\s*=\s*"([^"]+)"/);
if(wppMatch) console.log('webpack public path:', wppMatch[1]);

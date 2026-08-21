const https = require('https');
const fs = require('fs');

function get(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    https.get(url, { 
      agent, 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36',
        'Referer': 'https://embed.st/'
      }, 
      timeout: 15000 
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function run() {
  // FINAL APPROACH: Clappr player is loaded as a defer script
  // Clappr has a plugin architecture. Maybe there's a custom Clappr plugin 
  // specific to embed.st that handles stream initialization
  
  // Check if strmd.b-cdn.net has a clappr plugin
  const clapprPaths = [
    '/js/clappr-init.js',
    '/js/clappr-plugin.js',
    '/clappr/init.js',
    '/player/clappr.js',
    '/js/embed-player.js',
    '/js/player-setup.js',
    '/js/streaming.js',
  ];
  
  for(const p of clapprPaths) {
    try {
      const r = await get('https://strmd.b-cdn.net' + p);
      if(r.status !== 404) console.log(`[${r.status}] ${p}: ${r.body.substring(0,200)}`);
    } catch(e) {}
  }
  
  // Most likely: the JWPlayer setup call is embedded IN the window.jwplayer.defaults
  // or via window.onload after all scripts load
  // Since we can't run JS, let's try the network-level approach:
  
  // Fetch the embed page with the correct Cookie that a returning visitor would have
  // The server might serve different content based on cookies/session
  
  // Actually - let me check if this is a NEXT.js or similar SSR app
  // by looking for _next/static or similar patterns
  
  // Try the optimserve.agency backend (mentioned in HTML comment)
  console.log('\n=== optimserve.agency ===');
  try {
    const r = await get('https://optimserve.agency/');
    console.log('Status:', r.status);
    console.log(r.body.substring(0, 500));
  } catch(e) { console.log('Error:', e.message); }
  
  // Let me check the specific API the embed uses by checking the network
  // The embed.st URL /embed/admin/{slug}/{index}
  // Try appending /sources or /streams
  const apiVariants = [
    '/embed/admin/ppv-barcelona-vs-al-ahly/1/m3u8',
    '/embed/admin/ppv-barcelona-vs-al-ahly/sources',
    '/embed/admin/ppv-barcelona-vs-al-ahly.m3u8',
    '/stream/admin/ppv-barcelona-vs-al-ahly/1',
    '/live/ppv-barcelona-vs-al-ahly/1',
  ];
  
  for(const p of apiVariants) {
    try {
      const r = await get('https://embed.st' + p);
      if(r.status !== 404) {
        console.log(`\n[${r.status}] ${p}:`);
        console.log('Type:', r.headers['content-type']);
        console.log(r.body.substring(0, 500));
      }
    } catch(e) {}
  }
  
  // Try the direct stream lookup API that common piracy streaming sites use
  // Pattern: /api/streams?name={slug}&index={n} or /api/getLinks?slug={slug}
  const apiPaths2 = [
    '/api/streams?name=ppv-barcelona-vs-al-ahly&index=1',
    '/api/links?slug=ppv-barcelona-vs-al-ahly',
    '/api/link?id=ppv-barcelona-vs-al-ahly&src=1',
    '/api/getStream?slug=ppv-barcelona-vs-al-ahly&i=1',
    '/api/events/ppv-barcelona-vs-al-ahly',
    '/api/match/ppv-barcelona-vs-al-ahly',
    '/ajax/stream?slug=ppv-barcelona-vs-al-ahly&source=1',
  ];
  
  for(const p of apiPaths2) {
    try {
      const r = await get('https://embed.st' + p);
      if(r.status !== 404) {
        console.log(`\n[${r.status}] ${p}:`);
        console.log(r.headers['content-type']);
        console.log(r.body.substring(0, 400));
      }
    } catch(e) {}
  }
}

run().catch(console.error);

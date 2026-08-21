const https = require('https');
const fs = require('fs');

// Let's get the full bundle-jw.js and search for any external API calls specific to embed.st
function get(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    https.get(url, { agent, headers: {'User-Agent':'Mozilla/5.0'}, timeout: 15000 }, res => {
      let body = Buffer.alloc(0);
      res.on('data', c => body = Buffer.concat([body, c]));
      res.on('end', () => resolve({ status: res.statusCode, body: body.toString() }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function run() {
  console.log('Fetching full bundle-jw.js...');
  const r = await get('https://strmd.b-cdn.net/js/bundle-jw.js');
  const js = r.body;
  fs.writeFileSync('bundle-jw.js', js);
  console.log('Size:', js.length);
  
  // The embed.st backend serves the stream config via a separate endpoint
  // that gets called from inside jwplayer setup
  // JWPlayer's "playlist" config can be a URL string that it fetches
  // If jwplayer("player").setup({playlist: "URL"}) is called with a URL,
  // JWPlayer fetches that URL to get the actual playlist JSON
  
  // Look for how playlist URLs are constructed
  // The slug/embed ID must be extracted from window.location
  
  const patterns = [
    'window.location',
    'location.pathname', 
    'location.href',
    '/embed/',
    'embed.st',
    'slug',
    'streamId',
    'mediaId',
    '/playlist',
    '/sources',
  ];
  
  patterns.forEach(p => {
    let idx = 0;
    let count = 0;
    while ((idx = js.indexOf(p, idx)) !== -1 && count < 3) {
      console.log(`\n"${p}" at ${idx}:`);
      console.log(js.substring(Math.max(0,idx-100), idx+200));
      console.log('---');
      idx += p.length;
      count++;
    }
  });
}

run().catch(console.error);

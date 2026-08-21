const https = require('https');
const fs = require('fs');

function get(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    https.get(url, { agent, headers: {'User-Agent':'Mozilla/5.0', 'Referer':'https://embed.st/'}, timeout: 12000 }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, url }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function run() {
  // bundle-jw.js loads chunk scripts dynamically with n.e(chunkId)
  // Let's check the strmd CDN for chunk files that might contain the init logic
  // JWPlayer chunks are numbered (250, 207, 681, etc. seen in the bundle)
  
  const chunkIds = ['250', '207', '681', '98', '371', '168', '605', '493', '581', '716', '74'];
  
  for(const id of chunkIds) {
    const url = `https://strmd.b-cdn.net/jwp/8.38.10/${id}.js`;
    try {
      const r = await get(url);
      if(r.status === 200) {
        console.log(`[200] Chunk ${id}: ${r.body.length} bytes`);
        // Quick scan for interesting patterns
        ['jwplayer(', 'setup({', 'playlist:', 'file:', 'embed.st', '/stream', 'm3u8'].forEach(p => {
          if(r.body.includes(p)) console.log(`  contains: "${p}"`);
        });
      } else {
        console.log(`[${r.status}] Chunk ${id}`);
      }
    } catch(e) {
      console.log(`[ERR] Chunk ${id}: ${e.message}`);
    }
  }
  
  // Also check the JWPlayer config endpoint 
  // JWPlayer uses a "library" URL pattern: content.jwplatform.com/libraries/{pid}.js
  // The pid comes from the jwplayer license key stored in the player config
  // Let's find the pid by checking the bundle for the license
  const bundle = fs.readFileSync('bundle-jw.js', 'utf8');
  const pidMatch = bundle.match(/libraries\/([A-Za-z0-9]+)\.js/);
  if(pidMatch) {
    console.log('\nJWPlayer PID found:', pidMatch[1]);
    const libUrl = `https://content.jwplatform.com/libraries/${pidMatch[1]}.js`;
    console.log('Library URL:', libUrl);
    try {
      const r = await get(libUrl);
      console.log('Status:', r.status, 'Size:', r.body.length);
    } catch(e) { console.log('Error:', e.message); }
  }
  
  // Critical: look for the jwpsrv.js which is the JWPlayer analytics/init service
  console.log('\n=== jwpsrv.js ===');
  try {
    const r = await get('https://strmd.b-cdn.net/jwp/8.38.10/jwpsrv.js');
    console.log('Status:', r.status, 'Size:', r.body.length);
    // Look for setup or init patterns
    ['setup', 'playlist', 'file:', 'stream', 'embed'].forEach(p => {
      if(r.body.includes(p)) {
        const idx = r.body.indexOf(p);
        console.log(`"${p}" found:`, r.body.substring(Math.max(0,idx-50), idx+150));
      }
    });
  } catch(e) { console.log('Error:', e.message); }
}

run().catch(console.error);

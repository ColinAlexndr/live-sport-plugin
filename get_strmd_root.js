const https = require('https');
const fs = require('fs');

function get(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    https.get(url, { 
      agent, 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36', 'Referer': 'https://embed.st/' }, 
      timeout: 15000 
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function run() {
  // Get the full strmd.b-cdn.net root HTML
  const r = await get('https://strmd.b-cdn.net/');
  console.log('Status:', r.status);
  console.log('FULL HTML:');
  console.log(r.body);
  
  fs.writeFileSync('strmd_root.html', r.body);
  
  // Extract all script/link hrefs
  const scripts = [...r.body.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  const links = [...r.body.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  
  console.log('\nScripts:', scripts);
  console.log('Links:', links);
  
  // Fetch any app JS files
  for(const src of scripts) {
    const url = src.startsWith('http') ? src : 'https://strmd.b-cdn.net' + src;
    console.log('\n=== Fetching:', url, '===');
    try {
      const r2 = await get(url);
      console.log('Status:', r2.status, 'Size:', r2.body.length);
      // Look for stream API calls
      ['embed.st', 'playlist', 'm3u8', 'stream', 'sources', 'setup(', 'fetch(', 'XMLHttpRequest', '/api/'].forEach(p => {
        const idx = r2.body.indexOf(p);
        if(idx >= 0) {
          console.log(`  "${p}" found:`, r2.body.substring(Math.max(0,idx-50), idx+200));
        }
      });
    } catch(e) { console.log('Error:', e.message); }
  }
}

run().catch(console.error);

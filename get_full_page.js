const https = require('https');

function get(url, extraHeaders={}) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const u = new URL(url);
    https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET', agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36',
        'Referer': 'https://embed.st/',
        ...extraHeaders
      },
      timeout: 12000
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout'))).end();
  });
}

async function run() {
  // Let's check strmd.b-cdn.net for a setup or player-init script
  const paths = [
    '/js/setup.js',
    '/js/player-init.js',
    '/js/init.js',
    '/js/config.js',
    '/js/embed.js',
    '/js/stream.js',
    '/js/sources.js',
  ];
  
  for(const p of paths) {
    try {
      const r = await get('https://strmd.b-cdn.net' + p);
      if(r.status !== 404) console.log(`[${r.status}] strmd.b-cdn.net${p}: ${r.body.substring(0,200)}`);
    } catch(e) {}
  }
  
  // The real answer is: the player setup data comes from within the embed.st page HTML
  // but it's dynamically generated server-side AFTER checking the request
  // The curl ECONNRESET suggests the server actively blocks certain clients
  // Let's try with different TLS fingerprinting (modern cipher suites)
  
  // Try fetching with wget style
  // Actually let's look at the HTML we already got from curl more carefully
  // The curl response was truncated - it ended at the iframe script
  // There might be more HTML that we missed!
  
  // Try fetching the full page content with curl and saving it
  const { exec } = require('child_process');
  
  console.log('Using curl to save full page...');
  await new Promise((res, rej) => {
    exec(`curl -k -s --max-time 20 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36" --compressed "https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1" -o "full_page.html" -D "headers.txt"`, 
    (err, stdout, stderr) => {
      if(err) { console.log('Error:', err.message); rej(err); return; }
      res();
    });
  });
  
  const fs = require('fs');
  const html = fs.readFileSync('full_page.html', 'utf8');
  const headers = fs.readFileSync('headers.txt', 'utf8');
  console.log('\nResponse headers:');
  console.log(headers);
  console.log('\nHTML length:', html.length);
  console.log('\nFull HTML:');
  console.log(html);
}

run().catch(console.error);

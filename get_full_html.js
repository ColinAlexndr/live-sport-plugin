const https = require('https');

function request(urlStr, opts={}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: opts.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36',
        'Accept': 'text/html,*/*',
        ...opts.headers
      },
      rejectUnauthorized: false,
      timeout: 12000
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function run() {
  const r = await request('https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1');
  console.log('FULL HTML:');
  console.log(r.body);
  console.log('\n\nLength:', r.body.length);
}

run().catch(console.error);

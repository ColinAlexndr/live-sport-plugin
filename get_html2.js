const https = require('https');
const http = require('http');

// Use http.get for simplicity
function get(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: false });
    protocol.get(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Connection': 'close'
      },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

get('https://embed.st/embed/admin/ppv-barcelona-vs-al-ahly/1').then(r => {
  console.log('Status:', r.status);
  console.log('Body length:', r.body.length);
  console.log('--- FULL HTML ---');
  console.log(r.body);
}).catch(e => console.error('Error:', e.message));

const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// ak = "https://my.rtmark.net/gid.js" -- RTMark is the actual fingerprinting/ad targeting network!
// This is the real network behind the scenes

// Let's now look at the $0 and u_ patterns for the bucket URL
// u_ = "/bucket" -- this is an API path!
console.log('u_ =', D['u_']);
console.log('ak =', D['ak']);  // "https://my.rtmark.net/gid.js"

// Now let's decode wp (which Xt = e(wp))
console.log('wp =', D['wp']);

// The Gr() function fetches: c + separator + Wr(queryParams)
// c = a[qo] = the "url" field from the OPTIONS response
// That URL is what we need to call

// Since beegrenugoz.com doesn't resolve, let's try iclick.com directly  
// iclick is the ad network (js_build = "iclick-v1.1888.0")
// Also try the rtmark endpoint

const https = require('https');
const http = require('http');

function makeRequest(urlStr, opts={}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: opts.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://embed.st/',
        'Origin': 'https://embed.st',
        ...opts.headers
      },
      timeout: 8000
    };
    const req = lib.request(options, res => {
      let data = Buffer.alloc(0);
      res.on('data', d => data = Buffer.concat([data, d]));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data.toString() }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// Try alternative domains for the iclick network
const domains = ['beegrenugoz.com', 'iclickcdn.com', 'llvpn.com'];
const zoneId = 11024385;

async function tryDomains() {
  for (const domain of domains) {
    const url = `https://${domain}/5/${zoneId}/?js_build=iclick-v1.1888.0&dmn=embed.st&tt=1&ix=0`;
    console.log('\n=== Trying:', url, '===');
    try {
      const r = await makeRequest(url);
      console.log('Status:', r.status);
      console.log('Body:', r.body.substring(0, 1000));
    } catch(err) {
      console.log('Error:', err.message);
    }
  }
  
  // Also try the RTMark endpoint
  console.log('\n=== RTMark fingerprint endpoint ===');
  try {
    const r = await makeRequest('https://my.rtmark.net/gid.js');
    console.log('Status:', r.status);
    console.log('Body:', r.body.substring(0, 500));
  } catch(err) {
    console.log('Error:', err.message);
  }
}

tryDomains();

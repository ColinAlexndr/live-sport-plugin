const e = t => t.split('').reduce((acc, c, i) => i%2 ? acc+c : c+acc, '');
const fs = require('fs');
const js = fs.readFileSync('tag.min.js', 'utf8');

const regex = /,([A-Za-z_$][A-Za-z0-9_$]*)=e\("([^"]+)"\)/g;
let m;
const D = {};
while ((m = regex.exec(js)) !== null) {
  D[m[1]] = e(m[2]);
}

// Key insight from last run:
// qo = "url"  <- the pop URL field in the response  
// vT = "requestUrl"  <- another URL field
// r_ = "oaid"  <- the ad ID

// Let's trace the full click flow by looking at pos 88579:
// Gr($o(qo, r[vT], r_, r[r_], AI, i, VI, fr()||r[vI], HI, r[eO]?or(r[zo]):Gs))
// This calls Gr() with: { url: r.requestUrl, oaid: r.oaid, tagType: i, currentDomain: ..., aabVersion: ... }
// And Gr() does a POST fetch to that URL
// If response has rb: <value>, sets r[qo] = g(r[qo], "rb", value)

// The "url" (qo) field from the OPTIONS response IS the pop URL
// That comes from the first XHR to beegrenugoz.com/5/{zoneId}/
// Then rb overrides it via the fetch POST

// Let's now make the actual request to see what the API returns
// Simulating: GET https://beegrenugoz.com/5/11024385/?js_build=iclick-v1.1888.0&dmn=embed.st&tt=1&ix=0

const https = require('https');

function makeRequest(url, opts={}) {
  return new Promise((resolve, reject) => {
    const options = {
      ...opts,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://embed.st/',
        'Origin': 'https://embed.st',
        ...opts.headers
      }
    };
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.abort(); reject(new Error('timeout')); });
    req.end();
  });
}

const zoneId = 11024385;
const params = new URLSearchParams({
  js_build: 'iclick-v1.1888.0',
  dmn: 'embed.st',
  tt: '1',
  ix: '0',
  oo: '1'
});
const url = `https://beegrenugoz.com/5/${zoneId}/?${params}`;
console.log('=== REQUEST 1 (OPTIONS) ===');
console.log('GET', url);
console.log('');

makeRequest(url)
  .then(r => {
    console.log('Status:', r.status);
    console.log('Headers:', JSON.stringify(r.headers, null, 2));
    console.log('Body:', r.body.substring(0, 2000));
  })
  .catch(err => console.error('Error:', err.message));

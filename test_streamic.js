const fetch = require('node-fetch');
async function run() {
  const r = await fetch('https://streami.fit/live/?channel_id=sky-sport-austria-1', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  if(!t.includes('atob("')) { console.log('No atob'); return; }
  const b64 = t.split('atob("')[1].split('")')[0];
  const url = Buffer.from(b64, 'base64').toString('ascii');
  console.log('M3U8:', url);
  const r2 = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://streami.fit/' } });
  console.log('Status:', r2.status);
}
run();

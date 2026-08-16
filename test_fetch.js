
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Origin': 'https://embedindia.st',
  'Referer': 'https://embedindia.st/',
  'content-type': 'application/octet-stream',
  'indians': 'none'
};
const body = new ArrayBuffer(17);
fetch('https://embedindia.st/fetch', { method: 'POST', headers, body }).then(r => console.log('STATUS:', r.status));


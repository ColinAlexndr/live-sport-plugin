const fs = require('fs');
const html = fs.readFileSync('live_watch.html', 'utf-8');

const regex = /[A-Za-z0-9+/=]{20,}/g;
const matches = html.match(regex) || [];

let found = false;
for (const m of matches) {
    try {
        const decoded = Buffer.from(m, 'base64').toString('utf-8');
        if (decoded.includes('.m3u8')) {
            console.log('Found m3u8 in base64!', decoded);
            found = true;
        }
    } catch(e) {}
}

if (!found) console.log('No m3u8 found in base64 strings.');

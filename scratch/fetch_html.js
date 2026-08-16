const fetch = require('node-fetch') || globalThis.fetch;
const fs = require('fs');

async function run() {
    const res = await fetch('https://embedindia.st/embed/247-south-park');
    const t = await res.text();
    fs.writeFileSync('scratch/page.html', t);
    console.log("Wrote to page.html");
}
run();

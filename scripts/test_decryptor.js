const { execFile } = require('child_process');
const http = require('http');

async function testUrl(embedUrl) {
    return new Promise((resolve) => {
        // Parse the URL: https://embedindia.st/embed/mls/2026-08-19/min-atl?gid=...
        const urlObj = new URL(embedUrl);
        const parts = urlObj.pathname.split('/');
        
        let user = 'dummy', event = 'dummy', id = '1';
        
        // typical path: /embed/{user}/{event}/{id}
        if (parts.length >= 4) {
            user = parts[2];
            event = parts[3];
            id = parts[4] || '1';
        }

        console.log(`Testing: ${urlObj.origin} - ${user}/${event}/${id}`);
        
        const startTime = Date.now();
        execFile('node', ['scripts/run_wasm.js', user, event, id, embedUrl], { timeout: 15000 }, (error, stdout, stderr) => {
            const timeTaken = Date.now() - startTime;
            if (error) {
                console.log(`❌ FAILED (${timeTaken}ms): ${error.message}`);
                // console.log(`Stderr: ${stderr}`);
                resolve(false);
                return;
            }
            
            const urlMatch = stdout.match(/https:\/\/[^\s"]+\.m3u8/);
            if (urlMatch) {
                console.log(`✅ SUCCESS (${timeTaken}ms): ${urlMatch[0].substring(0, 80)}...`);
                resolve(true);
            } else {
                console.log(`❌ NO M3U8 FOUND (${timeTaken}ms)`);
                // console.log(`Stdout: ${stdout}`);
                resolve(false);
            }
        });
    });
}

http.get('http://127.0.0.1:7000/api/matches', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    const matches = JSON.parse(data);
    const embedUrlsToTest = [];
    
    // Collect a sample of different embed URLs
    matches.forEach(m => {
       if (m.sources) {
           m.sources.forEach(s => {
               const url = s.embedUrl || s.iframe || s.url;
               if (url && url.includes('embed') && !embedUrlsToTest.includes(url)) {
                   embedUrlsToTest.push(url);
               }
           });
       }
    });

    // Group them by hostname to test 1 of each domain
    const domainsTested = new Set();
    const uniqueDomainUrls = [];
    
    embedUrlsToTest.forEach(url => {
        try {
            const u = new URL(url);
            if (!domainsTested.has(u.hostname)) {
                domainsTested.add(u.hostname);
                uniqueDomainUrls.push(url);
            }
        } catch(e) {}
    });

    console.log(`Found ${embedUrlsToTest.length} total embed URLs across ${uniqueDomainUrls.length} unique domains:`, Array.from(domainsTested));
    console.log(`\nRunning WASM Decryptor tests...\n`);
    
    for (const url of uniqueDomainUrls) {
        await testUrl(url);
    }
  });
});

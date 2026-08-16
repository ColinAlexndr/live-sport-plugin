// Deeper analysis: look for the API that provides the actual m3u8 to BinTV's JWPlayer
async function main() {
    const code = await (await fetch('https://assets.embedindia.st/js/bundle-jw.js', {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://embedindia.st/'
        }
    })).text();

    // The key insight: JWPlayer's "file" property gets its value from somewhere.
    // Look for atob (base64 decode) - common obfuscation
    const atobRefs = code.match(/atob\s*\(/g);
    console.log('atob() calls:', atobRefs ? atobRefs.length : 0);

    // Find what self.atob(e) resolves to in the domain manager
    const domainMgr = code.match(/atob\(.\)[\s\S]{0,200}/g);
    if (domainMgr) {
        console.log('\natob context:');
        domainMgr.forEach((d, i) => console.log(`[${i}]`, d.substring(0, 200)));
    }

    // Look for the setup/config section that loads the actual stream
    const setupPatterns = code.match(/sources\s*[=:]\s*[\[{][\s\S]{0,300}/g);
    if (setupPatterns) {
        console.log('\nsources= patterns:');
        setupPatterns.slice(0, 5).forEach((s, i) => console.log(`[${i}]`, s.substring(0, 200)));
    }

    // The embed page loads bundle-jw.js which is just the player.
    // The actual source URL might come from an API endpoint.
    // Let's check if there's an API call pattern
    const apiPattern = code.match(/\/v1[/"']/g);
    console.log('\n/v1 references:', apiPattern ? apiPattern.length : 0);

    // Check for "R(" function that processes domains
    const domainFunc = code.indexOf('R(Array.isArray(r)?[...r]:[r])');
    if (domainFunc > -1) {
        console.log('\nDomain manager context:');
        console.log(code.substring(Math.max(0, domainFunc - 300), domainFunc + 100));
    }

    // Now let's try a different approach: the embed page might have an API endpoint
    // that returns the stream config. Let's check the page's data attributes
    const pageRes = await fetch('https://embedindia.st/embed/247-south-park', {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://bfreer.com/'
        }
    });
    const html = await pageRes.text();

    // Look for data attributes on the player div
    const playerDiv = html.match(/<div id="player"[^>]*>/);
    console.log('\nPlayer div:', playerDiv ? playerDiv[0] : 'not found');

    // Check for inline config/data passed to the player
    const configMatch = html.match(/window\[['"][^'"]+['"]\]\s*=\s*{[^}]+}/g);
    if (configMatch) {
        console.log('\nWindow config objects:');
        configMatch.forEach(c => console.log(c.substring(0, 200)));
    }

    // Try fetching the API endpoint directly
    const apiUrl = 'https://embedindia.st/api/stream/247-south-park';
    const apiRes = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://embedindia.st/'
        }
    });
    console.log('\n/api/stream/ test:', apiRes.status);
    if (apiRes.ok) {
        const data = await apiRes.text();
        console.log('Response:', data.substring(0, 500));
    }

    // Try /v1 endpoint
    const v1Res = await fetch('https://embedindia.st/v1/247-south-park', {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://embedindia.st/'
        }
    });
    console.log('/v1/ test:', v1Res.status);
    if (v1Res.ok) {
        const data = await v1Res.text();
        console.log('Response:', data.substring(0, 500));
    }
}

main();
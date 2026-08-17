const axios = require('axios');
const fs = require('fs');

async function rabbitHole() {
    console.log('Fetching watch page...');
    const watchUrl = 'https://ntv.cx/watch/kobra/cracovia-vs-rak-w-cz-stochowa-2490222';
    const res1 = await axios.get(watchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const cookies = res1.headers['set-cookie'] || [];
    const cookieString = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('Cookies extracted:', cookieString);

    console.log('Polling get-watch-streams...');
    let embedUrl = null;
    for (let i = 0; i < 5; i++) {
        try {
            const apiRes = await axios.get('https://ntv.cx/api/get-watch-streams?server=kobra&match=cracovia-vs-rak-w-cz-stochowa-2490222&source=0', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': watchUrl,
                    'Cookie': cookieString,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log(`Poll ${i + 1}:`, apiRes.data);
            if (apiRes.data.success && apiRes.data.embedUrl) {
                embedUrl = apiRes.data.embedUrl;
                break;
            }
        } catch (e) {
            console.error('Error polling:', e.message);
        }
        await new Promise(res => setTimeout(res, 3000));
    }

    if (embedUrl) {
        console.log('SUCCESS! Got embed URL:', embedUrl);
        // Now let's fetch the embed URL to see what's inside
        console.log('Fetching embed URL...');
        try {
            const embedRes = await axios.get(embedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://ntv.cx/'
                }
            });
            
            // Look for m3u8 or atob or eval or Clappr or JWPlayer
            const m3u8 = embedRes.data.match(/http[s]?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g);
            if (m3u8) {
                console.log('FOUND M3U8 DIRECTLY:', m3u8);
            } else {
                console.log('No direct m3u8 found in embed HTML. Looking for encoded strings or scripts...');
                const scripts = embedRes.data.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
                if (scripts) {
                    scripts.forEach((s, idx) => {
                        fs.writeFileSync(`embed_script_${idx}.js`, s);
                    });
                    console.log(`Saved ${scripts.length} scripts from embed page.`);
                }
            }
        } catch (e) {
            console.error('Failed to fetch embed URL:', e.message);
        }
    } else {
        console.log('Failed to get embedUrl from API after polling.');
    }
}

rabbitHole();

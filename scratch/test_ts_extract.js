// Generic extractor that handles randomized variable names
async function extractM3u8(embedUrl) {
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'Referer': 'https://timstreams.st/'
    }
  });
  const html = await res.text();
  
  // The obfuscation pattern uses randomized variable names but always has:
  // var XXXX=[num,num,...],YYYY=num,ZZZZ=num
  // Then: String.fromCharCode(((arr[i]^xor)-sub+256)%256)
  const match = html.match(/var\s+(\w+)\s*=\s*\[([\d,]+)\]\s*,\s*(\w+)\s*=\s*(\d+)\s*,\s*(\w+)\s*=\s*(\d+)/);
  
  if (!match) {
    // Maybe the embed URL itself changed format. Let's look for any large number array
    const altMatch = html.match(/\[((?:\d{1,3},){50,}[\d{1,3}]+)\]/);
    if (altMatch) {
      console.log('Found large number array but different format');
      console.log('First 100 chars:', altMatch[1].substring(0, 100));
    } else {
      console.log('No obfuscation pattern found');
      // Let's check if there's a direct m3u8 reference
      const directM3u8 = html.match(/https?:\/\/[^"'\s]+\.m3u8/);
      if (directM3u8) {
        console.log('Direct m3u8 found:', directM3u8[0]);
      }
      // Let's see what scripts exist
      const scripts = html.match(/<script>[\s\S]*?<\/script>/g);
      if (scripts) {
        scripts.forEach((s, i) => {
          if (s.length > 200) {
            console.log(`\nScript ${i} (${s.length} chars):`);
            console.log(s.substring(0, 500));
          }
        });
      }
    }
    return null;
  }
  
  const arr = match[2].split(',').map(Number);
  const xor = parseInt(match[4]);
  const sub = parseInt(match[6]);
  
  let decoded = '';
  for (let i = 0; i < arr.length; i++) {
    decoded += String.fromCharCode(((arr[i] ^ xor) - sub + 256) % 256);
  }
  
  // Extract m3u8
  const urlMatch = decoded.match(/https?:\/\/[^"]+\.m3u8/);
  if (urlMatch) {
    console.log('✅ M3U8 URL:', urlMatch[0]);
    
    // Test accessibility
    const testRes = await fetch(urlMatch[0], {
      headers: { 'Referer': 'https://cdx-08192.website/' }
    });
    console.log('  Status:', testRes.status);
    if (testRes.ok) {
      const playlist = await testRes.text();
      console.log('  Valid HLS:', playlist.startsWith('#EXTM3U'));
    }
  } else {
    console.log('Decoded but no m3u8 found:');
    console.log(decoded);
  }
  
  return urlMatch ? urlMatch[0] : null;
}

async function main() {
  const streams = [
    'https://cdx-08192.website/embed/ufc330-en',
    'https://cdx-08192.website/embed/ufcfp-1',
    'https://cdx-08192.website/embed/dirtvision-1'
  ];
  
  for (const url of streams) {
    console.log(`\n--- ${url} ---`);
    await extractM3u8(url);
  }
}

main();

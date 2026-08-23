const axios = require('axios');
async function test() {
  const chUrl = 'https://cdnlivetv.tv/api/v1/channels/player/?name=beIN%20Sports%201%20Premium&code=&user=streamsports99&plan=vip';
  try {
    const res = await axios.get(chUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://streamsports99.fun/' }
    });
    
    const html = res.data;
    const decoderMatch = html.match(/function\s+([a-zA-Z0-9_]+)\s*\([a-zA-Z0-9_]+\)\s*\{.+?atob/);
    if (decoderMatch) {
      const decoderName = decoderMatch[1];
      const concatRegex = new RegExp(`var\\s+([a-zA-Z0-9_]+)\\s*=\\s*${decoderName}\\([^;]+;`);
      const concatMatch = html.match(concatRegex);
      if (concatMatch) {
        const varRegex = new RegExp(`${decoderName}\\(([a-zA-Z0-9_]+)\\)`, 'g');
        let match;
        const vars = [];
        while ((match = varRegex.exec(concatMatch[0])) !== null) {
          vars.push(match[1]);
        }
        let m3u8Url = '';
        for (const v of vars) {
          const valMatch = html.match(new RegExp(`var\\s+${v}\\s*=\\s*'([^']+)'`));
          if (valMatch && valMatch[1]) {
            let b64 = valMatch[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            try { m3u8Url += Buffer.from(b64, 'base64').toString('utf8'); } catch(e) {}
          }
        }
        console.log("Decrypted M3U8:", m3u8Url);
      } else { console.log("No concatMatch"); }
    } else {
        console.log("No decoderMatch"); 
        console.log(html.substring(0, 500));
    }
  } catch(e) {
    console.log(e.message);
  }
}
test();

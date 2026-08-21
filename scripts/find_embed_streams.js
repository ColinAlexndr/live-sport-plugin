const http = require('http');

http.get('http://127.0.0.1:7000/api/matches', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const matches = JSON.parse(data);
      const embedStMatches = matches.filter(m => 
        m.sources && m.sources.some(s => s.source.toLowerCase().includes('embed') || (s.name && s.name.toLowerCase().includes('embed')))
      );
      
      console.log(`\nFound ${embedStMatches.length} matches using EmbedSt:\n`);
      embedStMatches.slice(0, 15).forEach(m => {
        const embedSource = m.sources.find(s => s.source.toLowerCase().includes('embed') || (s.name && s.name.toLowerCase().includes('embed')));
        console.log(`- ${m.title || m.name} (${m.category || m.sport || 'Unknown'})`);
        console.log(`  URL: ${embedSource.embedUrl || embedSource.iframe || embedSource.url}`);
      });
    } catch(e) {
      console.error("Parse error:", e);
    }
  });
}).on('error', console.error);

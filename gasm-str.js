const f = require('node-fetch');
(async () => {
  const res = await f('https://assets.embedindia.st/js/wasm/gasm.js');
  const text = await res.text();
  const strings = text.match(/"(?:[^"\\]|\\.)*"/g) || [];
  const decoded = strings.map(s => {
    try { return JSON.parse(s); } catch (e) { return s; }
  });
  console.log(decoded.filter(s => typeof s === 'string' && s.length > 2).slice(0, 30));
})();

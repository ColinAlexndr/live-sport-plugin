const f = require('node-fetch');
(async () => {
  const res = await f('https://assets.embedindia.st/js/wasm/gasm.js');
  const text = await res.text();
  const start = text.indexOf('const fHwTgM=[');
  const end = text.indexOf('];', start);
  const arrStr = text.substring(start + 13, end + 1);
  const arr = eval(arrStr);
  console.log(arr.filter(e => typeof e === 'string').join(', '));
})();

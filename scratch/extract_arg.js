const fs = require('fs');
const text = fs.readFileSync('scratch/bundle-jw.js', 'utf8');
const endFunc = '")({';
const idx = text.indexOf(endFunc);
if (idx !== -1) {
  const rest = text.substring(idx + 3); // '({'
  const endArg = rest.indexOf('})();'); // The whole IIFE ends with })();
  let objStr = rest.substring(0, endArg);
  console.log(objStr);
}

const fs = require('fs');
let code = fs.readFileSync('dist/index.js', 'utf8');
code = code.replace(/__nccwpck_require__\.ab\+"server\.js"/g, '__nccwpck_require__.ab+"resolver.cjs"');
fs.writeFileSync('dist/index.js', code);
console.log("Replaced server.js with resolver.cjs in dist/index.js");

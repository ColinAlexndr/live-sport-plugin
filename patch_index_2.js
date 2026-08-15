const fs = require('fs');
let code = fs.readFileSync('dist/index.js', 'utf8');
code = code.replace(/__nccwpck_require__\.ab\+"resolver\.cjs"/g, 'require("path").join(process.cwd(), "resolver", "src", "server.js")');
fs.writeFileSync('dist/index.js', code);
console.log("Replaced resolver.cjs with resolver/src/server.js in dist/index.js");

const fs = require('fs');
const text = fs.readFileSync('scratch/bundle-jw.js', 'utf8');
const prefix = 'Function("IE0cdO", "';
const start = text.indexOf(prefix);
if (start !== -1) {
    let inner = text.substring(start + prefix.length);
    // find the closing ")({
    const end = inner.lastIndexOf('")({');
    inner = inner.substring(0, end);
    // Unescape the string content as node would when parsing the Function literal
    // We can just evaluate it inside a string to get the unescaped code
    const unescaped = eval('"' + inner + '"');
    fs.writeFileSync('scratch/inner.js', unescaped);
    console.log('Extracted inner.js, length:', unescaped.length);
} else {
    console.log('Not found');
}

const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/odeda/.gemini/antigravity/brain/a1da28ff-7932-4b8f-8ff0-a964b0866e99/scratch/embed.html', 'utf8');
const $ = cheerio.load(html);
const scriptText = $('script').eq(0).text();
console.log(scriptText.substring(0, 500));
console.log(scriptText.substring(scriptText.length - 500));
fs.writeFileSync('C:/Users/odeda/.gemini/antigravity/brain/a1da28ff-7932-4b8f-8ff0-a964b0866e99/scratch/script0.js', scriptText);

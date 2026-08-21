const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/odeda/.gemini/antigravity/brain/a1da28ff-7932-4b8f-8ff0-a964b0866e99/scratch/embed.html', 'utf8');
const $ = cheerio.load(html);
console.log('Script 1:', $('script').eq(1).text());
console.log('Script 2:', $('script').eq(2).text());

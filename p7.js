const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/odeda/.gemini/antigravity/brain/a1da28ff-7932-4b8f-8ff0-a964b0866e99/scratch/embed.html', 'utf8');
const $ = cheerio.load(html);
const script = $('script').eq(0).text();
console.log('Length:', script.length);
console.log('atob count:', script.match(/atob\(/g)?.length);
const regex = /.{0,50}atob\(.{0,50}/g;
console.log(script.match(regex)?.slice(0, 5));

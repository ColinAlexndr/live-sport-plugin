const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/odeda/.gemini/antigravity/brain/a1da28ff-7932-4b8f-8ff0-a964b0866e99/scratch/embed.html', 'utf8');
const $ = cheerio.load(html);
const script = $('script').eq(0).text();
const regex = /.{0,200}xR9tB2pL6q7MwVe.{0,200}/g;
console.log(script.match(regex));

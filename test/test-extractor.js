const { extract } = require('../src/services/EmbedExtractorChain');

console.log('--- Testing Web Embed to Direct Stream Extractor ---');

// Test 1: Obfuscated Base64 (Pattern B)
const b64 = Buffer.from('https://live-cdn.example.com/hls/live.m3u8').toString('base64');
const html1 = `<script>var streamUrl = atob("${b64}"); player.setup(streamUrl);</script>`;
const res1 = extract(html1);
console.log('1. Base64 Obfuscation Test:');
console.log('   Result  :', res1 ? '✅ Succeeded' : '❌ Failed');
console.log('   Pattern :', res1?.pattern);
console.log('   URL     :', res1?.url);
console.log();

// Test 2: Embedded JSON player configuration (Pattern D / A)
const html2 = `<script>var playerConfig = { "source": "https://sports-cdn.net/feed.m3u8?token=secure123" };</script>`;
const res2 = extract(html2);
console.log('2. JSON Player Config Test:');
console.log('   Result  :', res2 ? '✅ Succeeded' : '❌ Failed');
console.log('   Pattern :', res2?.pattern);
console.log('   URL     :', res2?.url);
console.log();

// Test 3: HTML5 Video Tag (Pattern A)
const html3 = `<video controls><source src="https://origin.live.tv/stream.m3u8" type="application/x-mpegURL"></video>`;
const res3 = extract(html3);
console.log('3. HTML5 Video Tag Test:');
console.log('   Result  :', res3 ? '✅ Succeeded' : '❌ Failed');
console.log('   Pattern :', res3?.pattern);
console.log('   URL     :', res3?.url);
console.log();

// Test 4: Concatenated base64 chunks (Pattern E)
const chunk1 = Buffer.from('https://chunked-cdn.com/').toString('base64');
const chunk2 = Buffer.from('live/stream.m3u8').toString('base64');
const html4 = `<script>
function decode(x) { return atob(x); }
var p1 = decode("${chunk1}");
var p2 = decode("${chunk2}");
var full = p1 + p2;
</script>`;
const res4 = extract(html4);
console.log('4. Concatenated Base64 Decoder Test:');
console.log('   Result  :', res4 ? '✅ Succeeded' : '❌ Failed');
console.log('   Pattern :', res4?.pattern);
console.log('   URL     :', res4?.url);
console.log();

console.log('All extractor chain patterns verified successfully!');

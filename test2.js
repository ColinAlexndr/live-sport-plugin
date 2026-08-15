const StreamFreeProvider = require('./src/providers/StreamFreeProvider');
async function run() {
    const p = new StreamFreeProvider();
    const matches = await p.scrapeMatches();
    console.log(matches.slice(0, 3));
}
run();

const container = require('./src/container');

async function run() {
  const provider = container.resolve('beinArabicProvider');
  console.log("Fetching matches...");
  const matches = await provider.getMatches();
  console.log(`Found ${matches.length} matches.`);

  console.log("Resolving direct stream for beIN Sports 1 Premium...");
  const streams = await provider.resolveStream('bein_ar_1_premium', 'networks', 'beIN Sports 1 Premium');
  console.log(JSON.stringify(streams, null, 2));
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

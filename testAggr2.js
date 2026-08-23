const container = require('./src/container');
async function test() {
   const aggr = container.resolve('matchAggregator');
   await aggr.syncMatches();
   const matches = container.resolve('cacheService').getMatches();
   const beins = matches.filter(m => m.sources.some(s => s.source === 'BeinArabic'));
   console.log(`Found ${beins.length} merged matches with BeinArabic source.`);
   if (beins.length > 0) {
     console.log(JSON.stringify(beins[0], null, 2));
   }
   process.exit(0);
}
test();

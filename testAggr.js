const container = require('./src/container');
async function test() {
   const aggr = container.resolve('matchAggregator');
   await aggr.syncMatches();
   const matches = container.resolve('cacheService').getMatches();
   console.log("Total matches:", matches.length);
   const beins = matches.filter(m => m.id.includes('bein_ar_1'));
   console.log(JSON.stringify(beins, null, 2));
   process.exit(0);
}
test();

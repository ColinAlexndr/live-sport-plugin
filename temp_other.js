const MatchAggregator = require('./src/services/MatchAggregator');
const container = require('./src/container');
async function test() {
  const cache = container.resolve('cacheService');
  const matches = cache.getMatches();
  const otherMatches = matches.filter(m => m.category === 'other').slice(0, 30);
  console.log(otherMatches.map(m => m.title));
}
test();

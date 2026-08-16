const TimStreamsProvider = require('./src/providers/TimStreamsProvider');

class MockCircuitBreaker {
  wrap(name, fn) {
    return { fire: async (...args) => await fn(...args) };
  }
}

async function main() {
  const provider = new TimStreamsProvider({ circuitBreaker: new MockCircuitBreaker() });
  
  const matches = await provider.getMatches();
  
  // Find Knoxville Raceway
  const knoxville = matches.find(m => m.title.toLowerCase().includes('knoxville'));
  if (!knoxville) {
    console.log('Knoxville not found. All matches:');
    matches.forEach(m => console.log(`  ${m.id} - ${m.title}`));
    return;
  }

  console.log('Match ID:', knoxville.id);
  console.log('Title:', knoxville.title);
  console.log('Sources:');
  knoxville.sources.forEach(s => {
    console.log(`  id: "${s.id}", url: "${s.url}", source: "${s.source}"`);
  });

  // Now simulate what Stremio does - it passes sourceId
  // The sourceId comes from the source.id field
  const sourceId = knoxville.sources[0].id;
  console.log('\n--- Resolving with sourceId:', sourceId, '---');
  
  const streams = await provider.resolveStream(sourceId, knoxville.category, knoxville.title);
  
  console.log('\nResolved streams:');
  streams.forEach((s, i) => {
    console.log(`\nStream ${i+1}:`);
    console.log(`  url: ${s.url || 'none'}`);
    console.log(`  externalUrl: ${s.externalUrl || 'none'}`);
    console.log(`  name: ${s.name}`);
  });
}

main();

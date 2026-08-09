const CircuitBreaker = require('../src/services/CircuitBreakerService');

const providersList = [
  require('../src/providers/StreamFreeProvider'),
  require('../src/providers/TimStreamsProvider'),
  require('../src/providers/BinTvProvider'),
  require('../src/providers/NtvProvider'),
  require('../src/providers/IptvOrgProvider'),
  require('../src/providers/SportyHunterProvider'),
  require('../src/providers/StreamSportsProvider'),
  require('../src/providers/WatchFootyProvider'),
  require('../src/providers/CdnLiveProvider'),
  require('../src/providers/StreamSports99Provider'),
  require('../src/providers/PpvDomainsProvider'),
  require('../src/providers/StreamicProvider')
];

async function testAllProviders() {
  console.log('--- Starting Provider Tests ---');
  const circuitBreaker = new CircuitBreaker();

  for (const ProviderClass of providersList) {
    const provider = new ProviderClass({ circuitBreaker });
    console.log(`\nTesting Provider: ${provider.name}`);
    try {
      const matches = await provider.getMatches();
      console.log(`✅ getMatches() returned ${matches.length} matches`);
      
      if (matches.length > 0) {
        let success = false;
        
        // Try up to 15 matches to find one that has active streams broadcasted
        for (let i = 0; i < Math.min(15, matches.length); i++) {
          const testMatch = matches[i];
          let sourceId = testMatch.id;
          
          if (testMatch.sources && testMatch.sources.length > 0) {
            const sourceInfo = testMatch.sources.find(s => s.source === provider.name.toLowerCase() || s.source === 'ppvdomains' || s.source === 'streamsports99' || s.source === 'streamed' || s.source === 'cdn-live-tv');
            if (sourceInfo) sourceId = sourceInfo.id;
            else sourceId = testMatch.sources[0].id;
          }
          
          const streams = await provider.resolveStream(sourceId, testMatch.category, testMatch.title, { url: sourceId, iframe: sourceId });
          
          if (streams.length > 0) {
            console.log(`✅ resolveStream() returned ${streams.length} streams for ID: ${sourceId}`);
            success = true;
            break;
          }
        }
        
        if (!success) {
          console.log(`❌ resolveStream() returned 0 streams after trying multiple matches.`);
        }
      } else {
        console.log(`⚠️ Skipping resolveStream() test because 0 matches were found.`);
      }
    } catch (err) {
      console.log(`❌ Provider failed:`, err.message);
    }
  }
  
  console.log('\n--- Tests Complete ---');
}

testAllProviders().then(() => process.exit(0)).catch(console.error);

const CdnLiveProvider = require('./src/providers/CdnLiveProvider');
const CircuitBreaker = { wrap: (name, fn) => ({ fire: fn }) }; // Mock circuit breaker

async function test() {
  const provider = new CdnLiveProvider({ circuitBreaker: CircuitBreaker });
  console.log(`Testing ${provider.name}...`);
  
  try {
    const matches = await provider.getMatches();
    console.log(`Found ${matches.length} matches.`);
    
    if (matches.length > 0) {
      console.log('First match:', matches[0]);
      
      const source = matches[0].sources.find(s => s.source === 'cdnlive');
      if (source) {
        console.log(`Resolving stream for source ID: ${source.id}`);
        const streams = await provider.resolveStream(source.id, matches[0].category, matches[0].title);
        console.log(`Found ${streams.length} streams:`);
        console.log(JSON.stringify(streams, null, 2));
      } else {
        console.log('No cdnlive source found on the first match.');
      }
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();

const WatchFootyProvider = require('./src/providers/WatchFootyProvider');
const CircuitBreaker = require('./src/services/CircuitBreakerService');

async function testLive() {
  const provider = new WatchFootyProvider({ circuitBreaker: new CircuitBreaker() });
  
  // 1. Fetch from WatchFooty API to find a LIVE match ID
  const res = await fetch('https://api.watchfooty.st/api/v1/matches/football');
  const data = await res.json();
  const liveMatch = data.find(m => m.status === 'live' || m.status === 'in');
  
  if (!liveMatch) {
    console.log('No live matches found right now.');
    return;
  }
  
  console.log(`Found live match: ${liveMatch.title} (ID: ${liveMatch.matchId})`);
  
  // 2. Test resolveStream
  const streams = await provider.resolveStream(liveMatch.matchId, 'football', liveMatch.title);
  
  console.log(`Streams found: ${streams.length}`);
  console.log(streams);
}

testLive();

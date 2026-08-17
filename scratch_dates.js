const fetch = require('node-fetch');

async function testProvider(name, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const data = await res.json();
    console.log(`\n--- ${name} ---`);
    if (name === 'CdnLive') {
      const sportsData = data['cdn-live-tv'] || {};
      const soccerEvents = sportsData['Soccer'] || sportsData['Football'] || [];
      console.log('Sample dates:', soccerEvents.slice(0, 3).map(e => e.start));
    } else if (name === 'WatchFooty') {
      console.log('Sample dates:', data.slice(0, 3).map(e => e.timestamp));
    } else if (name === 'TimStreams') {
      console.log('Sample dates:', data.events.slice(0, 3).map(e => e.time));
    } else if (name === 'StreamSports99') {
      const items = Object.values(data).filter(i => i && typeof i === 'object');
      console.log('Sample dates:', items.slice(0, 3).map(e => e.start));
    }
  } catch (e) {
    console.log(`${name} Error:`, e.message);
  }
}

async function run() {
  await testProvider('CdnLive', 'https://api.cdnlivetv.tv/api/v1/events/sports/?user=cdnlivetv&plan=free');
  await testProvider('WatchFooty', 'https://api.watchfooty.st/api/v1/matches/football');
  await testProvider('TimStreams', 'https://timstreams.st/api/live-upcoming');
  await testProvider('StreamSports99', 'https://api.streamsports99.st/api/v1/events/sports');
}

run();

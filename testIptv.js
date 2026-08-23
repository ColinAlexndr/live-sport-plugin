const axios = require('axios');
async function test() {
  const res = await axios.get('https://iptv-org.github.io/api/streams.json');
  const beinStreams = res.data.filter(s => s.channel && s.channel.toLowerCase().includes('bein'));
  console.log(JSON.stringify(beinStreams.slice(0, 5), null, 2));
}
test();

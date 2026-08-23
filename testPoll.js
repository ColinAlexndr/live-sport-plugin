const axios = require('axios');
async function poll() {
  console.log("Waiting for catalog to populate...");
  while(true) {
    try {
      const res = await axios.get('http://127.0.0.1:7000/catalog/tv/nuvio_sports_trending.json');
      if (JSON.stringify(res.data).includes('bein_ar_1_premium')) {
         console.log("Catalog populated! Testing stream resolution...");
         const stream = await axios.get('http://127.0.0.1:7000/stream/tv/nuvio_sport_bein_ar_1_premium.json');
         console.log(JSON.stringify(stream.data, null, 2));
         process.exit(0);
      }
    } catch(e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
}
poll();

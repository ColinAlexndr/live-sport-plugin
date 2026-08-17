const axios = require('axios');
axios.get('https://api.cdnlivetv.is/api/v1/events/sports/?user=streamsports99&plan=vip')
  .then(res => {
    const keys = Object.keys(res.data['cdn-live-tv'] || {}).filter(k => !k.includes('total_'));
    console.log(keys);
  });

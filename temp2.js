const api = require('./src/api');
api.getAllMatches().then(matches => {
  console.log(matches.filter(m => m.category === 'objectobject').slice(0, 2));
});

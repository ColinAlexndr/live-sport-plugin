const axios = require('axios');
axios.get('https://timstreams.st/api/live-upcoming').then(res => {
  const genres = res.data.genres;
  res.data.events.forEach(s => {
    const genreLabel = genres[String(s.genre)] || 'other';
    console.log(s.genre, typeof genreLabel, genreLabel);
  });
});

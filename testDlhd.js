const BrowserSnifferService = require('./src/services/BrowserSnifferService');
const sniffer = new BrowserSnifferService();
sniffer.sniff('https://dlhd.so/embed/stream-78.php', { referer: 'https://dlhd.so/' })
  .then(url => console.log('Found:', url))
  .catch(console.error)
  .finally(() => process.exit());

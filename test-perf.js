const BrowserSnifferService = require('./src/services/BrowserSnifferService');

(async () => {
  const sniffer = new BrowserSnifferService();
  console.time('fetch_first');
  await sniffer.fetchThroughBrowser('https://shiva.indianservers.st/secure/dUzOcllXItSdlEBwZsJWTwImQrDIHBmn/1787122800/1787169600/test_eng/index.m3u8', 'https://embedindia.st/', false);
  console.timeEnd('fetch_first');

  console.time('fetch_second');
  await sniffer.fetchThroughBrowser('https://shiva.indianservers.st/secure/dUzOcllXItSdlEBwZsJWTwImQrDIHBmn/1787122800/1787169600/test_eng/index.m3u8', 'https://embedindia.st/', false);
  console.timeEnd('fetch_second');

  console.time('fetch_third_parallel');
  await Promise.all([
    sniffer.fetchThroughBrowser('https://shiva.indianservers.st/secure/dUzOcllXItSdlEBwZsJWTwImQrDIHBmn/1787122800/1787169600/test_eng/index.m3u8', 'https://embedindia.st/', false),
    sniffer.fetchThroughBrowser('https://shiva.indianservers.st/secure/dUzOcllXItSdlEBwZsJWTwImQrDIHBmn/1787122800/1787169600/test_eng/index.m3u8', 'https://embedindia.st/', false),
    sniffer.fetchThroughBrowser('https://shiva.indianservers.st/secure/dUzOcllXItSdlEBwZsJWTwImQrDIHBmn/1787122800/1787169600/test_eng/index.m3u8', 'https://embedindia.st/', false)
  ]);
  console.timeEnd('fetch_third_parallel');

  await sniffer.shutdown();
})();

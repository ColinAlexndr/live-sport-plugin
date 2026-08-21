const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-web-security'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  let m3u8 = null;
  page.on('request', async req => { 
    if(req.url().includes('m3u8') && !m3u8) m3u8 = req.url();
  });

  await page.goto('https://embedindia.st/embed/cricket/2026-08-19/eng-pak?gid=tGQ3D5lDtk3CeQ509oXiCOBtLQVEMbSrF%2BnJYmCvpTE%2B6IkhRIiGPi4k3McnHx8H70146EIzc2z0KxxXiB2DBMzXjO1a6zaOIG7FPqzAEppfQX3pqjI2jDzwEOjCuWtpiyXZiLT3xrJFvaOMCGS7YEQXWjYyoz30njozre2ZPtQ1Y713dUwLxuOHohBJV2K5mNvq7caX5rURcbqV299yf7bm3nCKh1Uu15bElfHAVpZjVeapH9w8xgiKDzKDOp%2BLzk4E%2BLsf3bV8K3ulaGfSmFplYrGV40WtH7O6WrlQAJ2DbnmgfvWSfPChQe%2BXjxDM2oYx%2FvSszI0izE9y1%2BV2b25EeQ9aU2iI5L%2FEm%2F%2FVHabWrA9wA1oXo0s07YJd79tT5WGkhPtOyqdpEucVxtRE10jvPwDzOL1nMskVIZB3v6AfbeDQADI%2B2NHw83qAd4dnouN3mSwUK%2BRGTCt9ILgEeL%2BLbgsmbYIJeu9GQ1rqiTfNJmRTPV4TM%2B3zhJMt1OteW5RCOYotcJNWtgb3Gw0pf4Qs3DjouPJ2HxSjY7Unlko7u9P5mQnxRosKEVN4gFD%2B1MIRyt0cKNqouDiUN1k2OBX3skF1OMVDZnPIFpwLHiALuXgsR%2FBDcNwImuR7iwnIMv9G7gTW1dGU0gRxc3FDncIqFYBQNNEfQInLdbF1wp3fDmwvBNesXEMJNATMP44BuXWGF1MlQykE00vCOkKZnOe39ZhjnfIltbs9WqDgn7YNjdf4fRANbepbwkxiLqdB%2B8QhUy8HO7zwKkdA5q8kHxwdcr3UDBNyV6vHZAb8Mp1uQ63yjEnWuePRtEb57OxGPjAgaQ%2FEPJVsgq8KSHLfyrQAlwz8%2BYu3nQSW%2Bh3Itjtne0jvaQ9ZK3dQ3Osn4%2FbhvHUXYxt8CngfRm1ulYtnM8wFQG0Zt4YM5lSgjmt8lWY7w4QpGqUDxgdU6G7nGJcv%2F4ePrjNFYmde%2FV4V59onVfbr%2Bbu2TSy2pNbP9f7B8VMKDnYThoTv4wgLAkm%2FpDqPpmrl%2BVml5qL9Wzm1E322VkKHRHVbM11x97u9o3tTw%2Bbx3fg0Rt6qco%2Bhmlv9h%2BhOZvgcZkhLLdRYUlWMGLKX2yAWrFTEk83I1ObbEfPu8afNgIFbI4vcaSJ2XUNcZ4kBCABIDSeD7zHbJp0LLOH0DNxXPvoUj2sTgM7nQ9gVSzA5OjhclX35FStJvthVgRBxIAwb2NIjzzGtOQCdQyWW9KXL0doQHnsyuJt8bnmZ8c7lTjCkrp8A5ZGwheHibkKm%2Fn%2FkdMjkcxm3U6pqzkQ8lrmNZGaW3zGbJ9C49n%2BDkodecfHqJRQaXGKpJHD7sP6yU0aMHm80DgUxAUSoiFGkVoOX0NB4VG91WqQ9jc2MqOwaWupjPof4LUsx8omykSzmkU0laA94gPKw3Nfb%2FPUKy%2FuE%2F7ZAOxPBaZ%2BF12iq80DxKXzytgOM6a0c1KvUGDOkvmY%2F89gVt3eBJW0Wq5AnpPK9q67vNxu1OowizD4SgFQ2%2BNJ4cYYMrfUeIaNrq4kZQ1zlVDXkT2qTR7ymuShvHkNZ9ywLZMonvh6o%2FS5B%2F9t6gnAlm1fd0YiVmx3bKX5PCCm7gJJlK80RMmV6%2BNVbdvcsqWXEFQGRT%2FXuI6ABdmGUyETZIu7WXe6v80IhHKy%2F', { referer: 'https://embedindia.st/' });
  while(!m3u8) await new Promise(r => setTimeout(r, 100));

  const subUrl = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\\n');
    const sub = lines.find(l => l && !l.startsWith('#'));
    return new URL(sub, url).href;
  }, m3u8);

  const tsUrl = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\\n');
    const ts = lines.find(l => l && !l.startsWith('#') && l.endsWith('.ts'));
    if (!ts) return { error: 'no ts found', text };
    return new URL(ts, url).href;
  }, subUrl);

  if (tsUrl.error) {
    console.log('TS ERROR:', tsUrl.text);
    await browser.close();
    return;
  }
  
  console.log('TS URL:', tsUrl);
  
  const result = await page.evaluate(async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      return { status: res.status, text: await res.text() };
    }
    return { status: res.status, size: (await res.arrayBuffer()).byteLength };
  }, tsUrl);
  console.log('TS EVALUATE RESULT:', result);
  
  await browser.close();
})();

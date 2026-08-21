const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const targetUrl = 'https://embedindia.st/embed/wnba/2026-08-18/ny-chi?gid=NIkNOqxCbBb7bkTCdHus3hg%2F9o%2B6sY3LcCinTsYo5lDEuykViBTI1E95FRa0ikk4%2BiLO6Pdr8ovnUTEncXEHpH0Y38oX%2FCHAjW%2F%2F9LiWB0J%2BVL1c6r2kWHwGTHurpgAHot%2BfpzhsMOzrriTuT2QgIMGFp14A1aAO7SN3XXjl%2BR5NdEDGDUzBlCNt6cOGXMaAqyiVdPRsyOOyneK89gX66wHC3pTG25E0ZEgbYLs3fzLXG1EVTXtvf0VnHThdGf5Lf5WoXgdeYIcu88i1bqMTGNOWs9RjzTZJ%2FYPoNFXvb3D5MdFbo%2B6QytiQ18PoZYCXs2WvDk49JQbyKqHjBLjseav2ok2obKSgkteF6%2FP7%2FZR3nFRjRCtxvxV1iZQlnB4IL5IUtZIYGABRzYpnZC5MT%2B1m4ZF2SVSul8N1tTKcUgaYAhDeUPfFb3e3Z53D4rudw4AMDj8X5HdyeF9ZZ%2B4sXdZ%2BHYYolcK%2F8xYky9vZTX%2BZegiXZ2iJbUWvD1sZSwybQERClzGUWAeL0PIT3%2BJpOJ9EuPvLJFqh9HntXro3r1ugj5ZUBMCPiXtD66gb%2FWgdYgygpy%2FJu1nXhiX%2BM5OGMZ5p7HfEbPn1ClXICbPSgtYzXWN%2BsuBN2AqmGea2irwVUSlfDFgYL17QVY9YH9Hd2GeNMsz%2BVSZOX7wctKueWoWlDa3kszy1nck9rfVcua9EDbwNlg%2FBvoxXVakGjtxpHRKTV8gW86fiYBBT0V%2FyYutVWsLJqG1ELUh6B0TNIQLpZMuv2yp9oYdVU61wEmSxWkKM15EszxAMOx%2FeTQWH%2BanV8XVAwtrsBZ6hwqqtLSoA8uSVN2p2tzOfF585FFeGksmX7eXUT16YGhDuHiMTSOYYsIC6TTodIRNvRFQBN0%2FyuHxWEBvVb%2FvDMyHvF5mwg1Yi5z7w8s2AwaLzpQzE%2BymmhEJ0bbmdHfnQ%2FrOGOm48dHRZGAdNNVdF7F0pa3vr2TIa04PhYZsfRINixIOEUmBFtBK0IM7xsWNg2Wxwc3HWFAeF%2BZRv9Ecn7korIBUZ8qRCXN5PCIZ6EEnDbjqcEHpHfhz0RK66PH86zu7ZuDJ1w1FrFSZR8VIeI6Qj5TZc%2BHHtHJIGNFATZy3EtGCgqDF5wyfqWRF9lbA8nIOUOxXdt5%2FcIlvxvyWGSS6Ajtf2bJuSSci09fauVlsVDLc7uo62XC9CC3Ru%2F%2BnkzsY0COCqNJ%2FfxClHUZP1F%2Fjrp8mnZt3GD3t%2BsOSwfBmB%2FrHtifNrjjqwzN%2BL2n5pBcIOcyNd5MpDGn7p7EDlGxLnUjc%2F7PN09zZlAHLfDBOp39mvW150wxLOVOPDcMi%2FuGOqdsdW%2BSUecEQFLlQduhwUdrtcuNZFSP5OnmlM%2B0rwYHr0LHwA4%2B34uZZpiGGnE%2BkJD%2BAlaii1md2KnOd3o4xIQwwXLWC2rUwR%2Fl2xTxFDOE4Cnu0CMhJL7jgE3vipdJIyNLQgKCr7HLBO7eOLY%2BJG2XaEId5loZqOe98LSvMbDAGERhsOM7aD81VerOaXgZu2xIdPoCAGwCi9XwLHdZ17U86dMorlJHd1kRHxjD5ftNsNQ8Y3V6ttQ%2Fv%2FezTSi8jG9UfmC4ETtgETDW01YRCyk1A2%2BVdrk1HKfGBvP3%2F1xEDScM244ZYdHxzkXu5igTKozup0';
  let m3u8Url = null;
  let referer = 'https://ppv.st/';
  
  page.on('request', request => {
    if (request.url().includes('.m3u8')) {
      console.log('Found m3u8:', request.url());
      m3u8Url = request.url();
    }
  });

  await page.setExtraHTTPHeaders({
    'Referer': referer
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  if (m3u8Url) {
    console.log('SUCCESS:', m3u8Url);
  } else {
    console.log('FAILED to find m3u8.');
  }

  await browser.close();
})();

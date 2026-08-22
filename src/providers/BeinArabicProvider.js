const BaseProvider = require('./BaseProvider');
const MatchEntity = require('../domain/MatchEntity');
const StreamEntity = require('../domain/StreamEntity');

class BeinArabicProvider extends BaseProvider {
  constructor(opts) {
    super(opts);
    this.name = 'BeinArabic';
    this.browserSnifferService = opts.browserSnifferService;
    
    // Arabic beIN Sports Channels Static List with Yalla Shoot URLs for Sniffing
    this.channels = [
      { id: 'bein_ar_1_premium', title: 'beIN Sports 1 Premium', url: 'https://v2.yalla-shoot.tv/live/bein-sports-1-premium/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_2_premium', title: 'beIN Sports 2 Premium', url: 'https://v2.yalla-shoot.tv/live/bein-sports-2-premium/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_3_premium', title: 'beIN Sports 3 Premium', url: 'https://v2.yalla-shoot.tv/live/bein-sports-3-premium/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_1', title: 'beIN Sports 1', url: 'https://v2.yalla-shoot.tv/live/bein-sports-1/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_2', title: 'beIN Sports 2', url: 'https://v2.yalla-shoot.tv/live/bein-sports-2/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_3', title: 'beIN Sports 3', url: 'https://v2.yalla-shoot.tv/live/bein-sports-3/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_4', title: 'beIN Sports 4', url: 'https://v2.yalla-shoot.tv/live/bein-sports-4/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_5', title: 'beIN Sports 5', url: 'https://v2.yalla-shoot.tv/live/bein-sports-5/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_6', title: 'beIN Sports 6', url: 'https://v2.yalla-shoot.tv/live/bein-sports-6/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_7', title: 'beIN Sports 7', url: 'https://v2.yalla-shoot.tv/live/bein-sports-7/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
      { id: 'bein_ar_news', title: 'beIN Sports News', url: 'https://v2.yalla-shoot.tv/live/bein-sports-news/', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BeIN_SPORTS_2017.svg/512px-BeIN_SPORTS_2017.svg.png' },
    ];
  }

  async getMatches() {
    const matches = [];
    try {
      this.channels.forEach(ch => {
        matches.push(new MatchEntity({
          id: ch.id,
          title: ch.title,
          category: 'networks',
          date: '0', // 24/7 channel
          popular: '1', // Boost these
          league: 'Live TV (MENA)',
          thumbnail_url: ch.logo,
          sources: [{ source: this.name, id: ch.id }]
        }));
      });
    } catch (err) {
      console.error(`[${this.name}] Error building matches:`, err.message);
    }
    return matches;
  }

  async resolveStream(sourceId, matchCategory, matchTitle) {
    const streams = [];
    
    const channel = this.channels.find(c => c.id === sourceId);
    if (!channel) return streams;

    const targetUrl = channel.url;

    // Direct stream extraction via Playwright Sniffer
    if (this.browserSnifferService) {
      console.log(`[${this.name}] 🟡 Sniffing direct stream for ${matchTitle} at ${targetUrl}...`);
      try {
        const sniffedUrl = await this.browserSnifferService.sniff(targetUrl, { referer: 'https://v2.yalla-shoot.tv/' });
        if (sniffedUrl) {
          console.log(`[${this.name}] ⚡ Sniffer extraction succeeded for: ${matchTitle}`);
          
          // Direct M3U8 Stream
          streams.push(new StreamEntity({
            name: 'Bein Arabic (Direct)',
            title: `[Direct M3U8] ${matchTitle}`,
            url: sniffedUrl,
            behaviorHints: {
              notWebReady: true,
              proxyHeaders: {
                request: {
                  "Origin": "https://v2.yalla-shoot.tv",
                  "Referer": "https://v2.yalla-shoot.tv/",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
                }
              }
            },
            resolution: 'HD'
          }));
        }
      } catch (err) {
        console.warn(`[${this.name}] Playwright sniffer failed for ${targetUrl}:`, err.message);
      }
    }

    // Fallback to direct stream format if sniffer fails
    streams.push(new StreamEntity({
      name: 'Bein Arabic (Direct Proxy)',
      title: `${matchTitle} (Direct IPTV)`,
      url: `http://live.daddylive.stream/hls/${sourceId}/index.m3u8`,
      behaviorHints: { notWebReady: true },
      resolution: 'HD'
    }));

    // Fallback to web players
    streams.push(new StreamEntity({
      name: 'Yalla Shoot (Arabic)',
      title: `${matchTitle} (Web Player)`,
      externalUrl: targetUrl,
      resolution: 'HD'
    }));

    return streams;
  }
}

module.exports = BeinArabicProvider;

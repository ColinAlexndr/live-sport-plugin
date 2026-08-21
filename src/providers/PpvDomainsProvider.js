const BaseProvider = require('./BaseProvider');
const MatchEntity = require('../domain/MatchEntity');
const StreamEntity = require('../domain/StreamEntity');
const { extract } = require('../services/EmbedExtractorChain');

const PPV_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

class PpvDomainsProvider extends BaseProvider {
  constructor(opts) {
    super(opts);
    this.name = 'PpvDomains';
    this.browserSnifferService = opts.browserSnifferService;
    this.apiUrl = 'https://api.ppv.st/api/streams';
    // Wrap the fetch with our circuit breaker
    this.fetchData = this.circuitBreaker.wrap(`${this.name}_fetch`, async () => {
      const container = require('../container');
      try {
        const sniffer = container.resolve('browserSniffer');
        const jsonStr = await sniffer.fetchThroughBrowser(this.apiUrl, 'https://ppv.st/');
        return JSON.parse(jsonStr);
      } catch (err) {
        console.warn(`[PpvDomains] BrowserSniffer failed, falling back to node fetch...`);
        const headers = { 'User-Agent': PPV_UA };
        const res = await fetch(this.apiUrl, { headers, signal: AbortSignal.timeout(7000) });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
      }
    });

    this._fetchEmbed = this.circuitBreaker.wrap(`${this.name}_fetchEmbed`, async (url) => {
      const container = require('../container');
      const sniffer = container.resolve('browserSniffer');
      return await sniffer.fetchThroughBrowser(url, new URL(url).origin + '/');
    });
  }

  async getMatches() {
    const matches = [];
    try {
      const data = await this.fetchData.fire();
      if (!data || !data.streams || !data.success) return [];

      data.streams.forEach(categoryObj => {
        const categoryName = this.normalizeCategory(categoryObj.category);
        
        if (Array.isArray(categoryObj.streams)) {
          categoryObj.streams.forEach(s => {
            if (s.id === null || s.id === undefined) return;
            const id = String(s.id);
            // Ppv returns teams in the name usually e.g. "Team A vs. Team B"
            let team1 = null, team2 = null;
            if (s.name && s.name.includes(' vs. ')) {
               const parts = s.name.split(' vs. ');
               team1 = parts[0].trim();
               team2 = parts[1].trim();
            }

            const isEmbedSt = s.iframe && s.iframe.includes('embed');

            matches.push(new MatchEntity({
              id: 'ppv_' + id,
              title: s.name,
              category: categoryName,
              date: s.starts_at ? (s.starts_at * 1000).toString() : null,
              popular: (parseInt(s.viewers || '0') > 100) ? '1' : '0',
              league: s.tag || categoryName,
              team1: team1,
              team2: team2,
              thumbnail_url: s.poster,
              sources: [{ 
                source: isEmbedSt ? 'embedst' : 'ppvdomains', 
                id: id, 
                iframe: s.iframe,
                embedUrl: s.iframe
              }]
            }));
          });
        }
      });
    } catch (error) {
      console.error(`[${this.name}] Error fetching matches:`, error.message);
    }
    return matches;
  }

  async resolveStream(sourceId, matchCategory, matchTitle, extraData) {
    const streams = [];
    try {
      if (!extraData || !extraData.iframe) return [];
      
      const watchUrl = extraData.iframe;

      // CF Worker edge-scraper removed per user request

      // ─── Attempt direct M3U8 extraction from the embed page ────────────
      if (streams.length === 0) {
        try {
          const html = await this._fetchEmbed.fire(watchUrl);
          let resultUrl = null;
          let resultPattern = null;
          
          const result = extract(html);
          if (result && result.url) {
            resultUrl = result.url;
            resultPattern = result.pattern;
          } else {
            console.log(`[${this.name}] 🟡 Static extraction failed for ${watchUrl}, falling back to Playwright Sniffer...`);
            const sniffer = this.browserSnifferService;
            const embedOrigin = new URL(watchUrl).origin;
            const sniffedUrl = await sniffer.sniff(watchUrl, { referer: embedOrigin + '/' });
            if (sniffedUrl) {
              resultUrl = sniffedUrl;
              resultPattern = 'Browser Sniffer';
            }
          }

          if (resultUrl) {
            const embedOrigin = new URL(watchUrl).origin;
            console.log(`[${this.name}] ⚡ Direct extraction succeeded via ${resultPattern} for: ${matchTitle}`);
            
            let finalUrl = resultUrl;
            if (resultPattern === 'Browser Sniffer') {
               finalUrl = `/api/playwright-m3u8?url=${encodeURIComponent(resultUrl)}&referer=${encodeURIComponent(embedOrigin + '/')}`;
            } else {
               finalUrl = this.getStreamProxyUrl(resultUrl, embedOrigin + '/', embedOrigin);
            }
            
            streams.push(new StreamEntity({
              name: 'PPV Domains',
              title: `[Direct] Watch natively`,
              url: finalUrl,
              resolution: 'HD',
              behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                  request: {
                    'User-Agent': PPV_UA,
                    'Referer': embedOrigin + '/',
                    'Origin': embedOrigin,
                  },
                },
              },
            }));
          }
        } catch (err) {
          console.warn(`[${this.name}] Direct extraction failed for ${sourceId}: ${err.message}`);
        }
      }

      // ─── Web player fallback (always appended) ──────────────────────────
      streams.push(new StreamEntity({
        name: 'PPV Domains',
        title: `Watch via Web Browser (PPV)`,
        externalUrl: watchUrl
      }));
      
    } catch (error) {
      console.error(`[${this.name}] resolveStream failed for ${sourceId}:`, error.message);
    }
    return streams;
  }
}

module.exports = PpvDomainsProvider;

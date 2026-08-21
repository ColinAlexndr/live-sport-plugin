const BaseProvider = require('./BaseProvider');
const MatchEntity = require('../domain/MatchEntity');
const StreamEntity = require('../domain/StreamEntity');
const { BASE_URL } = require('../config');
const { extract } = require('../services/EmbedExtractorChain');

const BINTV_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

class BinTvProvider extends BaseProvider {
  constructor(opts) {
    super(opts);
    this.name = 'BinTv';
    this.browserSniffer = opts.browserSniffer;
    this.mainUrl = 'https://api.ppv.st/api/streams';
    
    this.fetchMain = this.circuitBreaker.wrap(`${this.name}_fetchMain`, async () => {
      // Use Playwright to bypass Cloudflare block on api.ppv.st
      const browser = await this.browserSniffer._ensureBrowser();
      const page = await browser.newPage();
      try {
        await page.goto(this.mainUrl);
        const data = await page.evaluate(() => JSON.parse(document.body.innerText));
        return data;
      } finally {
        await page.close().catch(()=>{});
      }
    });

    // Circuit-breaker-wrapped embed HTML fetcher for extraction attempts
    this._fetchEmbed = this.circuitBreaker.wrap(`${this.name}_fetchEmbed`, async (url) => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': BINTV_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': new URL(url).origin + '/',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
  }

  async getMatches() {
    const matches = [];
    try {
      const data = await this.fetchMain.fire();
      if (data && Array.isArray(data.streams)) {
        data.streams.forEach(categoryObj => {
          if (Array.isArray(categoryObj.streams)) {
            categoryObj.streams.forEach((s) => {
              const title = s.name || `Event ${s.id}`;
              const sources = [];
              if (s.iframe) {
                sources.push({ source: 'bintv', id: s.uri_name || s.id.toString(), url: s.iframe });
              }
              if (Array.isArray(s.substreams)) {
                s.substreams.forEach(sub => {
                  if (sub.iframe) {
                    sources.push({ source: 'bintv', id: sub.uri_name || sub.id.toString(), url: sub.iframe });
                  }
                });
              }
              if (sources.length > 0) {
                let cat = s.category_name || categoryObj.category || 'other';
                matches.push(new MatchEntity({
                  id: `bintv_${s.id}`,
                  title: title,
                  category: this.normalizeCategory(cat),
                  date: s.starts_at ? (s.starts_at * 1000).toString() : Date.now().toString(),
                  popular: '0',
                  sources: sources,
                  thumbnail_url: s.poster || ''
                }));
              }
            });
          }
        });
      }
    } catch (e) {
      console.error(`[${this.name}] Error fetching PPV JSON:`, e.message);
    }
    return matches;
  }

  async resolveStream(sourceId, matchCategory, matchTitle) {
    const streams = [];
    console.log(`[BinTvDebug] resolveStream called! sourceId=${sourceId}, matchCategory=${matchCategory}, matchTitle=${matchTitle}`);
    try {
      const matches = await this.getMatches();
      const match = matches.find(m => m.id === `bintv_${sourceId}` || m.sources.some(s => s.id === sourceId));
      let watchUrl = '';
      
      if (match) {
        const src = match.sources.find(s => s.id === sourceId);
        if (src && src.url) watchUrl = src.url;
      }
      
      if (watchUrl) {
        // ─── Attempt direct M3U8 extraction from the embed page ────────────
        // If the embed URL is from embedindia.st / embed.st family, try to
        // extract the hidden .m3u8 stream URL from the page source.
        // On success → return as a native direct stream (plays in ExoPlayer).
        // On failure → fall through to the existing web player fallback.
        try {
          const html = await this._fetchEmbed.fire(watchUrl);
          const result = extract(html);
          if (result && result.url) {
            const embedOrigin = new URL(watchUrl).origin;
            console.log(`[${this.name}] ⚡ Direct extraction succeeded via ${result.pattern} for: ${matchTitle}`);
            streams.push(new StreamEntity({
              name: 'BinTV',
              title: `[Direct] BinTV (${sourceId.split('/').pop()})`,
              url: result.url,
              resolution: 'HD',
              behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                  request: {
                    'User-Agent': BINTV_UA,
                    'Referer': embedOrigin + '/',
                    'Origin': embedOrigin,
                  },
                },
              },
            }));
          }
        } catch (err) {
          // Extraction failed (CF block, timeout, etc.) — fall through to browser sniffer
          console.warn(`[${this.name}] Direct extraction failed for ${sourceId}: ${err.message}`);
        }

        // ─── Tier 2: Headless browser sniffer (for WASM-obfuscated embeds) ──
        // If static extraction didn't find anything, use Playwright to load the
        // page and intercept the .m3u8 request that the WASM/JS player makes.
        if (streams.length === 0 && this.browserSniffer) {
          try {
            const embedOrigin = new URL(watchUrl).origin;
            const sniffedUrl = await this.browserSniffer.sniff(watchUrl, {
              timeout: 15000,
              referer: embedOrigin + '/',
            });
            if (sniffedUrl) {
              // Working Playwright Proxy Stream (bypasses TLS/WAF checks)
              streams.push(new StreamEntity({
                name: 'BinTV',
                title: `[Live] BinTV (${sourceId.split('/').pop()})`,
                url: `/api/playwright-m3u8?url=${encodeURIComponent(sniffedUrl)}&referer=${encodeURIComponent(embedOrigin + '/')}`,
                resolution: 'HD'
              }));
            }
          } catch (sniffErr) {
            console.warn(`[${this.name}] Browser sniffer failed for ${sourceId}: ${sniffErr.message}`);
          }
        }

        // ─── Web player fallback (always appended) ──────────────────────────
        streams.push(new StreamEntity({
          name: `Nuvio Web Player`,
          title: `BinTV (${sourceId.split('/').pop()})`,
          externalUrl: `/watch?url=${encodeURIComponent(watchUrl)}&title=${encodeURIComponent(matchTitle || 'Live Event')}`
        }));
      }
    } catch (err) {
      console.error(`[${this.name}] resolveStream failed for ${sourceId}:`, err.message);
    }
    return streams;
  }
}

module.exports = BinTvProvider;

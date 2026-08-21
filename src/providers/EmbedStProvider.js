const BaseProvider = require('./BaseProvider');
const StreamEntity = require('../domain/StreamEntity');
const { execFile } = require('child_process');
const path = require('path');

class EmbedStProvider extends BaseProvider {
  constructor(opts) {
    super(opts);
    this.name = 'EmbedSt';
    this.browserSnifferService = opts.browserSnifferService;
  }

  async getMatches() {
    return [];
  }

  async resolveStream(sourceId, matchCategory, matchTitle, src = {}) {
    const streams = [];

    const embedUrl = src.embedUrl || sourceId;
    if (!embedUrl || !embedUrl.startsWith('http')) {
      console.warn(`[${this.name}] Invalid embed URL: ${embedUrl}`);
      return streams;
    }

    let referer = src.referer;
    if (!referer) {
      try {
        referer = new URL(embedUrl).origin + '/';
      } catch (err) {
        referer = 'https://embed.st/';
      }
    }

    // CF Worker edge-scraper removed per user request

    // ─── Tier 1: Native WASM decryption ─────────────────────────────────────
    if (streams.length === 0) {
      try {
        // Parse the user, event, id from the URL: https://embed.st/embed/admin/ppv-celtic-vs-lask-linz/1
        const parts = embedUrl.split('/');
        const user  = parts[parts.length - 3];
        const event = parts[parts.length - 2];
        const id    = parts[parts.length - 1];

        if (user && event && id) {
          console.log(`[${this.name}] Decrypting native WASM for ${user}/${event}/${id}...`);

          const m3u8Url = await new Promise((resolve) => {
            // Using process.cwd() ensures the path works both in dev (src/) and after ncc build (dist/)
            const scriptPath = path.join(process.cwd(), 'scripts', 'run_wasm.js');
            execFile('node', [scriptPath, user, event, id, embedUrl], { timeout: 15000 }, (error, stdout) => {
              if (error) {
                console.error(`[${this.name}] Native WASM execution failed:`, error.message);
                return resolve(null);
              }
              const urlMatch = stdout.match(/https:\/\/[^\s"]+\.m3u8/);
              resolve(urlMatch ? urlMatch[0] : null);
            });
          });

          if (m3u8Url) {
            console.log(`[${this.name}] Natively decrypted M3U8 for ${matchTitle}: ${m3u8Url}`);
            const proxyUrl = this.getStreamProxyUrl(m3u8Url, referer, new URL(referer).origin);
            streams.push(new StreamEntity({
              name: 'EmbedSt',
              title: `[Direct] ${matchTitle}`,
              url: proxyUrl,
              behaviorHints: { notWebReady: true },
              resolution: 'HD',
            }));
          } else {
            console.warn(`[${this.name}] Native decryption failed to extract M3U8 for ${embedUrl}`);
          }
        }
      } catch (err) {
        console.warn(`[${this.name}] Decryptor error for ${embedUrl}: ${err.message}`);
      }
    }

    // ─── Tier 2: Playwright Sniffer ─────────────────────────────────────────
    if (streams.length === 0) {
      console.log(`[${this.name}] 🟡 Native decryption failed for ${embedUrl}, falling back to Playwright Sniffer...`);
      try {
        const sniffer = this.browserSnifferService;
        if (!sniffer) throw new Error('BrowserSnifferService not injected');
        const sniffedUrl = await sniffer.sniff(embedUrl, { referer });
        if (sniffedUrl) {
          console.log(`[${this.name}] ⚡ Sniffer extraction succeeded for: ${matchTitle}`);
          const proxyUrl = `/api/playwright-m3u8?url=${encodeURIComponent(sniffedUrl)}&referer=${encodeURIComponent(referer)}`;
          streams.push(new StreamEntity({
            name: 'EmbedSt',
            title: `[Direct] ${matchTitle}`,
            url: proxyUrl,
            behaviorHints: {
              notWebReady: true
            },
            resolution: 'HD',
          }));
        }
      } catch (err) {
        console.warn(`[${this.name}] Playwright sniffer failed for ${embedUrl}:`, err.message);
      }
    }

    // ─── Tier 3: Raw embed fallback — always appended ────────────────────────
    streams.push(new StreamEntity({
      name: 'EmbedSt',
      title: `${matchTitle} (Web Player)`,
      externalUrl: `/watch?url=${encodeURIComponent(embedUrl)}&title=${encodeURIComponent(matchTitle || 'Live Event')}`,
    }));

    return streams;
  }
}

module.exports = EmbedStProvider;

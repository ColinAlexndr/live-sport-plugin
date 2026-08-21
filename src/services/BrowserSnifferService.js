/**
 * BrowserSnifferService.js
 *
 * Headless-browser stream sniffer for WASM-obfuscated embed players (embed.st).
 *
 * Uses a shared Playwright Chromium instance with lightweight per-request
 * browser contexts to intercept the real .m3u8 playlist URL that the player's
 * WASM/JS fetches at runtime — something static HTML scraping cannot do.
 *
 * Architecture:
 *  - Lazy init: Chromium only launches on the first sniff() call
 *  - Shared browser: one process, many isolated contexts (low RAM)
 *  - Resource blocking: images/CSS/fonts are aborted for speed
 *  - Semaphore: max N concurrent sniffs to prevent OOM
 *  - Crash recovery: auto-relaunch on browser disconnect
 *  - LOW_MEMORY_MODE: skips browser entirely, returns null
 */

const LOW_MEMORY = process.env.LOW_MEMORY_MODE === 'true';
const MAX_CONCURRENT = parseInt(process.env.SNIFFER_CONCURRENCY || '3', 10);
const DEFAULT_TIMEOUT = 15_000;

// Only block heavy non-executable media/visual assets
const BLOCKED_TYPES = new Set(['image', 'font']);

class BrowserSnifferService {
  constructor() {
    this._browser = null;
    this._launching = null;
    this._activeCount = 0;
    this._queue = [];
    this._disabled = false; // Set true if Chromium binary is missing — avoids repeated failed launches
  }

  // ── Lazy browser launch ──────────────────────────────────────────────
  async _ensureBrowser() {
    // Hard-disabled (e.g. missing binary detected on first attempt)
    if (this._disabled) throw new Error('BrowserSniffer disabled — Chromium not available');

    // Already running and connected
    if (this._browser && this._browser.isConnected()) return this._browser;

    // Another call is already launching — wait for it
    if (this._launching) return this._launching;

    this._launching = (async () => {
      try {
        const { chromium } = require('playwright');
        console.log('[BrowserSniffer] 🚀 Launching headless Chromium...');
        if (!this._browser) {
          // Use headful Chromium positioned completely off-screen.
          // The bot protection on embedindia.st successfully detects ALL headless profiles,
          // but this approach bypasses it perfectly without bothering the user.
          this._browser = await chromium.launch({
            headless: false,
            args: [
              '--window-position=-32000,-32000',
              '--disable-blink-features=AutomationControlled',
              '--no-sandbox',
              '--disable-web-security',
            ]
          });
          
          console.log('[BrowserSniffer] 🟢 Chromium launched in stealth headful mode.');
        }

        // Auto-cleanup on unexpected disconnect
        this._browser.on('disconnected', () => {
          console.warn('[BrowserSniffer] ⚠️ Browser disconnected — will relaunch on next sniff');
          this._browser = null;
        });

        console.log('[BrowserSniffer] ✅ Chromium ready');
        return this._browser;
      } catch (err) {
        this._browser = null;

        // Chromium binary missing — disable permanently, no point retrying
        if (err.message && (err.message.includes('Executable') || err.message.includes('ENOENT') || err.message.includes('not found'))) {
          this._disabled = true;
          console.warn('[BrowserSniffer] ⚠️ Chromium binary not found — sniffer disabled. Streams will fall back to web player.');
        } else {
          console.error('[BrowserSniffer] ❌ Failed to launch Chromium:', err.message);
        }
        throw err;
      } finally {
        this._launching = null;
      }
    })();

    return this._launching;
  }

  // ── Semaphore — limit concurrent browser pages ───────────────────────
  _acquireSlot() {
    if (this._activeCount < MAX_CONCURRENT) {
      this._activeCount++;
      return Promise.resolve();
    }
    return new Promise(resolve => this._queue.push(resolve));
  }

  _releaseSlot() {
    this._activeCount--;
    if (this._queue.length > 0) {
      this._activeCount++;
      const next = this._queue.shift();
      next();
    }
  }

  // ── Main API ─────────────────────────────────────────────────────────
  /**
   * Navigate to an embed URL in a headless browser and intercept the
   * .m3u8 playlist request that the WASM/JS player makes.
   *
   * @param {string} embedUrl  The embed page URL (e.g. https://embed.st/...)
   * @param {object} [opts]
   * @param {number} [opts.timeout=15000]  Max ms to wait for the .m3u8 request
   * @param {string} [opts.referer='']     Referer header for the navigation
   * @returns {Promise<string|null>}  The captured .m3u8 URL, or null on failure
   */
  async sniff(embedUrl, { timeout = DEFAULT_TIMEOUT, referer = '' } = {}) {
    // Bail immediately in low-memory mode
    if (LOW_MEMORY) return null;

    await this._acquireSlot();

    let context = null;
    let page = null;

    try {
      const browser = await this._ensureBrowser();
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true,
      });
      page = await context.newPage();
      
      // EVASION: Bypass headless detection used by WASM players
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // Strip HeadlessChrome from userAgentData
        if (navigator.userAgentData) {
          Object.defineProperty(navigator.userAgentData, 'brands', {
            get: () => [
              { brand: 'Not A;Brand', version: '99' },
              { brand: 'Google Chrome', version: '127' },
              { brand: 'Chromium', version: '127' }
            ]
          });
        }
      });

      // Block heavy resources — we only need the network calls
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (BLOCKED_TYPES.has(type)) {
          return route.abort();
        }
        return route.continue();
      });

      // Set up the m3u8 interception promise
      const m3u8Promise = new Promise((resolve) => {
        page.on('request', (req) => {
          const url = req.url();
          if (url.includes('playlist.m3u8') || url.includes('.m3u8')) {
            // Filter out blob: URLs and data: URLs
            if (url.startsWith('http')) {
              resolve(url);
            }
          }
        });
      });

      // Race: navigation + interception vs timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sniff timeout')), timeout);
      });

      // Infer referer if not provided
      let effectiveReferer = referer;
      if (!effectiveReferer) {
        try {
          const origin = new URL(embedUrl).origin;
          effectiveReferer = origin.includes('embed.st') ? 'https://ppv.st/' : origin + '/';
        } catch (_) {}
      }

      console.log(`[BrowserSniffer] 🔍 Sniffing: ${embedUrl} (referer: ${effectiveReferer || 'none'})`);

      await page.goto(embedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: timeout,
        referer: effectiveReferer || undefined,
      }).catch(() => {
        // Navigation might "fail" due to weird redirects — that's okay,
        // we only care about the network request
      });

      // Try to click play if there is an overlay
      try {
        await page.click('body', { timeout: 1000, force: true });
      } catch (e) {
        // ignore
      }

      const capturedUrl = await Promise.race([m3u8Promise, timeoutPromise]);

      console.log(`[BrowserSniffer] 🔥 Captured: ${capturedUrl}`);
      
      // Stop video playback to save bandwidth, but keep page alive for Turnstile
      try {
        await page.evaluate(() => {
          document.querySelectorAll('video').forEach(v => {
            v.pause();
            v.removeAttribute('src');
            v.load();
          });
        });
      } catch (e) {}

      // Cache the cleared page so proxy can reuse Turnstile cookies
      if (!this._proxyPages) this._proxyPages = {};
      const origin = new URL(embedUrl).origin;
      const refererOrigin = effectiveReferer ? new URL(effectiveReferer).origin : origin;
      
      const oldPage = this._proxyPages[origin];
      if (oldPage && oldPage !== page) {
         try { await oldPage.close().catch(()=>{}); } catch(e){}
         if (oldPage.context() !== this._proxyContext) {
             try { await oldPage.context().close().catch(()=>{}); } catch(e){}
         }
         // Remove all keys pointing to the old page
         for (const key in this._proxyPages) {
           if (this._proxyPages[key] === oldPage) delete this._proxyPages[key];
         }
      }
      this._proxyPages[origin] = page;
      if (origin !== refererOrigin) {
        this._proxyPages[refererOrigin] = page;
      }
      // Do not close page or context; they are cached!
      page = null;
      context = null;

      return capturedUrl;

    } catch (err) {
      if (err.message === 'Sniff timeout') {
        console.warn(`[BrowserSniffer] ⏱️ Timeout after ${timeout}ms for: ${embedUrl}`);
      } else {
        console.error(`[BrowserSniffer] ❌ Sniff failed for ${embedUrl}:`, err.message);
      }
      return null;

    } finally {
      // Cleanup only if page wasn't cached (i.e. on error)
      try { if (page) await page.close().catch(() => {}); } catch (_) {}
      try { if (context) await context.close().catch(() => {}); } catch (_) {}
      this._releaseSlot();
    }
  }

  async _getProxyPage(referer) {
    if (!this._proxyPages) this._proxyPages = {};
    const origin = referer ? new URL(referer).origin : 'about:blank';
    
    if (this._proxyPages[origin] && !this._proxyPages[origin].isClosed()) return this._proxyPages[origin];

    const browser = await this._ensureBrowser();
    if (!this._proxyContext) {
      this._proxyContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      });
    }
    
    const page = await this._proxyContext.newPage();
    await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
    await page.goto(origin, { timeout: 10000, waitUntil: 'commit' }).catch(()=>{});
    this._proxyPages[origin] = page;
    return page;
  }

  // ── Fetch content via Playwright (Bypass WAF) ────────────────────────
  async fetchThroughBrowser(targetUrl, referer, isArrayBuffer = false) {
    if (LOW_MEMORY || this._disabled) throw new Error('BrowserSniffer disabled');
    
    const page = await this._getProxyPage(referer);

    if (isArrayBuffer) {
      const base64Str = await page.evaluate(async ({ tUrl }) => {
        const res = await fetch(tUrl, { cache: 'no-store' });
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      }, { tUrl: targetUrl });
      return Buffer.from(base64Str, 'base64');
    } else {
      return await page.evaluate(async ({ tUrl }) => {
        const res = await fetch(tUrl, { cache: 'no-store' });
        return await res.text();
      }, { tUrl: targetUrl });
    }
  }

  async streamThroughBrowser(targetUrl, referer, expressRes) {
    const page = await this._getProxyPage(referer);
    
    // Ensure we have exposed the stream function on this page
    if (!page._isStreamExposed) {
      page._streamCallbacks = new Map();
      await page.exposeFunction('_nodeStreamChunk', (reqId, b64Data) => {
        const cb = page._streamCallbacks.get(reqId);
        if (cb) cb(b64Data);
      });
      page._isStreamExposed = true;
    }

    const reqId = Math.random().toString(36).substring(7);
    
    // Setup the callback for Node to write to Express
    page._streamCallbacks.set(reqId, (b64Data) => {
      if (b64Data === 'DONE') {
        expressRes.end();
        page._streamCallbacks.delete(reqId);
      } else {
        expressRes.write(Buffer.from(b64Data, 'base64'));
      }
    });

    // Start streaming from the browser
    page.evaluate(async ({ tUrl, reqId }) => {
      try {
        const res = await fetch(tUrl, { cache: 'no-store' });
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert chunk to base64
          const chunkSize = 8192;
          let binary = '';
          for (let i = 0; i < value.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, value.subarray(i, i + chunkSize));
          }
          await window._nodeStreamChunk(reqId, btoa(binary));
        }
        await window._nodeStreamChunk(reqId, 'DONE');
      } catch (e) {
        await window._nodeStreamChunk(reqId, 'DONE');
      }
    }, { tUrl: targetUrl, reqId }).catch(() => {
       expressRes.end();
       page._streamCallbacks.delete(reqId);
    });
  }

  // ── Graceful shutdown ────────────────────────────────────────────────
  async shutdown() {
    if (this._browser) {
      console.log('[BrowserSniffer] 🛑 Shutting down Chromium...');
      try {
        await this._browser.close();
      } catch (_) {}
      this._browser = null;
    }
  }
}

module.exports = BrowserSnifferService;

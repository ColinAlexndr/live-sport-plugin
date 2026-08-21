const nock = require('nock');
const StreamFreeProvider = require('../src/providers/StreamFreeProvider');
const EmbedIndiaProvider = require('../src/providers/EmbedIndiaProvider');
const EmbedStProvider    = require('../src/providers/EmbedStProvider');
const PpvDomainsProvider = require('../src/providers/PpvDomainsProvider');
const CircuitBreakerService = require('../src/services/CircuitBreakerService');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeCb() {
  return new CircuitBreakerService();
}

/** Minimal BrowserSnifferService stub that always returns null (no Playwright in tests) */
const noopSniffer = {
  sniff: async () => null,
  fetchThroughBrowser: async () => JSON.stringify({ streams: [], success: false })
};

// NODE_ENV=test → getCfProxyUrl() returns null → CF Tier 0 is skipped automatically.

// ---------------------------------------------------------------------------
// StreamFreeProvider — existing suite (unchanged)
// ---------------------------------------------------------------------------
describe('StreamFreeProvider', () => {
  let provider;

  beforeEach(() => {
    nock.cleanAll();
    provider = new StreamFreeProvider({ circuitBreaker: makeCb() });
  });

  test('getMatches() handles valid JSON correctly', async () => {
    nock('https://streamfree.top')
      .get('/streams')
      .reply(200, {
        streams: {
          football: [
            {
              id: 'man_utd_vs_arsenal',
              name: 'Manchester United vs Arsenal',
              match_timestamp: 1700000000,
              viewers: 500,
              league: 'Premier League',
              team1: { name: 'Man Utd' },
              team2: { name: 'Arsenal' }
            }
          ]
        }
      });

    const matches = await provider.getMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('sf_man_utd_vs_arsenal');
    expect(matches[0].title).toBe('Manchester United vs Arsenal');
    expect(matches[0].category).toBe('football');
    expect(matches[0].popular).toBe('1'); // viewers > 100
  });

  test('getMatches() handles empty/malformed responses without crashing', async () => {
    nock('https://streamfree.top').get('/streams').reply(500, 'Internal Server Error');
    const matches = await provider.getMatches();
    expect(matches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// EmbedIndiaProvider
// ---------------------------------------------------------------------------
describe('EmbedIndiaProvider', () => {
  let provider;

  beforeEach(() => {
    nock.cleanAll();
    provider = new EmbedIndiaProvider({
      circuitBreaker: makeCb(),
      browserSnifferService: noopSniffer
    });
  });

  test('resolveStream() returns web-player fallback when server-side extraction finds nothing', async () => {
    // CF proxy disabled in test env. Server-side returns boring HTML.
    nock('https://embedtest.st')
      .get('/embed/123')
      .reply(200, '<html><body>No stream here</body></html>');

    const embedUrl = 'https://embedtest.st/embed/123';
    const streams = await provider.resolveStream(
      embedUrl, 'football', 'Test Match',
      { embedUrl, referer: 'https://embedtest.st/' }
    );

    expect(streams.length).toBeGreaterThanOrEqual(1);
    const webPlayer = streams.find(s => s.externalUrl && s.externalUrl.includes('/watch'));
    expect(webPlayer).toBeDefined();
  });

  test('resolveStream() extracts plain-text m3u8 from page HTML via server-side', async () => {
    const m3u8 = 'https://cdn.example.com/live/stream.m3u8';

    nock('https://embedtest.st')
      .get('/embed/456')
      .reply(200, `<html><script>var url = "${m3u8}";</script></html>`);

    const embedUrl = 'https://embedtest.st/embed/456';
    const streams = await provider.resolveStream(
      embedUrl, 'cricket', 'IPL Match',
      { embedUrl, referer: 'https://embedtest.st/' }
    );

    const direct = streams.find(s => s.url && s.url.includes('.m3u8'));
    expect(direct).toBeDefined();
  });

  test('resolveStream() skips server-side for CF_PROTECTED_DOMAINS and falls to /watch tiers', async () => {
    // embedindia.st is in CF_PROTECTED_DOMAINS — server side is bypassed entirely
    const embedUrl = 'https://embedindia.st/embed/789';
    const streams = await provider.resolveStream(
      embedUrl, 'football', 'Protected Match',
      { embedUrl, referer: 'https://embedindia.st/' }
    );

    // Playwright sniffer returns null → Tier 2 (/watch?mode=extract) or Tier 3 (/watch?url)
    const hasWatchFallback = streams.some(s => s.externalUrl && s.externalUrl.includes('/watch'));
    expect(hasWatchFallback).toBe(true);
  });

  test('resolveStream() rejects invalid embed URLs gracefully', async () => {
    const streams = await provider.resolveStream('not-a-url', 'football', 'Broken', {});
    expect(streams).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// EmbedStProvider
// ---------------------------------------------------------------------------
describe('EmbedStProvider', () => {
  let provider;

  beforeEach(() => {
    nock.cleanAll();
    provider = new EmbedStProvider({
      circuitBreaker: makeCb(),
      browserSnifferService: noopSniffer
    });
  });

  test('resolveStream() returns Tier 3 web-player when WASM + Playwright both fail', async () => {
    const embedUrl = 'https://embed.st/embed/admin/test-event/1';
    const streams = await provider.resolveStream(
      embedUrl, 'football', 'Test Event',
      { embedUrl, referer: 'https://embed.st/' }
    );

    // WASM script absent in test env, sniffer is noop → Tier 3 always appended
    const webPlayer = streams.find(s => s.externalUrl && s.externalUrl.includes('/watch'));
    expect(webPlayer).toBeDefined();
    expect(webPlayer.externalUrl).toContain(encodeURIComponent(embedUrl));
  });

  test('resolveStream() always returns at least one stream even on bad URL', async () => {
    const streams = await provider.resolveStream(
      'https://embed.st/embed/a/b/c', 'basketball', 'NBA Game',
      { embedUrl: 'https://embed.st/embed/a/b/c', referer: 'https://embed.st/' }
    );
    expect(streams.length).toBeGreaterThanOrEqual(1);
    expect(streams.some(s => s.externalUrl)).toBe(true);
  });

  test('resolveStream() returns empty array when embedUrl is invalid', async () => {
    const streams = await provider.resolveStream('invalid', 'football', 'Bad', {});
    expect(streams).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// PpvDomainsProvider
// ---------------------------------------------------------------------------
describe('PpvDomainsProvider', () => {
  let provider;

  beforeEach(() => {
    nock.cleanAll();
    provider = new PpvDomainsProvider({
      circuitBreaker: makeCb(),
      browserSnifferService: noopSniffer
    });
    // Stub _fetchEmbed to avoid real Playwright calls in tests
    provider._fetchEmbed = { fire: async () => '<html><body>no stream</body></html>' };
  });

  test('resolveStream() returns empty array when no iframe data provided', async () => {
    const streams = await provider.resolveStream('42', 'football', 'PPV Match', {});
    expect(streams).toHaveLength(0);
  });

  test('resolveStream() always appends web-player fallback when iframe is present', async () => {
    const iframeUrl = 'https://embed.st/embed/admin/ppv-test/1';
    const streams = await provider.resolveStream(
      '42', 'football', 'PPV Match', { iframe: iframeUrl }
    );
    const webPlayer = streams.find(s => s.externalUrl === iframeUrl);
    expect(webPlayer).toBeDefined();
  });

  test('resolveStream() extracts plain m3u8 via server-side when embed page contains one', async () => {
    const m3u8 = 'https://stream.example.com/live.m3u8';
    provider._fetchEmbed = {
      fire: async () => `<html><script>var file = "${m3u8}";</script></html>`
    };

    const streams = await provider.resolveStream(
      '99', 'football', 'Direct Test',
      { iframe: 'https://ppv.st/watch/99' }
    );

    const direct = streams.find(s => s.url && s.url.includes('.m3u8'));
    expect(direct).toBeDefined();
    // The web player fallback is always appended too
    const webPlayer = streams.find(s => s.externalUrl === 'https://ppv.st/watch/99');
    expect(webPlayer).toBeDefined();
  });
});

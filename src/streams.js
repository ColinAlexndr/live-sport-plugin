const container = require('./container');
const { BASE_URL } = require('./config');

// --- Constants ----------------------------------------------------------------

const SOURCE_PRIORITY = {
  admin: 1, echo: 1, golf: 1, delta: 1,
  watchfooty: 2, cdnlive: 3, streamsports99: 4, streamic: 5, ppvdomains: 6,
  streamfree: 7, timstreams: 8, bintv: 9, ntv: 10, sportyhunter: 11,
  streamsports: 12, 'iptv-org': 13
};

// Known third-party fallback providers that can be toggled via config.
// Direct Streamed.pk sources (admin, echo, golf, delta) are NOT here --
// they are always allowed through as highest-priority direct m3u8 streams.
const KNOWN_FALLBACKS = new Set([
  'watchfooty', 'cdnlive', 'streamsports99', 'streamic', 'ppvdomains',
  'streamfree', 'timstreams', 'bintv', 'ntv', 'sportyhunter', 'streamsports', 'iptv-org'
]);

const SPORT_ICONS = {
  football: 'soccer', cricket: 'cricket', motorsport: 'motorsport',
  basketball: 'basketball', american_football: 'american_football', rugby: 'rugby', networks: 'networks'
};

const SPORT_EMOJIS = {
  football: String.fromCodePoint(0x26BD),
  cricket: String.fromCodePoint(0x1F3CF),
  motorsport: String.fromCodePoint(0x1F3CE, 0xFE0F),
  basketball: String.fromCodePoint(0x1F3C0),
  american_football: String.fromCodePoint(0x1F3C8),
  rugby: String.fromCodePoint(0x1F3C9),
  networks: String.fromCodePoint(0x1F4FA)
};

const NICE_NAMES = {
  streamfree: 'StreamFree', timstreams: 'TimStreams', bintv: 'BinTV',
  ntv: 'NTV', sportyhunter: 'SportyHunter', streamsports: 'StreamSports',
  'iptv-org': 'Direct IPTV', streamsports99: 'StreamSports99',
  ppvdomains: 'PPV Domains', streamic: 'Streamic',
  watchfooty: 'WatchFooty', cdnlive: 'CDNLiveTV'
};

const PROVIDER_TIMEOUT_MS = 8000;

// --- Shared Private Helpers ---------------------------------------------------

function _setupStream(type, id, config) {
  if (type !== 'tv' || !id.startsWith('nuvio_sport_')) return null;

  const matchId = id.replace('nuvio_sport_', '');
  const matches = container.resolve('cacheService').getMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match || !match.sources || match.sources.length === 0) return null;

  const sortedSources = [...match.sources].sort((a, b) => {
    const getPriority = (src) => SOURCE_PRIORITY[src] != null ? SOURCE_PRIORITY[src] : (KNOWN_FALLBACKS.has(src) ? 99 : 1.5);
    const pa = getPriority(a.source), pb = getPriority(b.source);
    if (pa !== pb) return pa - pb;
    if (a.source === 'bintv' && b.source === 'bintv') {
      const isDirect = (s) => s.url && s.url.includes('.m3u8');
      if (isDirect(a) && !isDirect(b)) return -1;
      if (!isDirect(a) && isDirect(b)) return 1;
    }
    return 0;
  });

  let activeSources = sortedSources;
  if (config && config.sources && config.sources !== 'none') {
    const enabled = new Set(config.sources.split(','));
    activeSources = sortedSources.filter(src =>
      src.source.startsWith('yaml_') ||
      !KNOWN_FALLBACKS.has(src.source) ||
      enabled.has(src.source)
    );
  }

  return { match, matchId, activeSources };
}

async function _resolveSourceStreams(src, match) {
  const sourceName = src.source;

  const resolve = async () => {
    if (sourceName === 'streamfree') {
      const provider = container.resolve('streamFreeProvider');
      const sfCategory = src.original_category || match.category;
      const streams = await provider.resolveStream(src.id, sfCategory, match.title);
      for (const s of streams) {
        if (s.url && s.url.startsWith('/api/hls')) s.url = BASE_URL + s.url;
      }
      return streams;
    }
    if (sourceName === 'timstreams')     return container.resolve('timStreamsProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'bintv')          return container.resolve('binTvProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'ntv')            return container.resolve('ntvProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'sportyhunter')   return container.resolve('sportyHunterProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'streamsports')   return container.resolve('streamSportsProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'watchfooty')     return container.resolve('watchFootyProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'cdnlive')        return container.resolve('cdnLiveProvider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'streamsports99') return container.resolve('streamSports99Provider').resolveStream(src.id, match.category, match.title);
    if (sourceName === 'streamic')       return container.resolve('streamicProvider').resolveStream(src.id, match.category, match.title, src);
    if (sourceName === 'ppvdomains')     return container.resolve('ppvDomainsProvider').resolveStream(src.id, match.category, match.title, src);
    if (sourceName === 'iptv-org') {
      return [{ name: 'Nuvio Direct', title: '24/7 TV (' + (src.quality || 'Auto') + ')', url: src.url, resolution: src.quality }];
    }
    // Direct source (admin/echo/golf/delta/etc.)
    if (src.url) {
      return [{ name: 'Nuvio Direct', title: src.channel || src.id || 'Direct Stream', url: src.url, resolution: src.quality || 'HD' }];
    }
    return [];
  };

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('[streams] ' + sourceName + ' timed out')), PROVIDER_TIMEOUT_MS)
  );

  return Promise.race([resolve(), timeout]);
}

function _applyStreamFormatting(s, match, matchId) {
  const icon = SPORT_EMOJIS[match.category] || String.fromCodePoint(0x1F4E1);

  let quality = s.resolution || s.quality || 'Auto';
  if (quality.includes('x')) quality = quality.split('x')[1] + 'p';

  const isWeb = !!s.externalUrl || s.name === 'Nuvio Web Player';

  let providerName = NICE_NAMES[s._source] ||
    NICE_NAMES[Object.keys(NICE_NAMES).find(k => (s.title || '').toLowerCase().includes(k))] ||
    'Streamed.pk';

  const titleLc = (s.title || '').toLowerCase();
  if (titleLc.includes('timstreams'))      providerName = 'TimStreams';
  else if (titleLc.includes('bintv'))      providerName = 'BinTV';
  else if (titleLc.includes('ntv'))        providerName = 'NTV';
  else if (titleLc.includes('sporty'))     providerName = 'SportyHunter';
  else if (titleLc.includes('streamfree')) providerName = 'StreamFree';
  else if (titleLc.includes('watchfooty')) providerName = 'WatchFooty';
  else if (titleLc.includes('cdnlive'))    providerName = 'CDNLiveTV';
  else if (titleLc.includes('streamsports99')) providerName = 'StreamSports99';
  else if (titleLc.includes('ppv domains'))    providerName = 'PPV Domains';
  else if (titleLc.includes('streamic'))       providerName = 'Streamic';
  else if (titleLc.includes('24/7'))           providerName = 'Direct IPTV';

  let channelName = '';
  const originalTitle = s.title || '';
  if (originalTitle) {
    const m = originalTitle.match(/\(([^)]+)\)/);
    if (m && m[1]) {
      const inner = m[1];
      if (!inner.match(/^[0-9]{3,4}p$/i) && inner !== 'Auto' && !inner.toLowerCase().startsWith('stream')) {
        channelName = inner;
      }
    } else if (!originalTitle.includes('Stream') && !originalTitle.includes('Auto')) {
      channelName = originalTitle;
    }
  }

  s.name = isWeb ? String.fromCodePoint(0x1F310) + ' Web Stream' : String.fromCodePoint(0x26A1) + ' Direct Stream';

  if (channelName) {
    channelName = channelName.split(/[ _-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
  }

  const channelDisplay = channelName ? ' | ' + String.fromCodePoint(0x1F4FA) + ' ' + channelName : '';
  s.title = icon + ' ' + providerName + channelDisplay + '\n' + String.fromCodePoint(0x2699, 0xFE0F) + ' Quality: ' + quality;

  s.behaviorHints = s.behaviorHints || {};
  s.behaviorHints.bingeGroup = 'nuvio_sport_' + matchId;

  if (s.url && s.url.includes('.m3u8') && !s.url.includes('/api/hls')) {
    s.behaviorHints.notWebReady = true;
    if (providerName === 'Streamed.pk') {
      s.behaviorHints.proxyHeaders = { request: { 'Referer': 'https://embed.st/', 'Origin': 'https://embed.st' } };
    }
  }

  if (providerName === 'Direct IPTV' && s.url) {
    s.title = String.fromCodePoint(0x1F4FA) + ' ' + (channelName || '24/7 Live Network') + '\n' + String.fromCodePoint(0x2699, 0xFE0F) + ' Quality: ' + quality;
  }
}

function _streamSort(a, b) {
  const aD = a.name && a.name.includes('Direct Stream') ? 1 : 0;
  const bD = b.name && b.name.includes('Direct Stream') ? 1 : 0;
  if (aD !== bD) return bD - aD;
  return (b.score || 0) - (a.score || 0);
}

async function _injectCricket(accumulated, match, matchId, config, streamScorer) {
  const enabled = !config || !config.sources || config.sources === 'none' || config.sources.split(',').includes('streamfree');
  if (match.category !== 'cricket' || !enabled) return false;

  const sfProvider = container.resolve('streamFreeProvider');
  let added = false;
  for (const ch of [{ id: 'willow', title: 'Willow TV' }, { id: 'skycricket', title: 'Sky Sports Cricket' }]) {
    try {
      const resolved = await sfProvider.resolveStream(ch.id, 'cricket', ch.title);
      for (const s of resolved) {
        if (s.url && s.url.startsWith('/api/hls')) s.url = BASE_URL + s.url;
        s.score = streamScorer.calculateScore(s, 'streamfree');
        s._source = 'streamfree';
        _applyStreamFormatting(s, match, matchId);
        accumulated.push(s);
        added = true;
      }
    } catch (e) {
      console.warn('[streams.js] Error injecting 24/7 cricket channels:', e.message);
    }
  }
  return added;
}

// --- Public API ---------------------------------------------------------------

/**
 * Standard (batch) stream handler -- waits for all providers, then returns.
 * Used by the Stremio SDK defineStreamHandler.
 */
async function handleStream(type, id, config) {
  const setup = _setupStream(type, id, config);
  if (!setup) return { streams: [] };

  const { match, matchId, activeSources } = setup;
  const streamScorer = container.resolve('streamScorer');
  const streams = [];

  const results = await Promise.allSettled(activeSources.map(async (src) => {
    try {
      const newStreams = await _resolveSourceStreams(src, match);
      for (const s of newStreams) {
        s.score = streamScorer.calculateScore(s, src.source);
        s._source = src.source;
      }
      return newStreams;
    } catch (e) {
      console.warn('[streams.js] Error resolving ' + src.source + ' for ' + src.id + ':', e.message);
      return [];
    }
  }));

  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) streams.push(...r.value);
  }

  await _injectCricket(streams, match, matchId, config, streamScorer);
  streams.forEach(s => _applyStreamFormatting(s, match, matchId));
  streams.sort(_streamSort);

  return { streams, cacheMaxAge: 0, staleRevalidate: 0, staleError: 0 };
}

/**
 * Progressive stream handler.
 *
 * Resolves all sources in parallel. As each provider returns streams,
 * onBatch(formattedStreams) is called with the FULL accumulated sorted list
 * of all streams found so far. This lets the HTTP layer stream partial
 * results to Nuvio one-by-one as they arrive, using NDJSON chunked encoding.
 *
 * @param {string}   type    - resource type ('tv')
 * @param {string}   id      - stream ID ('nuvio_sport_xyz')
 * @param {object}   config  - addon config
 * @param {function} onBatch - async (streams[]) => void, called on each new arrival
 */
async function handleStreamProgressive(type, id, config, onBatch) {
  const setup = _setupStream(type, id, config);
  if (!setup) { await onBatch([]); return; }

  const { match, matchId, activeSources } = setup;
  const streamScorer = container.resolve('streamScorer');
  const accumulated = [];

  await Promise.allSettled(activeSources.map(async (src) => {
    try {
      const newStreams = await _resolveSourceStreams(src, match);
      let gotNew = false;
      for (const s of newStreams) {
        s.score = streamScorer.calculateScore(s, src.source);
        s._source = src.source;
        _applyStreamFormatting(s, match, matchId);
        accumulated.push(s);
        gotNew = true;
      }
      if (gotNew) {
        await onBatch([...accumulated].sort(_streamSort));
      }
    } catch (e) {
      console.warn('[streams.js] Error resolving ' + src.source + ':', e.message);
    }
  }));

  // Inject 24/7 cricket channels after all main providers have resolved
  const cricketAdded = await _injectCricket(accumulated, match, matchId, config, streamScorer);
  if (cricketAdded) {
    await onBatch([...accumulated].sort(_streamSort));
  }
}

module.exports = { handleStream, handleStreamProgressive };

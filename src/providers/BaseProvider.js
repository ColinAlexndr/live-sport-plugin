class BaseProvider {
  constructor({ circuitBreaker }) {
    this.circuitBreaker = circuitBreaker;
    this.name = 'BaseProvider';
  }

  /**
   * Fetch matches from the provider.
   * Should return an array of MatchEntity objects.
   */
  async getMatches() {
    throw new Error('getMatches() must be implemented by subclasses');
  }

  /**
   * Resolve a specific stream source.
   * Should return an array of StreamEntity objects.
   */
  async resolveStream(sourceId, matchCategory, matchTitle) {
    return [];
  }

  /**
   * Helper to normalize category strings across all providers
   */
  normalizeCategory(cat) {
    if (!cat) return 'other';
    cat = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cat.includes('americanfootball') || cat.includes('nfl') || cat.includes('afl') || cat.includes('gridiron')) return 'american_football';
    if (cat.includes('soccer') || cat.includes('football')) return 'football';
    if (cat.includes('motor') || cat.includes('racing') || cat.includes('cycling')) return 'motorsport';
    if (cat.includes('fight') || cat.includes('mma') || cat.includes('boxing') || cat.includes('wrestling') || cat.includes('knuckle') || cat.includes('ufc')) return 'mma';
    if (cat.includes('liveshow') || cat.includes('uncategorized')) return 'other';
    if (cat.includes('rugby')) return 'rugby';
    return cat;
  }

  /**
   * Fetch wrapper that routes through Cloudflare proxy if configured
   */
  async proxyFetch(url, options = {}) {
    const cfProxyUrl = process.env.CF_PROXY_URL;
    if (cfProxyUrl) {
      const proxyUrl = new URL(cfProxyUrl);
      proxyUrl.searchParams.set('url', url);
      
      if (options.headers) {
        let referer, origin;
        if (options.headers instanceof Headers) {
          referer = options.headers.get('referer') || options.headers.get('Referer');
          origin = options.headers.get('origin') || options.headers.get('Origin');
        } else {
          referer = options.headers.referer || options.headers.Referer;
          origin = options.headers.origin || options.headers.Origin;
        }
        
        if (referer) proxyUrl.searchParams.set('referer', referer);
        if (origin) proxyUrl.searchParams.set('origin', origin);
      }
      
      url = proxyUrl.toString();
    }
    
    return fetch(url, options);
  }

  /**
   * Get the proxy URL for a stream
   */
  getStreamProxyUrl(streamUrl, referer, origin) {
    const cfProxyUrl = process.env.CF_PROXY_URL;
    if (cfProxyUrl) {
      const proxyUrl = new URL(cfProxyUrl);
      proxyUrl.searchParams.set('url', streamUrl);
      if (referer) proxyUrl.searchParams.set('referer', referer);
      if (origin) proxyUrl.searchParams.set('origin', origin);
      // Append .m3u8 to the end of the URL so mobile players recognize it as an HLS stream
      return proxyUrl.toString() + '&ext=.m3u8';
    }
    
    // Fallback to internal relay
    let internalProxy = `/api/hls/${encodeURIComponent(streamUrl)}/stream.m3u8`;
    const q = new URLSearchParams();
    q.set('url', streamUrl);
    if (referer) q.set('referer', referer);
    if (origin) q.set('embedOrigin', origin);
    return `/api/hls/playlist.m3u8?${q.toString()}`;
  }

  /**
   * Helper to normalize strings for fuzzy matching
   */
  normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

module.exports = BaseProvider;

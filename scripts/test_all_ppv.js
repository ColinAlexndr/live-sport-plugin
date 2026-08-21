const awilix = require('awilix');
const PpvDomainsProvider = require('../src/providers/PpvDomainsProvider');
const BrowserSnifferService = require('../src/services/BrowserSnifferService');
const CircuitBreakerService = require('../src/services/CircuitBreakerService');

async function testAllPpv() {
  console.log('=== Initializing PPV Test Suite ===');
  const container = awilix.createContainer();
  
  container.register({
    browserSnifferService: awilix.asClass(BrowserSnifferService).singleton(),
    circuitBreaker: awilix.asValue(new CircuitBreakerService()),
    ppvDomainsProvider: awilix.asClass(PpvDomainsProvider).singleton(),
  });

  const ppvDomains = container.resolve('ppvDomainsProvider');
  console.log('Fetching all PPV matches...');
  const matches = await ppvDomains.getMatches();
  console.log(`Found ${matches.length} matches.\n`);

  const results = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    console.log(`[${i + 1}/${matches.length}] Testing match: "${match.title}" (Category: ${match.category})`);
    
    const matchResult = {
      title: match.title,
      category: match.category,
      league: match.league,
      sources: []
    };

    for (const source of match.sources) {
      console.log(`  -> Source: ${source.source} | Iframe: ${source.iframe.slice(0, 70)}...`);
      const startTime = Date.now();
      try {
        const streams = await ppvDomains.resolveStream(
          source.id,
          match.category,
          match.title,
          { iframe: source.iframe, embedUrl: source.embedUrl }
        );

        const directStream = streams.find(s => s.url && s.url.includes('.m3u8'));
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (directStream) {
          console.log(`  ✅ Converted successfully (${elapsed}s): ${directStream.url.slice(0, 80)}...`);
          matchResult.sources.push({
            iframe: source.iframe,
            converted: true,
            elapsed: `${elapsed}s`,
            streamUrl: directStream.url,
            proxyHeaders: directStream.behaviorHints?.proxyHeaders || null
          });
        } else {
          console.log(`  ❌ Failed to convert to direct m3u8 (${elapsed}s). Fallbacks returned: ${streams.length}`);
          matchResult.sources.push({
            iframe: source.iframe,
            converted: false,
            elapsed: `${elapsed}s`,
            streamUrl: null,
            fallbackCount: streams.length
          });
        }
      } catch (err) {
        console.log(`  ❌ Error during extraction: ${err.message}`);
        matchResult.sources.push({
          iframe: source.iframe,
          converted: false,
          error: err.message
        });
      }
    }
    results.push(matchResult);
    console.log('--------------------------------------------------');
  }

  console.log('\n================ SUMMARY ================');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

testAllPpv().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

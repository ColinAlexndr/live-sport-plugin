const awilix = require('awilix');
const EmbedIndiaProvider = require('../src/providers/EmbedIndiaProvider');
const EmbedStProvider = require('../src/providers/EmbedStProvider');
const PpvDomainsProvider = require('../src/providers/PpvDomainsProvider');
const BrowserSnifferService = require('../src/services/BrowserSnifferService');
const CircuitBreakerService = require('../src/services/CircuitBreakerService');

async function runTests() {
  console.log('--- Setting up Nuvio Container for Testing ---');
  const container = awilix.createContainer();
  
  // Register dependencies
  container.register({
    browserSnifferService: awilix.asClass(BrowserSnifferService).singleton(),
    circuitBreaker: awilix.asValue(new CircuitBreakerService()),
    embedIndiaProvider: awilix.asClass(EmbedIndiaProvider).singleton(),
    embedStProvider: awilix.asClass(EmbedStProvider).singleton(),
    ppvDomainsProvider: awilix.asClass(PpvDomainsProvider).singleton(),
  });

  const embedIndia = container.resolve('embedIndiaProvider');
  const embedSt = container.resolve('embedStProvider');
  const ppvDomains = container.resolve('ppvDomainsProvider');

  console.log('\n=======================================');
  console.log('Testing EmbedIndia (Requires Playwright bypass)');
  console.log('=======================================');
  const indiaStreams = await embedIndia.resolveStream(
    'https://embedindia.st/embed/admin/skysports-main-event/1', 
    'Test Category', 
    'EmbedIndia Test Match'
  );
  console.log(JSON.stringify(indiaStreams, null, 2));

  console.log('\n=======================================');
  console.log('Testing Embed.st (Should use fast WASM script)');
  console.log('=======================================');
  const stStreams = await embedSt.resolveStream(
    'https://embed.st/embed/admin/skysports-main-event/1',
    'Test Category',
    'EmbedSt Test Match'
  );
  console.log(JSON.stringify(stStreams, null, 2));
    console.log('\n=======================================');
    console.log('Testing PPV Domains (Fallback sniffing)');
    console.log('=======================================');
    
    // Dynamically get a PPV match
    const ppvMatches = await ppvDomains.getMatches();
    if (ppvMatches.length > 0 && ppvMatches[0].sources.length > 0) {
      const firstMatch = ppvMatches[0];
      const source = firstMatch.sources[0];
      
      console.log(`Testing PPV Match: ${firstMatch.title} -> ${source.iframe}`);
      const ppvStreams = await ppvDomains.resolveStream(
        source.id,
        firstMatch.category,
        firstMatch.title,
        { iframe: source.iframe, embedUrl: source.embedUrl }
      );
      console.log(JSON.stringify(ppvStreams, null, 2));
    } else {
      console.log('No PPV matches found to test.');
    }

  console.log('\n--- Test Complete ---');
  process.exit(0);
}

runTests().catch(console.error);

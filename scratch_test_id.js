const fs = require('fs');
const path = require('path');
const CircuitBreaker = { wrap: (name, fn) => ({ fire: fn }) }; // Mock circuit breaker

async function testID(id) {
  console.log(`Testing ID: ${id} across all providers...`);
  
  const providersDir = path.join(__dirname, 'src', 'providers');
  const files = fs.readdirSync(providersDir).filter(f => f.endsWith('Provider.js') && f !== 'BaseProvider.js');
  
  for (const file of files) {
    try {
      const ProviderClass = require(path.join(providersDir, file));
      const provider = new ProviderClass({ circuitBreaker: CircuitBreaker });
      
      const streams = await provider.resolveStream(id, 'football', 'Test Match');
      if (streams && streams.length > 0) {
        console.log(`\n=== ${provider.name} FOUND STREAMS ===`);
        console.log(`Found ${streams.length} streams:`);
        console.log(JSON.stringify(streams, null, 2));
      } else {
        console.log(`[${provider.name}] No streams found.`);
      }
    } catch (e) {
      console.log(`[${file}] Error: ${e.message}`);
    }
  }
}

testID('52639');

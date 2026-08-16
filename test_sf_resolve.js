const container = require('./src/container');

async function test() {
  const provider = container.resolve('streamFreeProvider');
  console.log('Resolving...');
  const streams = await provider.resolveStream('como-vs-liverpool', 'soccer', 'Como vs Liverpool');
  console.log('Result:', JSON.stringify(streams, null, 2));
}

test();

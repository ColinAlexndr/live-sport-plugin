const B = require('./src/providers/BinTvProvider.js');
class TestB extends B { constructor(){super({circuitBreaker:{wrap:(n,f)=>({fire:f})}}) } }
const b = new TestB();
const orig = b.extractDirectUrl;
b.extractDirectUrl = async function(url) {
  const origVm = require('vm');
  const origRun = origVm.runInContext;
  origVm.runInContext = function(code, ctx) {
    if (code.includes('globalThis.window = globalThis')) {
      code = code + \
        const proxyHandler = {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'Symbol(Symbol.toPrimitive)' && prop !== 'then') {
              console.log('ACCESS:', prop);
            }
            return Reflect.get(target, prop);
          }
        };
        globalThis.document = new Proxy(globalThis.document, proxyHandler);
        globalThis.navigator = new Proxy(globalThis.navigator, proxyHandler);
      \;
    }
    return origRun(code, ctx);
  };
  return orig.call(this, url);
};
b.extractDirectUrl('https://embedindia.st/embed/f1/2026/netherlands/sprint-q/sky-sport-f1-de').catch(e => console.log('CAUGHT:', e.message));

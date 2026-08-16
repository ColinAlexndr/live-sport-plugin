const vm = require('vm');
const B = require('./src/providers/BinTvProvider.js');
const b = new (class extends B { constructor(){super({circuitBreaker:{wrap:(n,f)=>({fire:f})}}) } });
const orig = b.extractDirectUrl;
b.extractDirectUrl = async function(url) {
  const origVm = require('vm');
  const origRun = origVm.runInContext;
  origVm.runInContext = function(code, ctx) {
    if (code.includes('globalThis.window = globalThis')) {
      code += \
        globalThis.ProxyWindow = new Proxy(globalThis, {
          set: (target, prop, value) => {
            console.log('SET GLOBAL:', prop);
            target[prop] = value;
            return true;
          },
          get: (target, prop) => {
            if (typeof prop === 'string' && prop !== 'console' && prop !== 'Math' && prop !== 'Date') {
              // console.log('GET GLOBAL:', prop);
            }
            return target[prop];
          }
        });
      \;
    }
    return origRun(code, ctx);
  };
  return orig.call(this, url);
};
b.extractDirectUrl('https://embedindia.st/embed/f1/2026/netherlands/sprint-q/sky-sport-f1-de').catch(e => console.log('CAUGHT:', e.message));

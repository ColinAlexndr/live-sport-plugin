const B = require('./src/providers/BinTvProvider.js');
class TestB extends B {
  constructor() { super({ circuitBreaker: { wrap: (n,f) => ({fire:f}) } }); }
}
const b = new TestB();
const orig = b.loadWasmDependencies;
b.loadWasmDependencies = async function(url) {
  const res = await orig.call(this, url);
  res.jsCode = \
    globalThis.origFunction = globalThis.Function;
    globalThis.Function = function(...args) {
      if (args.length > 0 && typeof args[args.length-1] === 'string') {
        console.log('FUNCTION CALLED, len:', args[args.length-1].length);
        if (args[args.length-1].length > 100000) {
          require('fs').writeFileSync('dyn_func.js', args[args.length-1]);
        }
      }
      return origFunction(...args);
    };
  \ + res.jsCode;
  return res;
};
b.extractDirectUrl('https://embedindia.st/embed/f1/2026/netherlands/sprint-q/sky-sport-f1-de').catch(e => console.log('CAUGHT:', e.message));

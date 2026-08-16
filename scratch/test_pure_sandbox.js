const fs = require('fs');
const vm = require('vm');

function decodeGid(gid) {
  return new Promise((resolve, reject) => {
    const bundleStr = fs.readFileSync('scratch/bundle-jw.js', 'utf8');
    const startPattern = 'Function("IE0cdO",';
    const start = bundleStr.indexOf(startPattern);
    const end = bundleStr.indexOf('")({', start) + 2; 
    const functionCreationCode = bundleStr.substring(start, end);
    
    function createMock(name, obj = {}) {
      return new Proxy(obj, {
        get(target, prop) {
          if (prop === 'then') return undefined; // Promise check
          if (prop === 'toJSON') return undefined;
          if (prop === 'setup') return function(cfg) { resolve(cfg); return this; };
          
          if (!(prop in target)) {
            if (typeof prop === 'string' && prop !== 'sandDetect') {
              console.log(`[GET MISSING] ${name}.${prop}`);
              const fn = function() { return createMock(name + '.' + prop + '()'); };
              Object.setPrototypeOf(fn, createMock(name + '.' + prop));
              return fn;
            }
          }
          const val = target[prop];
          if (typeof val === 'object' && val !== null && !val.__isProxy) {
            val.__isProxy = true;
            return createMock(name + '.' + prop, val);
          }
          return val;
        },
        set(target, prop, value) {
          console.log(`[SET] ${name}.${String(prop)} = ${typeof value}`);
          target[prop] = value;
          return true;
        }
      });
    }

    const _mockWindow = {
      location: {
        hash: '',
        search: '?gid=' + encodeURIComponent(gid),
        href: 'https://embedindia.st/embed/247-south-park?gid=' + encodeURIComponent(gid),
        protocol: 'https:',
        host: 'embedindia.st',
        hostname: 'embedindia.st'
      },
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      atob: (s) => Buffer.from(s, 'base64').toString('binary'),
      btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
      jwplayer: function() {
        return {
          setup: function(config) { resolve(config); },
          on: function() { return this; }
        };
      },
      aclib: { runPop: () => {} },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      console: console,
      eval: eval,
      Function: Function,
      Object: Object,
      Array: Array,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Math: Math,
      Date: Date,
      RegExp: RegExp,
      JSON: JSON,
      Promise: Promise,
      Error: Error,
      fetch: (url, opts) => {
        console.log("FETCH CALLED:", url);
        return new Promise(() => {}); // hang fetch for now to test
      }
    };
    
    const mockWindow = createMock('window', _mockWindow);
    mockWindow.window = mockWindow;
    mockWindow.self = mockWindow;
    mockWindow.top = mockWindow;
    mockWindow.global = mockWindow;
    mockWindow.globalThis = mockWindow;
    mockWindow.parent = mockWindow;
    
    mockWindow.document = createMock('document', {
      location: mockWindow.location,
      cookie: '',
      referrer: 'https://bfreer.com/',
      documentElement: { style: {} },
      body: { appendChild: ()=>{} },
      createElement: (tag) => {
        const el = { style: {} };
        if (tag === 'iframe') el.contentWindow = createMock('iframe.contentWindow', {});
        return createMock('element:'+tag, el);
      },
      getElementById: () => null,
      querySelector: () => null
    });
    
    const arg = {
      get "OzUCyKZ"() { return undefined; },
      get "WOmKX5D"() { return undefined; },
      set "WOmKX5D"(val) { },
      get "bw_JLa"() { return undefined; },
      get "Xxmewl"() { return mockWindow; },
      get "BtQ_KU"() { return 'undefined'; },
      get "cLQNS6Y"() { return 'undefined'; },
      get "q2Iqz1"() { return 'undefined'; }
    };

    mockWindow.arg = arg;

    const context = vm.createContext(mockWindow);
    
    const scriptCode = `
      try {
        const sandboxFn = ${functionCreationCode};
        sandboxFn.call(window, arg);
      } catch (e) {
        console.error("VM Error:", e);
      }
    `;

    vm.runInContext(scriptCode, context);
  });
}

async function main() {
  const gid = "avgcGAFopshjWiBd%2B%2BFJ9wRMZA2YE%2FuzLfaSFSMytFxjZn%2F9AODQuZING8XYoaR8an3p43uketQeY0q%2F8GHUuF4muxIJW0PKUOYP2MvZ2xTDwaAoFZOQEaguqU4VKlup6RI53XAPbLkT7vEyKHQvjyGbNm4NVvcVHaaFvvKChdlv0PxatxjOyW6P81LIxg6ChYwoO%2Bcm9wR5Xqawe%2BbTE1zBX98jeGTY9m640licjCobg%2B2mLn3Ln9QMihoGi0sqS7AZ6fJTaiNLGk5YMC5XLowZ1SNwuLBV8o1fSsfWNPNlJywKlXCR%2BxSmPijgtc94YYeUQDvHZwh20b1ZiA6FLS7FFH4%2F45FLllFIPgE%2BwSJkbwCfre11aGr7XTuF19YWXFzn%2BA65p2MDkQzHUOOhCY%2FqUIQpuZsHrLBc2hm%2BTOJRkHXyKvX8yLah1OR5LA5%2FoAn9Nwq58P9Ucqjfb5bZYuy6jwSszS%2F8tGssGI75C2i8LcuLlpt%2B7kD0aDTAFUsQW6%2B9oCMHPpj8%2FmQ7DG00DARUKEMqc%2FVnK4XTAkjsPXFyCdbj%2B5DeYgQDt%2BY9z1xEsGQKhPTBV5FfABzVaLKrYmAUzaZRc8sURjahtvFu2kCAXHxD8AOYd67DZopQKtWZVrkSk4cebBfDIKnf0QjEgycGFnci8XdIJikcROBBWsOfzglCIZu3KST1wPIlrg0IS5uSoXfGWmLr6Yg94jrWfAmco1VvvilTe2tsDhRllDoFHx7s69xozTHiVsqWLNLkjmyER63NoOUcjopE5OnhASOyFeMEJSmvYQla8mkAStWTHMrJ0ihO%2FWhD3CZ8WFo25XS%2FwS5xcknpCurkPxtAkJJcHS8r0zyXXIpQwz7Gv87MFfrApFo17sPZsKlTw91X1elG1Zy0%2BDyIJRkUuB99JQyJ8%2Bi5hsFi%2B6HDACv%2FxcZfj4IczVO9LGROFqSgfnBWne41VC5brzdCzYwxb2j4STUvLlzjUaIOnXE4OGwo4TTl%2B0tWhufTFx5SMFWPFzcgOwy3reIT%2FXdEQI3qJWy6fi54L1TESWIuuxBD2%2Bg0uAv%2F6lqVIwkucK7IwvkDRP05KvzNuU66yqX7PjpjWTzyQy8SihQJENWJ%2FFCi00KZnVAWzoD4f%2Bwpc5gwqgjs8ttZKEnB0IVDG77Psde1N5xCE%2FlhKGCVwNPtKtXtvotNtKSri6rsuZJWA%2BCwh%2FLy8ztOQkYU3pzBmVNQI90vDm0GHij4NS9XljJ73XqPQ%2FvbHPcAJkAjOGS%2FQEQhHoeXAiRfaLVm1%2B%2BypAQHkb%2BGOiRZfMxcumskLyrm0HR6uIxpYa2QZUvgRmdRSnwkHoJEeFGQdEK7hsjY5TJhV5Kf1DV9tC6YZsfO5XTkk6BLU4L0SirIIwDR1pAjTf093RfNb3tIwwtdctRHT2WlxQPdiLrw1q6H3ox9IjktTQPYhlu0J0LGSB8d8vKFkrLAqqhZuBE0bhKxWBX9DdfqNPgctF1B%2B9dE6sQ6QDzQDTqmveAhS6vY81Bk8CkerT8DhlwB9vIG";
  const decodedGid = decodeURIComponent(gid);
  console.log("Testing with VM sandbox...");
  await decodeGid(decodedGid);
}

main();

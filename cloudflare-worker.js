/**
 * Nuvio Live Sports - Cloudflare Worker Proxy
 * 
 * Instructions:
 * 1. Go to https://dash.cloudflare.com and sign up/log in.
 * 2. Go to "Workers & Pages" -> "Create Application" -> "Create Worker".
 * 3. Name it "nuvio-proxy" (or anything) and deploy.
 * 4. Click "Edit Code", paste this entire script, and click "Deploy".
 * 5. Copy your worker's URL (e.g., https://nuvio-proxy.yourname.workers.dev)
 * 6. Set this URL as the CF_PROXY_URL environment variable in your Nuvio deployment!
 */

export default {
  async fetch(request, env, ctx) {
    const reqUrl = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl) {
      return new Response("Nuvio Cloudflare Proxy is running!", { 
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const referer = reqUrl.searchParams.get('referer');
    const origin = reqUrl.searchParams.get('origin');
    
    // Clone headers from the incoming request
    const newHeaders = new Headers(request.headers);
    if (referer) newHeaders.set('Referer', referer);
    if (origin) newHeaders.set('Origin', origin);
    
    // OVERWRITE User-Agent to ensure scraper and player exactly match for token binding
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');
    
    // Remove headers that shouldn't be forwarded
    newHeaders.delete('Host');
    
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow'
      });
      
      const responseHeaders = new Headers(response.headers);
      
      // Inject permissive CORS headers
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');
      
      const contentType = responseHeaders.get('content-type') || '';
      const isM3u8 = contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || targetUrl.includes('.m3u8');
      
      if (isM3u8 && request.method === 'GET') {
        const text = await response.text();
        const base = new URL(targetUrl);
        
        // Rewrite m3u8 URLs to point back to this worker
        const rewritten = text.split('\n').map(line => {
          const t = line.trim();
          if (!t) return line;
          
          if (t.startsWith('#')) {
            if (!t.includes('URI="')) return line;
            return t.replace(/URI="([^"]+)"/g, (_, uri) => {
              const absUrl = new URL(uri, base).href;
              const q = new URLSearchParams();
              q.set('url', absUrl);
              if (referer) q.set('referer', referer);
              if (origin) q.set('origin', origin);
              return `URI="${reqUrl.origin}/?${q.toString()}"`;
            });
          }
          
          const absUrl = new URL(t, base).href;
          const q = new URLSearchParams();
          q.set('url', absUrl);
          if (referer) q.set('referer', referer);
          if (origin) q.set('origin', origin);
          return `${reqUrl.origin}/?${q.toString()}`;
        }).join('\n');
        
        return new Response(rewritten, {
          status: response.status,
          headers: responseHeaders
        });
      } else if (targetUrl.includes('.key')) {
        responseHeaders.set('Content-Type', 'application/octet-stream');
      } else {
        // Force video/mp2t for chunks (StreamFree hides them as .js which breaks mobile players)
        responseHeaders.set('Content-Type', 'video/mp2t');
      }
      
      // For video chunks (.ts, .js) and everything else, return the stream directly
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
      });

    } catch (err) {
      return new Response(`Proxy Error: ${err.message}`, { 
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};

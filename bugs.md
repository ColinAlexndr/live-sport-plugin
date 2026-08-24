# Bug Report — TimStreams M3U8 Investigation — 2026-08-24

## Summary
- Critical: 0 open, 0 fixed
- Intermediate: 0 open, 1 fixed
- Normal: 0 open, 1 fixed

## 🔴 Critical
*(No critical bugs)*

## 🟡 Intermediate
*(No intermediate bugs)*

## 🟢 Normal
*(No normal bugs)*

## ✅ Resolved

### BUG-001: TimStreams Direct M3U8 Requires Embed Referer Header (404 on Direct Access) — Fixed 2026-08-24
- **File:** `src/providers/TimStreamsProvider.js:189-218`
- **Issue:** Upstream CDN (`volder.timst.cfd`) rejects requests lacking the embed origin's `Referer` header with HTTP 404 Not Found.
- **Fix Applied:** Integrated Cloudflare Worker Edge Proxy via `this.getStreamProxyUrl(m3u8, referer, referer)` into `resolveStream()`. Now generates a fast `[HD]` stream routed through Cloudflare's edge proxy pool with injected `Referer` / `Origin` headers, returning HTTP 200 without using any Render bandwidth. Retained `[Direct]` header-based stream and `[Web]` player as secondary options.

### BUG-002: TimStreams extractM3u8 Uses Direct fetch Instead of proxyFetch — Fixed 2026-08-24
- **File:** `src/providers/TimStreamsProvider.js:108`
- **Issue:** `extractM3u8()` was using standard Node `fetch(embedUrl)` which could trigger Cloudflare/anti-bot blocks when executed from datacenter IPs.
- **Fix Applied:** Updated `extractM3u8()` to use `this.proxyFetch(embedUrl, ...)`, routing all embed scraping through the Cloudflare worker pool.

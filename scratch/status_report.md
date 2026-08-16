# TimStreams Direct Native Streams

Good news! We **already successfully reverse-engineered TimStreams** using exactly the method you asked for. 

We are **NOT** using a headless browser (Puppeteer/Playwright) or any "generic sandbox" for TimStreams. 

Instead, I reverse-engineered the actual obfuscation algorithm TimStreams uses. The embed page hides the `.m3u8` link inside a Javascript array that is decoded using an XOR and subtraction algorithm. I ported this exact decryption logic natively into NodeJS.

We now instantly fetch the embed page, decode the XOR array in milliseconds, extract the raw `https://.../index.m3u8` URL, and pass it directly to Stremio with `behaviorHints.proxyHeaders`, just like Penguplay does!

### Why are you still seeing WebStreams?

Render only runs the compiled `dist/index.js` file. 

If you look at the Git history, there were two back-to-back commits:
1. `421edf2` (feat: extract native m3u8 from TimStreams) - Updated the `src/` files.
2. `86e8dd5` (build: rebuild dist) - Compiled the actual `dist/index.js` that Render runs.

Render most likely started deploying right when the first commit hit, meaning **your server is currently running the older code without the TimStreams fix.**

**Action Required:**
Please go to your Render dashboard and manually click **"Manual Deploy -> Deploy latest commit"** to pull `86e8dd5`. Once it finishes, TimStreams will provide pure, ad-free direct streams!

---

# BinTV Reverse Engineering Status

You asked if we can do something similar for BinTV. I have mapped out exactly how BinTV hides their streams. It is much more advanced than TimStreams, but it is 100% possible to bypass without a browser sandbox.

Here is what I found during the deep-dive:

1. **The Hidden API:** 
   BinTV (`embedindia.st`) does not put the stream link in the HTML. Instead, it sends a hidden `POST` request to `https://embedindia.st/fetch`.
2. **The Static Token:** 
   I discovered that the `indians:` authorization header it uses is completely static and never changes per-user (`c068ae05256b890565d58ff74075384bbc059f4092bfa24679516bf6baed1574`).
3. **Protobuf Payload:** 
   The body of the POST request uses Google Protocol Buffers to send the channel ID (e.g., `247-south-park`).
4. **Rust WebAssembly Decryption:** 
   The server responds with a 180-byte encrypted binary blob. This blob is then decrypted on the client side using a compiled Rust WebAssembly module (`gasm.wasm`) wrapped in a heavily obfuscated JSFuck Virtual Machine (`bundle-jw.js`).

### How we can bypass BinTV without a Sandbox

Since NodeJS natively supports WebAssembly (WASM), we **do not need Playwright or a browser sandbox**. 

In our next steps, we can simply download `gasm.wasm` into the project, send the Protobuf request natively in Node using the static token, and then pipe the encrypted blob directly into the WASM module using `WebAssembly.instantiate()` to instantly extract the final `.m3u8` link.

This approach honors your constraint: it is a true reverse-engineered, instant, and lightweight solution that avoids browser emulation completely.

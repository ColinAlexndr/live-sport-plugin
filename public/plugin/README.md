# Nuvio Plugin Test (embedindia.st)

This folder is a test workspace to experiment with building a native **Nuvio Plugin** (local scraper) for `embedindia.st`.

### How it works:
Unlike the Azure Addon, the JavaScript in `bintv.js` will execute directly on the user's Nuvio app (on their Android TV or phone). 
This means any `fetch()` requests come from the user's home residential IP, automatically bypassing Datacenter WAFs and IP-locked CDNs!

### Your Mission:
The `decryptEmbedIndiaToken()` function in `bintv.js` needs to be filled out. Whoever can reverse-engineer the `bundle-jw.js` / WASM token logic and write it in pure JS will unlock direct playback for BinTV!

const axios = require('axios');
const { URL } = require('url');

async function measureSpeed(url) {
  console.log(`\n🔍 Testing Stream Health for:\n${url}\n`);

  try {
    // 1. Fetch Playlist
    console.log('📡 Fetching manifest (.m3u8)...');
    const startManifest = performance.now();
    
    // We add a random query param to bypass strict CDN caching for the initial manifest test
    const cacheBusterUrl = url.includes('?') ? `${url}&cb=${Date.now()}` : `${url}?cb=${Date.now()}`;
    const manifestRes = await axios.get(cacheBusterUrl, { timeout: 10000 });
    const manifestLatency = performance.now() - startManifest;
    console.log(`   ✅ Manifest loaded in ${manifestLatency.toFixed(2)}ms`);

    let m3u8Content = manifestRes.data;
    let lines = m3u8Content.split('\n');

    // 2. Handle Master Playlists (Redirect to highest quality)
    const streamUrls = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
        // It's a master playlist, get the next line
        let nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('#')) {
          let variantUrl = nextLine.startsWith('http') ? nextLine : new URL(nextLine, url).href;
          console.log(`   ➡️ Detected Master Playlist. Redirecting to variant playlist...`);
          return measureSpeed(variantUrl);
        }
      } else if (lines[i].trim().endsWith('.ts') || (lines[i].trim() && !lines[i].startsWith('#'))) {
        let tsUrl = lines[i].trim();
        // Handle absolute or relative URLs for video segments
        streamUrls.push(tsUrl.startsWith('http') ? tsUrl : new URL(tsUrl, url).href);
      }
    }

    if (streamUrls.length === 0) {
      console.log('❌ No video segments found in the playlist.');
      return;
    }

    console.log(`\n📺 Found ${streamUrls.length} video segments in the playlist. Testing the first 3...\n`);

    const segmentsToTest = streamUrls.slice(0, 3);
    let totalBytes = 0;
    let totalTime = 0;

    for (let i = 0; i < segmentsToTest.length; i++) {
      const segmentUrl = segmentsToTest[i];
      console.log(`   📥 Downloading segment ${i + 1}...`);
      
      const startDownload = performance.now();
      
      const response = await axios.get(segmentUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      const endDownload = performance.now();
      const duration = endDownload - startDownload;
      
      const bytes = response.data.length;
      totalBytes += bytes;
      totalTime += duration;
      
      const mb = bytes / (1024 * 1024);
      const speedMbps = (mb * 8) / (duration / 1000); 

      console.log(`      ✅ Size: ${mb.toFixed(2)} MB | Time: ${duration.toFixed(0)}ms | Speed: ${speedMbps.toFixed(2)} Mbps`);
    }

    // 3. Generate Report
    console.log('\n📊 --- Final Performance Report ---');
    const totalMb = totalBytes / (1024 * 1024);
    const avgSpeedMbps = (totalMb * 8) / (totalTime / 1000);
    
    console.log(`   Total Downloaded : ${totalMb.toFixed(2)} MB`);
    console.log(`   Average Speed    : ${avgSpeedMbps.toFixed(2)} Mbps`);
    console.log(`   Average Latency  : ${(totalTime / segmentsToTest.length).toFixed(0)} ms per segment`);
    console.log('');
    
    if (avgSpeedMbps >= 15) {
      console.log('   🟢 Status: EXCELLENT');
      console.log('      The stream is lightning fast and can easily handle 1080p/4K without buffering.');
    } else if (avgSpeedMbps >= 5) {
      console.log('   🟡 Status: GOOD');
      console.log('      The stream is healthy and should handle 720p/1080p smoothly.');
    } else {
      console.log('   🔴 Status: POOR');
      console.log('      The stream is very slow. Users will likely experience frequent buffering/stuttering.');
    }
    console.log('-----------------------------------\n');

  } catch (error) {
    console.error(`\n❌ Error testing stream: ${error.message}`);
    if (error.response) {
      console.error(`   Server responded with status code: ${error.response.status}`);
    }
  }
}

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.log("\n⚠️  Usage: node scripts/test_speed.js <m3u8_url>\n");
  process.exit(1);
}

measureSpeed(targetUrl);

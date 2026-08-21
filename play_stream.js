const { chromium } = require('playwright');
const fs = require('fs');

const STREAM_URL = "https://lb8.strmd.st/secure/DhdrqtcYFHpDIMjtNEwsaxwKVkaZlIqu/rtmp/stream/bKb6nEceVDLnpv7bUo-GhltBlzKXUXvHPpL4ZlCq1xBKKGM_gN-rdzgoEc_w4S9_rpNfyGCwaTcR4g/1/playlist.m3u8";

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>ENI & LO - Direct Stream Test</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        body { background: black; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
        video { width: 90vw; height: 90vh; }
    </style>
</head>
<body>
    <video id="video" controls autoplay></video>
    <script>
        var video = document.getElementById('video');
        if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource('${STREAM_URL}');
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('player.html', htmlContent);

(async () => {
    // Launch a visible browser with web security disabled to bypass CORS completely
    const browser = await chromium.launch({
        headless: false, 
        args: ['--disable-web-security'] 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Intercept all network requests to inject the required Referer header for the video segments
    await page.route('**/*', (route) => {
        const headers = route.request().headers();
        headers['referer'] = 'https://embed.st/';
        route.continue({ headers });
    });

    console.log("Launching video player on your screen now...");
    await page.goto('file://' + __dirname + '/player.html');
    
    // We leave the browser open so you can watch!
})();

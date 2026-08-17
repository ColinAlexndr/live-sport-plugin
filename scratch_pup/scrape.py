import cloudscraper
import time
import re

scraper = cloudscraper.create_scraper()

watch_url = 'https://ntv.cx/watch/kobra/cracovia-vs-rak-w-cz-stochowa-2490222'
print("Fetching watch page...")
res1 = scraper.get(watch_url)

print("Polling get-watch-streams...")
embed_url = None
for i in range(5):
    res = scraper.get('https://ntv.cx/api/get-watch-streams?server=kobra&match=cracovia-vs-rak-w-cz-stochowa-2490222&source=0', headers={'Referer': watch_url})
    data = res.json()
    print(f"Poll {i+1}:", data)
    if data.get('success') and data.get('embedUrl'):
        embed_url = data['embedUrl']
        break
    time.sleep(3)

if embed_url:
    print("GOT EMBED URL:", embed_url)
    res2 = scraper.get(embed_url, headers={'Referer': 'https://ntv.cx/'})
    html = res2.text
    m3u8 = re.search(r'(https?://[^\'"\s]+\.m3u8[^\'"\s]*)', html)
    if m3u8:
        print("FOUND M3U8:", m3u8.group(1))
    else:
        print("No direct m3u8 found in embed HTML.")
        with open('embed.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved embed.html")
else:
    print("Failed to get embedUrl from API after polling.")

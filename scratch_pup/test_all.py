import cloudscraper
import json
import time

scraper = cloudscraper.create_scraper()

for server in ['kobra', 'raptor', 'falcon', 'phoenix', 'titan', 'viper']:
    print(f"Checking server: {server}")
    try:
        res = scraper.get(f'https://ntv.cx/api/get-matches?server={server}&type=both')
        matches = res.json().get('all', [])
        live_match = next((m for m in matches if m.get('live')), None)
        
        if live_match:
            match_id = live_match['id']
            print(f"Found live match on {server}: {match_id}")
            
            for i in range(3):
                api_url = f'https://ntv.cx/api/get-watch-streams?server={server}&match={match_id}&source=0'
                watch_url = f'https://ntv.cx/watch/{server}/{match_id}'
                
                # Fetch watch page to get cookies
                scraper.get(watch_url)
                
                stream_res = scraper.get(api_url, headers={'Referer': watch_url})
                print(f"  Poll {i+1}:", stream_res.text)
                
                data = stream_res.json()
                if data.get('embedUrl'):
                    print(f"  >>> GOT EMBED URL: {data['embedUrl']}")
                    break
                time.sleep(2)
        else:
            print(f"No live matches on {server}")
    except Exception as e:
        print("Error:", e)
    print("---")

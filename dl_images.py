import urllib.request
import json
import os
import re
import hashlib
import time

with open('js/constellations.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.search(r'\[.*\]', content, re.DOTALL).group(0)
constellations = json.loads(json_str)

success = 0
for c in constellations:
    name = c['name'].replace(' ', '_')
    filepath = f"images/constellations/{c['abbr']}.svg"
    
    if os.path.exists(filepath):
        success += 1
        continue
        
    filename = f"{name}_IAU.svg"
    md5_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()
    url = f"https://upload.wikimedia.org/wikipedia/commons/{md5_hash[0]}/{md5_hash[:2]}/{filename}"
    
    downloaded = False
    retries = 0
    while not downloaded and retries < 5:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Downloaded {filename}")
            downloaded = True
            success += 1
            time.sleep(1.5)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                retries += 1
                wait = 10 * retries
                print(f"Rate limited on {filename}. Waiting {wait} seconds...")
                time.sleep(wait)
            else:
                print(f"HTTP Error {e.code} for {filename}")
                break
        except Exception as e:
            print(f"Error {e}")
            break

print(f"Done. {success}/88 SVG images downloaded.")

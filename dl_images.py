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
    
    # Check if file exists and is actually an SVG (not an HTML error page)
    needs_download = True
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as chk:
            header = chk.read(500).lower()
            if '<svg' in header and '<!doctype html' not in header:
                success += 1
                needs_download = False
    
    if not needs_download:
        continue
        
    filename = f"{name}_IAU.svg"
    md5_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()
    url = f"https://upload.wikimedia.org/wikipedia/commons/{md5_hash[0]}/{md5_hash[:2]}/{filename}"
    
    downloaded = False
    retries = 0
    while not downloaded and retries < 3:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'ConstellationBot/1.1 (https://dsoimage.com; contact@dsoimage.com)'})
            with urllib.request.urlopen(req) as response:
                data = response.read()
                if b'<svg' in data.lower() and b'<!doctype html' not in data.lower():
                    with open(filepath, 'wb') as out_file:
                        out_file.write(data)
                    print(f"Downloaded {filename}")
                    downloaded = True
                    success += 1
                    time.sleep(1.0) # respectful delay for Wikimedia
                else:
                    print(f"Downloaded content for {filename} is not SVG. Retrying...")
                    retries += 1
                    time.sleep(2)
        except urllib.error.HTTPError as e:
            retries += 1
            print(f"HTTP Error {e.code} for {filename}. Retrying...")
            time.sleep(5)
        except Exception as e:
            print(f"Error {e}")
            break

print(f"Done. {success}/88 SVG images valid and downloaded.")

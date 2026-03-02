import urllib.request
import json
import re
import os
import time

# We'll parse the CONSTELLATIONS array from the JS file
js_path = 'js/constellations.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Extract JSON array
match = re.search(r'const CONSTELLATIONS = (\[.*?\]);', js_content, re.DOTALL)
if not match:
    print('Failed to find CONSTELLATIONS array')
    exit()

# Some names have special characters or formatting
# e.g., Boötes -> bootes, Canes Venatici -> canes_venatici
def sanitize_name(name):
    # Convert 'ö' to 'o', lowercase, replace spaces with underscores, remove accents
    name = name.lower()
    name = name.replace('ö', 'o')
    name = name.replace(' ', '_')
    return name

constellations = json.loads(match.group(1))
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

out_dir = 'images/constellations'
if not os.path.exists(out_dir):
    os.makedirs(out_dir)

success_count = 0
failed_list = []

print(f"Starting download of {len(constellations)} stylized maps from TheSkyLive...")

for c in constellations:
    abbr = c['abbr']
    name = c['name']
    
    # Construct filename
    url_name = sanitize_name(name)
    url = f'https://static.theskylive.com/website/sky/constellations/constellation_images/{url_name}.png'
    out_path = os.path.join(out_dir, f'{abbr}.png')
    
    req = urllib.request.Request(url, headers=headers)
    try:
        urllib.request.urlopen(req) # Just test if it exists first
        with urllib.request.urlopen(req) as resp, open(out_path, 'wb') as out_f:
            out_f.write(resp.read())
        print(f"  [+] Downloaded {abbr}.png ({name})")
        success_count += 1
    except Exception as e:
        print(f"  [!] Failed {abbr}.png ({name}) - {url_name}.png not found")
        failed_list.append(name)
    
    time.sleep(0.3)

print(f"\nFinished. Successfully downloaded {success_count}/88 maps.")
if failed_list:
    print("Failed to download:", failed_list)

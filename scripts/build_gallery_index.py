import os
import json
from bs4 import BeautifulSoup

def build_gallery_index():
    pages = ['galaxies.html', 'nebulae.html', 'clusters.html']
    gallery_data = []

    for page in pages:
        if not os.path.exists(page):
            continue
        
        with open(page, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
            
        items = soup.find_all('div', class_='gallery-item')
        for item in items:
            title = item.get('data-title', '')
            aliases = item.get('data-aliases', '')
            full_img = item.get('data-full', '')
            
            img_tag = item.find('img')
            thumb = img_tag.get('src', '') if img_tag else ''
            
            if not full_img:
                full_img = thumb
                
            clean_name = aliases.split(',')[0].strip() if aliases else title.split('(')[0].strip()
            
            gallery_data.append({
                'title': title,
                'aliases': aliases,
                'thumb': thumb,
                'full': full_img,
                'page': page,
                'cleanName': clean_name
            })

    output_path = os.path.join('data', 'gallery.json')
    os.makedirs('data', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(gallery_data, f, indent=2)
        
    print(f"Successfully wrote {len(gallery_data)} items to {output_path}")

if __name__ == '__main__':
    build_gallery_index()

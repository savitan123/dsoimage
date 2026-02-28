import glob
from bs4 import BeautifulSoup
import re

def optimize_html_files():
    html_files = glob.glob("*.html")
    
    for file in html_files:
        if file.endswith('_temp.html'):
            continue
            
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        soup = BeautifulSoup(content, 'html.parser')
        modified = False
        
        # 1. Standardize <title> and <meta name="description">
        head = soup.find('head')
        if head:
            # Canonical URL
            canonical = head.find('link', rel='canonical')
            expected_href = f"https://dsoimage.com/{file}"
            if file == "index.html":
                expected_href = "https://dsoimage.com/"
                
            if canonical:
                if canonical['href'] != expected_href:
                    canonical['href'] = expected_href
                    modified = True
            else:
                new_canonical = soup.new_tag('link', rel='canonical', href=expected_href)
                head.append(new_canonical)
                modified = True
                
            # Meta Description
            meta_desc = head.find('meta', attrs={'name': 'description'})
            
            # Create a base description depending on the page
            page_title = soup.title.string if soup.title else file.replace('.html', '').capitalize()
            base_desc = f"{page_title} - Deep Sky Astrophotography by Shimon Avitan. High-resolution LRGB imaging featuring nebulae, galaxies, and star clusters captured with FLT 132."
            
            if meta_desc:
                # Append keywords if missing
                current_desc = meta_desc.get('content', '')
                if 'Astrophotography' not in current_desc or 'LRGB' not in current_desc or 'FLT 132' not in current_desc:
                    meta_desc['content'] = base_desc
                    modified = True
            else:
                new_meta = soup.new_tag('meta', attrs={'name': 'description', 'content': base_desc})
                head.append(new_meta)
                modified = True

        # 2. Image SEO: Inject Alt Text
        gallery_items = soup.find_all(class_='gallery-item')
        if gallery_items:
            for item in gallery_items:
                title = item.get('data-title', '')
                notes = item.get('data-notes', '')
                
                # Try to extract the telescope or just use a generic good alt
                telescope = "FLT 132" # generic fallback from keywords
                if notes and 'Telescope:' in notes:
                    try:
                        part = notes.split('Telescope:')[1].split('<br>')[0].strip()
                        telescope = part
                    except:
                        pass
                elif notes and 'Scope:' in notes:
                    try:
                        part = notes.split('Scope:')[1].split('<br>')[0].strip()
                        telescope = part
                    except:
                        pass
                
                img = item.find('img')
                if img:
                    current_alt = img.get('alt', '')
                    expected_alt = f"{title} imaged with {telescope} - Deep Sky Astrophotography"
                    
                    if not current_alt or current_alt.strip() == "" or current_alt != expected_alt:
                        img['alt'] = expected_alt
                        modified = True
                        
        if modified:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            print(f"Optimized SEO for: {file}")

if __name__ == "__main__":
    optimize_html_files()

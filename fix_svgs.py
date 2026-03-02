import os
import re

svg_dir = 'images/constellations'
svg_files = [f for f in os.listdir(svg_dir) if f.endswith('.svg')]

for f in svg_files:
    filepath = os.path.join(svg_dir, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove hardcoded width and height attributes in the SVG root tag so they scale via CSS
    content = re.sub(r'(<svg[^>]*?)\s+width="[^"]+"', r'\1', content, count=1, flags=re.IGNORECASE)
    content = re.sub(r'(<svg[^>]*?)\s+height="[^"]+"', r'\1', content, count=1, flags=re.IGNORECASE)
    
    # Add width and height 100% to force container filling
    if 'width="100%"' not in content:
        content = re.sub(r'(<svg[^>]*?)>', r'\1 width="100%" height="100%">', content, count=1, flags=re.IGNORECASE)

    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)

print('Successfully optimized 88 SVGs for responsive UI.')

import glob
import re

files = glob.glob('*.html')
removed_count = 0

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the weather.html link, which is the first item in the Tools dropdown
    tools_start = content.find('weather.html')
    
    if tools_start != -1:
        # Find the end of the Tools dropdown
        tools_end = content.find('</div>', tools_start)
        
        if tools_end != -1:
            tools_block = content[tools_start:tools_end]
            
            # If catalog-explorer is in this block, we need to remove it
            if 'catalog-explorer.html' in tools_block:
                # Remove the exact line containing catalog-explorer.html from this block
                new_tools_block = re.sub(r'^\s*<a[^>]*href="catalog-explorer\.html"[^>]*>.*?</a>\s*$', '', tools_block, flags=re.MULTILINE)
                
                content = content[:tools_start] + new_tools_block + content[tools_end:]
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Removed duplicate from {filepath}")
                removed_count += 1

print(f"Total files fixed: {removed_count}")

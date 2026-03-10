import glob
import re

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if catalog-explorer is in Resources dropdown
    resources_idx = content.find('fa-solid fa-book')
    if resources_idx != -1:
        # Find the next </div> after the dropdown-content starts
        dropdown_idx = content.find('dropdown-content', resources_idx)
        end_idx = content.find('</div>', dropdown_idx)
        
        resources_block = content[dropdown_idx:end_idx]
        
        if 'catalog-explorer.html' not in resources_block:
            # Need to inject before the </div>
            injection = '\n                            <a href="catalog-explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>\n                        '
            content = content[:end_idx] + injection + content[end_idx:]
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print("Injected into", f)

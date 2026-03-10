import glob
import re

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if on-site-photos is in Galleries dropdown
    galleries_idx = content.find('fa-solid fa-images')
    if galleries_idx != -1:
        # Find the next </div> after the dropdown-content starts
        dropdown_idx = content.find('dropdown-content', galleries_idx)
        end_idx = content.find('</div>', dropdown_idx)
        
        galleries_block = content[dropdown_idx:end_idx]
        
        if 'on-site-photos.html' not in galleries_block:
            # Need to inject before the </div>
            injection = '\n                            <a href="on-site-photos.html"><i class="fa-solid fa-camera"></i> On-site photos</a>\n                        '
            content = content[:end_idx] + injection + content[end_idx:]
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print("Injected into", f)

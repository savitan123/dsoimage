import os, re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'script\.js\?v=\d+', 'script.js?v=37', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)

print('Done bumping script.js version to v=37 in all HTML files.')

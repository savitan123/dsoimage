import os, re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=34', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)

print('Done bumping style.css version to v=34 in all HTML files.')

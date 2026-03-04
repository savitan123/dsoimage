import os, re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and 'temp' not in f and 'test' not in f]
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    links = re.findall(r'href=\"([^\"]+)\"', content)
    for link in links:
        if link.startswith('http') or link.startswith('javascript') or link.startswith('#') or link.startswith('mailto'):
            continue
        base_link = link.split('?')[0].split('#')[0]
        if not os.path.exists(base_link) and not base_link.startswith('css/') and not base_link.startswith('js/') and not base_link.startswith('images/'):
            print(f'Warning: Broken link {link} in {file}')
print('Link check complete.')

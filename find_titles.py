import re

with open('js/glossary_data.js', 'r', encoding='utf-8', errors='ignore') as f:
    data = f.read()

titles = re.findall(r'title:\s*"([^"]+)"', data)
for t in titles:
    if 'pass' in t.lower() or 'fwhm' in t.lower() or 'band' in t.lower():
        print(f"FOUND: {t}")

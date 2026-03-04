import os, re

# Read the correct top nav block from index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract from <header class=\"topbar\"> down to </nav>
match = re.search(r'(<!-- Mobile top bar \(only visible on small screens\) -->.*?</nav>)', index_content, re.DOTALL)
if not match:
    # Try another pattern just in case
    match = re.search(r'(<header class=\"topbar\">.*?</nav>)', index_content, re.DOTALL)

if not match:
    print('Could not find top nav in index.html!')
    exit(1)

new_nav = match.group(1)
new_nav = new_nav.replace('class=\"active\" data-i18n=\"menu_home\"', 'data-i18n=\"menu_home\"')
new_nav = new_nav.replace('class=\"active\"', '')

files_to_update = [
    'cluster_temp.html', 'constellation.html', 'constellations-northern.html',
    'constellations-southern.html', 'galaxies_temp.html', 'nebulae_temp.html'
]

files_updated = []
for file in files_to_update:
    if not os.path.exists(file): continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if it has the old sidebar
    old_nav_match = re.search(r'(<header class=\"topbar\">.*?</nav>)', content, re.DOTALL)
    if old_nav_match:
        content = content.replace(old_nav_match.group(1), new_nav)
        
        # Also need to add the <div class=\"overlay\" hidden=\"\" id=\"overlay\"></div> 
        # But wait, index.html new_nav already has it if it's captured in the topbar to nav.
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        files_updated.append(file)

print(f'Done. Updated: {files_updated}')

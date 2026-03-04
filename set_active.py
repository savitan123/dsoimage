import os, re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and 'temp' not in f and 'test' not in f]

# Remove all existing class="active" marks and then add them back precisely
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the top nav links block
    nav_match = re.search(r'(<ul class=\"top-nav-links\".*?</ul>)', content, re.DOTALL)
    if not nav_match: continue
    
    old_ul = nav_match.group(1)
    # Strip any existing active classes
    new_ul = old_ul.replace('class=\"active\"', '')
    new_ul = new_ul.replace('class=\"active ', 'class=\"')
    new_ul = new_ul.replace(' class=\"\"', '')

    # Determine which link should be active based on file name
    active_mapping = {
        'index.html': 'href=\"index.html\"',
        'galaxies.html': 'href=\"galaxies.html\"',
        'nebulae.html': 'href=\"nebulae.html\"',
        'clusters.html': 'href=\"clusters.html\"',
        'equipment.html': 'href=\"equipment.html\"',
        'processing.html': 'href=\"processing.html\"',
        'knowledge.html': 'href=\"knowledge.html\"',
        'weather.html': 'href=\"weather.html\"',
        'planner.html': 'href=\"planner.html\"',
        'tools.html': 'href=\"tools.html\"',
        'about.html': 'href=\"about.html\"',
        'contact.html': 'href=\"contact.html\"'
    }

    # For constellation related pages, we light up Knowledge Base or nothing (since they are sub-pages)
    if file.startswith('constellation'):
        active_str = 'href=\"knowledge.html\"'
    else:
        active_str = active_mapping.get(file, None)
    
    if active_str:
        # Instead of generic replace, add class="active" right before the href
        new_ul = new_ul.replace(f' {active_str}', f' class="active" {active_str}')
        # Also handle cases where there is already a class
        new_ul = new_ul.replace(f'class="active" class="dropbtn" {active_str}', f'class="dropbtn active" {active_str}')

    content = content.replace(old_ul, new_ul)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f'Done setting active links across: {len(html_files)} files.')

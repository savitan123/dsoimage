import os
import glob

def fix_nav():
    files = glob.glob('*.html')
    old_link = '\t\t\t\t\t\t\t<a href="catalog-explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>\n'
    old_link_alt = '<a href="catalog-explorer.html" class="active"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>\n'
    old_link_alt2 = '<a href="catalog-explorer.html" class="active"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>'
    old_link_alt3 = '                            <a href="catalog-explorer.html" class="active"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>\n'

    target = '<a href="knowledge.html"><i class="fa-solid fa-book-open"></i> Knowledge Base</a>'
    
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Remove old links completely from Tools
        content = content.replace(old_link, '')
        content = content.replace(old_link_alt, '')
        content = content.replace(old_link_alt2, '')
        content = content.replace(old_link_alt3, '')
        
        # Add to Resources if not already there
        if 'Catalog Explorer</a>' not in content[content.find(target):content.find(target)+200]:
            if f == 'catalog-explorer.html':
                 new_link = '<a href="catalog-explorer.html" class="active"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>'
            else:
                 new_link = '<a href="catalog-explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>'
            
            content = content.replace(target, target + '\n                            ' + new_link)
            
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
            
if __name__ == '__main__':
    fix_nav()

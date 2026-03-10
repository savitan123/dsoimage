import glob

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    # Find the Tools dropdown block and remove the catalog explorer link from inside it
    tools_start = content.find('Tools ▾')
    if tools_start != -1:
        tools_end = content.find('</ul>', tools_start)
        tools_block = content[tools_start:tools_end]
        
        # Replace the explorer link ONLY within the Tools block
        clean_tools_block = tools_block.replace('<a href="catalog-explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>', '')
        clean_tools_block = clean_tools_block.replace('<a href="catalog-explorer.html" class="active"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>', '')
        
        # remove empty lines
        clean_tools_block = '\n'.join([line for line in clean_tools_block.split('\n') if line.strip() != ''])
        
        content = content[:tools_start] + clean_tools_block + content[tools_end:]
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
        print("Cleaned tools dropdown in", f)

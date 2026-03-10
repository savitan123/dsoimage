import glob

aladin_includes = """
    <!-- Aladin Lite V3 -->
    <link rel="stylesheet" href="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.css" />
    <script src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js" charset="utf-8"></script>
"""

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'aladin.js' not in content:
        # insert before </head>
        content = content.replace('</head>', aladin_includes + '</head>')
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print("Injected Aladin Lite into", f)

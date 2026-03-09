import os

def insert_nav_link():
    html_files = [f for f in os.listdir('.') if f.endswith('.html') and f != 'catalog-explorer.html']
    link_to_insert = '\t\t\t\t\t\t\t<a href="catalog-explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Catalog Explorer</a>\n'
    marker = '<a href="tonights_best.html"><i class="fa-solid fa-star"></i> Tonight\'s Best</a>'

    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        modified = False
        with open(file, 'w', encoding='utf-8') as f:
            for line in lines:
                f.write(line)
                if marker in line and not modified:
                    f.write(link_to_insert)
                    modified = True
                    print(f"Added link to {file}")

if __name__ == "__main__":
    insert_nav_link()

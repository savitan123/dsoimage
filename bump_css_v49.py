import os
import re

def bump_css():
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Bump style.css?v=48 to v=49
        new_content = re.sub(r'style\.css\?v=48', 'style.css?v=49', content)
        
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Bumped CSS version in {file}')

if __name__ == "__main__":
    bump_css()

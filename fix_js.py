import json

with open('js/glossary_data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Only replace backticks if the line contains HTML tags (e.g. <p> or <strong> or <li>)
    # This prevents us from replacing the wrapper backticks
    if '<' in line and '>' in line:
        line = line.replace('', "'")
    new_lines.append(line)

with open('js/glossary_data.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Replaced internal backticks successfully.')

import re

try:
    with open('js/glossary_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for unclosed backticks
    backticks = content.count('`')
    print('Total backticks:', content.count(''))
    if content.count('') % 2 != 0:
        print('Syntax Error: Uneven number of backticks in glossary_data.js!')
        
    # Check for unclosed curly braces
    open_braces = content.count('{')
    close_braces = content.count('}')
    print(open_braces, 'open braces,', close_braces, 'close braces')
    
except Exception as e:
    print('Failed:', e)

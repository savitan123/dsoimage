import re

def main():
    with open('js/glossary_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'(const\s+GLOSSARY_ITEMS\s*=\s*\[)(.*?)(\n\];)', content, re.DOTALL)
    if not match:
        print("Array not found")
        return
    
    prefix = match.group(1)
    array_content = match.group(2)
    suffix = match.group(3)
    
    # Matching each item block accurately
    block_pattern = r'\s*\{\s*title:\s*"(.*?)",\s*category:\s*"(.*?)",\s*content:\s*`(.*?)`\s*\}'
    matches = list(re.finditer(block_pattern, array_content, re.DOTALL))
    
    seen_titles = set()
    unique_matches = []
    duplicates = []
    
    # Some older entries might not have an exact title match, but share core names. e.g "Backfocus" vs "Backfocal Distance (Backfocus)"
    def get_core_title(title):
        t = title.lower()
        # remove parentheses text
        t = re.sub(r'\(.*?\)', '', t).strip()
        return t

    for m in reversed(matches):
        title = m.group(1).strip()
        category = m.group(2).strip()
        norm_title = title.lower()
        core_title = get_core_title(title)
        
        if "constellation" in category.lower():
            unique_matches.append(m)
        else:
            if norm_title in seen_titles or core_title in seen_titles:
                duplicates.append(title)
            else:
                seen_titles.add(norm_title)
                if core_title:
                    seen_titles.add(core_title)
                unique_matches.append(m)
                
    unique_matches.reverse()
    
    print(f"Removed duplicates ({len(duplicates)}): {', '.join(duplicates)}")
    print(f"Total items left: {len(unique_matches)}")
    
    new_array = ",\n".join(["    {" + m.group(0).strip()[1:] for m in unique_matches])
    
    # Fix the indentation of the array lines
    formatted_array = ""
    for item in unique_matches:
        formatted_array += "    {\n"
        formatted_array += f'        title: "{item.group(1).strip()}",\n'
        formatted_array += f'        category: "{item.group(2).strip()}",\n'
        formatted_array += f'        content: `{item.group(3)}`\n'
        formatted_array += "    },\n"
    
    # Remove the trailing comma and newline
    if formatted_array.endswith(",\n"):
        formatted_array = formatted_array[:-2]
        
    new_content = content[:match.start()] + prefix + "\n" + formatted_array + suffix + content[match.end():]
    
    with open('js/glossary_data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    main()

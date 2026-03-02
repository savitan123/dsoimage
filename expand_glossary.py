import re
import json
import time
from google import genai

# Setup API Key
client = genai.Client(api_key="AIzaSyB-56BWqI-wHrAzKra6iCQlpLWcC86o--o")

# Setup Generation Config
config = genai.types.GenerateContentConfig(
  temperature=0.4,
  top_p=0.95,
  top_k=40,
  max_output_tokens=8192,
  response_mime_type="text/plain",
)

SYSTEM_PROMPT = """You are an expert deep space astrophotographer. The user will provide a title, category, and a short 1-2 sentence definition/example of an astrophotography term. 

Your objective:
1. Rewrite and expand the 'Definition' block to be 2-3 detailed paragraphs providing deep technical insight.
2. Rewrite and expand the 'Example' block to provide a highly specific, real-world astrophotography use case (e.g. imaging a specific nebula or using specific camera gear).
3. Output the exact HTML format provided. 
4. DO NOT wrap the output in markdown code blocks (e.g., no ```html). Leave it as raw text.
5. If the item provided is "Bandpass (Full Width at Half Maximum - FWHM)", you MUST split it into TWO separate items in your output: one for "Bandpass", and one for "Full Width at Half Maximum (FWHM)".

Output Format:
            <p><strong>Definition:</strong> [Detailed 2-3 paragraph expansion]</p>
            <p><strong>Example:</strong> [Detailed real-world use case]</p>

If you have to split an item (like Bandpass/FWHM), format the output like this for the split:
            <p><strong>Definition:</strong> [Detailed Bandpass definition]</p>
            <p><strong>Example:</strong> [Detailed Bandpass example]</p>
        `
    },
    {
        title: "Full Width at Half Maximum (FWHM)",
        category: "Advanced Filter Physics & Light Control",
        content: `
            <p><strong>Definition:</strong> [Detailed FWHM definition]</p>
            <p><strong>Example:</strong> [Detailed FWHM example]</p>
"""

# Read the file
with open('js/glossary_data.js', 'r', encoding='utf-8') as f:
    original_code = f.read()

# Start extracting items using Regex. 
# We're looking for the block between { title: ... content: ` ... ` }
pattern = r'({\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*content:\s*`)([\s\S]*?)(`\s*})'
matches = list(re.finditer(pattern, original_code))

print(f"Loaded {len(matches)} glossary items.")

new_code = original_code

for i, match in enumerate(matches):
    full_match = match.group(0)
    prefix = match.group(1) # { title: "...", category: "...", content: `
    title = match.group(2)
    category = match.group(3)
    old_content = match.group(4)
    suffix = match.group(5) # ` }
    
    # Skip constellations if they accidentally got into this array before
    if "Constellation" in category:
        continue

    print(f"Processing ({i+1}/{len(matches)}): {title.encode('ascii', 'ignore').decode('ascii')}...")

    prompt = f"Title: {title}\nCategory: {category}\nOriginal Content:\n{old_content}"
    
    success = False
    while not success:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[SYSTEM_PROMPT, prompt],
                config=config,
            )
            new_content = response.text.strip()
            
            # If the model injected markdown formatting, strip it out.
            if new_content.startswith("```html"):
                new_content = new_content[7:]
            if new_content.startswith("```"):
                new_content = new_content[3:]
            if new_content.endswith("```"):
                new_content = new_content[:-3]
                
            new_content = new_content.strip()

            # Build replacement string
            if "Bandpass" in title and "FWHM" in title:
                # Special case for the split
                replacement = f'{prefix}\n{new_content}\n{suffix}'
            else:
                replacement = f'{prefix}\n{new_content}\n{suffix}'

            new_code = new_code.replace(full_match, replacement)
            
            # Rate limit to stay under 15 RPM
            time.sleep(4)
            success = True
            
        except Exception as e:
            error_msg = str(e)
            print(f"Error on {title.encode('ascii', 'ignore').decode('ascii')}: {error_msg}")
            
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                # Try to parse the required retry delay from the error message
                delay_match = re.search(r"retryDelay': '(\d+)s'", error_msg)
                if delay_match:
                    wait_time = int(delay_match.group(1)) + 5 # Add buffer
                else:
                    wait_time = 65 # Fallback
                
                print(f"Rate limit reached. Cooling down for {wait_time} seconds (Dynamic Backoff)...")
                time.sleep(wait_time)
                print(f"Retrying {title.encode('ascii', 'ignore').decode('ascii')}...")
            else:
                print("Unknown error, waiting 10 seconds before retry...")
                time.sleep(10)
    
    # Write to file after successful loop
    with open('js/glossary_data.js', 'w', encoding='utf-8') as f:
        f.write(new_code)

print("Expansion script complete!")

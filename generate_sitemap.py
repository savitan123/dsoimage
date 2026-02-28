import os
import glob
import json
import xml.etree.ElementTree as ET
from urllib.parse import quote
from datetime import datetime
from bs4 import BeautifulSoup

DOMAIN = "https://dsoimage.com"
SITEMAP_PATH = "sitemap.xml"

# Optional: exclude some files you don't want indexed (like temp files)
EXCLUDE_FILES = [
    "galaxies_temp.html", 
    "nebulae_temp.html", 
    "cluster_temp.html",
    "constellation.html", # we index this dynamically with ?id=
]

def format_date(timestamp):
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')

def create_url_element(urlset, loc, lastmod=None, changefreq="weekly", priority="0.8"):
    url = ET.SubElement(urlset, "url")
    ET.SubElement(url, "loc").text = loc
    if lastmod:
        ET.SubElement(url, "lastmod").text = lastmod
    ET.SubElement(url, "changefreq").text = changefreq
    ET.SubElement(url, "priority").text = priority
    return url

def add_image_extension(url_element, image_loc, image_title, image_caption):
    image = ET.SubElement(url_element, "image:image")
    ET.SubElement(image, "image:loc").text = image_loc
    if image_title:
        ET.SubElement(image, "image:title").text = image_title
    if image_caption:
        ET.SubElement(image, "image:caption").text = image_caption

def generate_sitemap():
    # Setup namespaces
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    ET.register_namespace('image', 'http://www.google.com/schemas/sitemap-image/1.1')
    
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9", 
                        **{"xmlns:image": "http://www.google.com/schemas/sitemap-image/1.1"})

    # 1. Index Static HTML Files
    html_files = glob.glob("*.html")
    for file in html_files:
        if file in EXCLUDE_FILES:
            continue
            
        lastmod = format_date(os.path.getmtime(file))
        loc = f"{DOMAIN}/{file}"
        if file == "index.html":
            loc = f"{DOMAIN}/"
            url_element = create_url_element(urlset, loc, lastmod, "daily", "1.0")
        else:
            url_element = create_url_element(urlset, loc, lastmod, "weekly", "0.8")

        # Over-index Images on Galleries
        if file in ["galaxies.html", "nebulae.html", "clusters.html"]:
            with open(file, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'html.parser')
                items = soup.find_all(class_='gallery-item')
                for item in items:
                    data_full = item.get('data-full', '')
                    data_title = item.get('data-title', '')
                    data_notes = item.get('data-notes', '')
                    img = item.find('img')
                    
                    if img and img.get('src'):
                        # Using full res image if available, otherwise preview
                        img_path = data_full if data_full else img.get('src')
                        # Ensure absolute URL
                        if not img_path.startswith('http'):
                            img_path = f"{DOMAIN}/{img_path.lstrip('/')}"
                            
                        # Clean notes (remove HTML tags)
                        clean_notes = BeautifulSoup(data_notes, "html.parser").text if data_notes else ""
                        
                        add_image_extension(url_element, img_path, data_title, clean_notes)

    # 2. Index Dynamic Constellation Pages
    try:
        with open("js/constellations_data.json", 'r', encoding='utf-8') as f:
            cdata = json.load(f)
            
        # Get last mod of the json file so Google knows when objects change
        lastmod = format_date(os.path.getmtime("js/constellations_data.json"))
        
        for abbr, data in cdata.items():
            loc = f"{DOMAIN}/constellation.html?id={abbr}"
            url_element = create_url_element(urlset, loc, lastmod, "monthly", "0.6")
            
            # Index the Map Image itself
            map_img = f"{DOMAIN}/images/constellations/{abbr}.png"
            add_image_extension(url_element, map_img, f"{data.get('name', abbr)} Constellation Map", 
                                f"Detailed map of the {data.get('name', abbr)} constellation showing stars and deep sky objects.")
            
    except Exception as e:
        print(f"Error parsing constellations_data.json: {e}")

    # Write to file
    tree = ET.ElementTree(urlset)
    # Using pretty printing in python 3.9+ 
    if hasattr(ET, 'indent'):
        ET.indent(tree, space="  ", level=0)
        
    tree.write(SITEMAP_PATH, encoding='utf-8', xml_declaration=True)
    print(f"Generated {SITEMAP_PATH} successfully!")

if __name__ == "__main__":
    generate_sitemap()

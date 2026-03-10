---
description: Run the full SEO optimization, Keyword, and Sitemap generation suite
---
# SEO & Sitemap Update Workflow

Whenever the user asks to run the SEO/Sitemap process (or uses `/seo`), execute the following steps precisely. 

Your goal is to ensure all web pages contain standardized keywords, meta-tags, image alt-texts, and that the XML sitemap provides accurate weights and frequencies for web crawlers.

1. **Optimize Keywords, Meta-Data, and Alt Tags**
   Run the Python optimization script. This injects the proper canonical URLs, ensures the base meta descriptions contain the correct "Deep Sky Astrophotography" keywords, and automatically extracts telescope models to generate rich `alt` text for all gallery images.
// turbo
   `python seo_optimize.py`

2. **Generate Sitemap XML**
   Run the PowerShell script. This scans all active HTML pages mapped within the array and extracts all gallery image paths and `data-title` captions to append them as Google Image extensions in the sitemap.
// turbo
   `powershell -ExecutionPolicy Bypass -File scripts\build_sitemap.ps1`

3. **Verify Robots.txt**
   Use the `view_file` tool to quickly check `robots.txt` and ensure it allows all crawlers (`User-agent: *`, `Allow: /`) and correctly points to `Sitemap: https://dsoimage.com/sitemap.xml`.

4. **Deploy Final SEO Changes**
   Once everything is generated, the newly modified `.html` files and the `sitemap.xml` must be pushed to GitHub. Trigger the Deploy workflow by running:
// turbo
   `git add .`
   `git commit -m "Auto-Update SEO keywords, meta tags, and sitemap.xml"`
   `git push`

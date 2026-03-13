# /seo — Full SEO Update for dsoimage.com

Perform a complete SEO refresh for the DSOImage site. Work through each step below in order, then commit and push everything in a single commit.

## Site facts (do NOT change these)
- Domain: `https://dsoimage.com`
- Owner: Shimon Avitan
- CSS version query param: check existing `?v=NNN` and bump if style.css changed
- All HTML pages live at the root level
- Language files: `lang/en.json` and `lang/he.json`
- Today's date must be fetched with `date -u +%Y-%m-%d` in bash

---

## Step 1 — Audit all HTML pages

For every `.html` file at the root (excluding `*_temp.html` and `test-glossary.html`):

Check that each page has **all** of the following in `<head>`:

```html
<!-- Required for every page -->
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="canonical" href="https://dsoimage.com/PAGE.html" />
<title>PAGE TITLE — DSOImage by Shimon Avitan</title>
<meta name="description" content="150–160 char description specific to this page" />
<meta name="keywords" content="5–10 specific keywords for this page" />

<!-- Open Graph -->
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://dsoimage.com/images/preview/RELEVANT_IMAGE.jpg" />
<meta property="og:url" content="https://dsoimage.com/PAGE.html" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://dsoimage.com/images/preview/RELEVANT_IMAGE.jpg" />

<!-- hreflang -->
<link rel="alternate" hreflang="en" href="https://dsoimage.com/PAGE.html" />
<link rel="alternate" hreflang="he" href="https://dsoimage.com/PAGE.html" />
<link rel="alternate" hreflang="x-default" href="https://dsoimage.com/PAGE.html" />
```

Fix any missing or incorrect tags. Use page-specific descriptions and keywords — never copy-paste the same text across pages.

**Gallery pages** (galaxies, nebulae, clusters) should also have JSON-LD:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "name": "...",
  "description": "...",
  "url": "https://dsoimage.com/PAGE.html",
  "author": { "@type": "Person", "name": "Shimon Avitan" }
}
</script>
```

**index.html** should have Organization + WebSite + SearchAction JSON-LD.

---

## Step 2 — Update sitemap.xml

- Set ALL `<lastmod>` to today's date (run `date -u +%Y-%m-%d`)
- Ensure every public page has a `<url>` entry with correct `<priority>` and `<changefreq>`:
  - `index.html` → priority 1.0, daily
  - gallery pages → priority 0.8, weekly (include `<image:image>` blocks)
  - tool pages (planner, tonights_best, apod, iss, catalog-explorer) → priority 0.8–0.9, daily/weekly
  - resource pages (equipment, processing, knowledge, checklist, coordinate-converter, live-sky-map, weather) → priority 0.6–0.8, monthly
  - constellation pages → priority 0.7, monthly
  - about/contact/sitemap → priority 0.4–0.5, monthly
- Exclude: `*_temp.html`, `test-glossary.html`

---

## Step 3 — Update robots.txt

Ensure robots.txt contains:
```
User-agent: *
Allow: /

Disallow: /cluster_temp.html
Disallow: /galaxies_temp.html
Disallow: /nebulae_temp.html
Disallow: /test-glossary.html
Disallow: /.claude/
Disallow: /.github/

Sitemap: https://dsoimage.com/sitemap.xml
```

---

## Step 4 — Verify footer sitemap link

Every page's `<footer>` must contain the "Site Map" link beneath the copyright:
```html
<p data-i18n="footer_text">© 2026 Shimon Avitan | dsoimage.com</p>
<p style="margin-top: 8px; font-size: 12px;"><a href="sitemap.html" ...>
  <i class="fa-solid fa-sitemap"></i> Site Map</a></p>
```

---

## Step 5 — Commit and push

After all changes:
1. `git add` all modified files
2. Commit with message: `SEO update: meta tags, sitemap.xml, robots.txt — YYYY-MM-DD`
3. `git pull --rebase origin main` if push is rejected
4. `git push origin main`

Only tell the user "Done — deployed" after the push succeeds.

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Assuming cheerio is or can be used, but let's use regex to be safe if node_modules aren't present.

const siteUrl = 'https://dsoimage.com';
const today = new Date().toISOString().split('T')[0];

const pages = [
    { file: 'index.html', url: '/', priority: '1.0', changefreq: 'daily' },
    { file: 'galaxies.html', url: '/galaxies.html', priority: '0.8', changefreq: 'weekly' },
    { file: 'nebulae.html', url: '/nebulae.html', priority: '0.8', changefreq: 'weekly' },
    { file: 'clusters.html', url: '/clusters.html', priority: '0.8', changefreq: 'weekly' },
    { file: 'planner.html', url: '/planner.html', priority: '0.9', changefreq: 'weekly' },
    { file: 'tools.html', url: '/tools.html', priority: '0.8', changefreq: 'monthly' },
    { file: 'weather.html', url: '/weather.html', priority: '0.7', changefreq: 'daily' },
    { file: 'processing.html', url: '/processing.html', priority: '0.6', changefreq: 'monthly' },
    { file: 'equipment.html', url: '/equipment.html', priority: '0.6', changefreq: 'monthly' },
    { file: 'about.html', url: '/about.html', priority: '0.5', changefreq: 'monthly' },
    { file: 'contact.html', url: '/contact.html', priority: '0.5', changefreq: 'monthly' }
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

pages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;

    // Parse images if it's a gallery page
    if (['galaxies.html', 'nebulae.html', 'clusters.html'].includes(page.file)) {
        const filePath = path.join(__dirname, '..', page.file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Regex to find gallery items: <div class="gallery-item" data-full="..." data-title="...">
            const itemRegex = /<div class="gallery-item"[^>]*>/g;
            let match;
            while ((match = itemRegex.exec(content)) !== null) {
                const divTag = match[0];

                const fullMatch = divTag.match(/data-full="([^"]+)"/);
                const titleMatch = divTag.match(/data-title="([^"]+)"/);

                if (fullMatch && fullMatch[1]) {
                    let imgLoc = fullMatch[1].split('?')[0]; // Remove query params like ?v=2
                    let imgTitle = titleMatch ? titleMatch[1] : '';

                    xml += `    <image:image>\n`;
                    xml += `      <image:loc>${siteUrl}/${imgLoc}</image:loc>\n`;
                    if (imgTitle) {
                        // Escape xml chars
                        imgTitle = imgTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
                        xml += `      <image:caption>${imgTitle}</image:caption>\n`;
                    }
                    xml += `    </image:image>\n`;
                }
            }
        }
    }

    xml += `  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml);
console.log('Sitemap generated successfully.');

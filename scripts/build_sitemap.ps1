$siteUrl = "https://dsoimage.com"
$today = (Get-Date).ToString("yyyy-MM-dd")

$pages = @(
    @{ file = "index.html"; url = "/"; priority = "1.0"; changefreq = "daily" },
    @{ file = "galaxies.html"; url = "/galaxies.html"; priority = "0.8"; changefreq = "weekly" },
    @{ file = "nebulae.html"; url = "/nebulae.html"; priority = "0.8"; changefreq = "weekly" },
    @{ file = "clusters.html"; url = "/clusters.html"; priority = "0.8"; changefreq = "weekly" },
    @{ file = "planner.html"; url = "/planner.html"; priority = "0.9"; changefreq = "weekly" },
    @{ file = "tools.html"; url = "/tools.html"; priority = "0.8"; changefreq = "monthly" },
    @{ file = "weather.html"; url = "/weather.html"; priority = "0.7"; changefreq = "daily" },
    @{ file = "processing.html"; url = "/processing.html"; priority = "0.6"; changefreq = "monthly" },
    @{ file = "equipment.html"; url = "/equipment.html"; priority = "0.6"; changefreq = "monthly" },
    @{ file = "about.html"; url = "/about.html"; priority = "0.5"; changefreq = "monthly" },
    @{ file = "contact.html"; url = "/contact.html"; priority = "0.5"; changefreq = "monthly" }
)

$xml = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n"
$xml += "<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`"`n"
$xml += "        xmlns:image=`"http://www.google.com/schemas/sitemap-image/1.1`">`n"

foreach ($page in $pages) {
    $xml += "  <url>`n"
    $xml += "    <loc>$siteUrl$($page.url)</loc>`n"
    $xml += "    <lastmod>$today</lastmod>`n"
    $xml += "    <changefreq>$($page.changefreq)</changefreq>`n"
    $xml += "    <priority>$($page.priority)</priority>`n"

    if ($page.file -in "galaxies.html", "nebulae.html", "clusters.html") {
        $filePath = Join-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath "..") -ChildPath $page.file
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw
            
            # Simple regex to extract data-full and data-title
            $matches = [regex]::Matches($content, '<div class="gallery-item"[^>]*>')
            foreach ($match in $matches) {
                $div = $match.Value
                
                $fullMatch = [regex]::Match($div, 'data-full="([^"]+)"')
                $titleMatch = [regex]::Match($div, 'data-title="([^"]+)"')
                
                if ($fullMatch.Success) {
                    $imgLoc = $fullMatch.Groups[1].Value.Split('?')[0] # Remove query string
                    $imgTitle = if ($titleMatch.Success) { $titleMatch.Groups[1].Value } else { "" }
                    
                    $xml += "    <image:image>`n"
                    $xml += "      <image:loc>$siteUrl/$imgLoc</image:loc>`n"
                    if ($imgTitle) {
                        # Escape special chars
                        $imgTitle = $imgTitle -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;' -replace "'", '&apos;'
                        $xml += "      <image:caption>$imgTitle</image:caption>`n"
                    }
                    $xml += "    </image:image>`n"
                }
            }
        }
    }

    $xml += "  </url>`n"
}

$xml += "</urlset>`n"

$outPath = Join-Path $PSScriptRoot "..\sitemap.xml"
Set-Content -Path $outPath -Value $xml -Encoding UTF8
Write-Host "Sitemap generated successfully at $outPath"

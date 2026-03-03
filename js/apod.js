/**
 * NASA APOD Widget — Server-Side Cached Model
 *
 * Reads from /data/apod_cache.json (committed daily by GitHub Actions).
 * Never calls api.nasa.gov directly from the browser.
 *
 * Supports:
 *  - media_type: "image" → renders <img> with link to HD version
 *  - media_type: "video" → renders <iframe> embed or Watch link
 *  - Fallback: hides #apod-widget entirely on any error
 */

(function () {
    'use strict';

    // Fallback image from the site's own gallery
    const FALLBACK = {
        title: 'Horsehead & Flame Nebula',
        url: 'images/preview/HorseHead_Flame_Nebula.jpg',
        hdurl: 'images/preview/HorseHead_Flame_Nebula.jpg',
        media_type: 'image',
        explanation: 'A stunning narrowband H-alpha image of the iconic Horsehead and Flame Nebulae in Orion, captured by Shimon Avitan.',
        copyright: 'Shimon Avitan / DSOImage'
    };

    const CACHE_URL = 'data/apod_cache.json';

    function hideWidget() {
        const widget = document.getElementById('apod-widget');
        if (widget) widget.style.display = 'none';
    }

    function truncate(text, maxLen) {
        if (!text) return '';
        return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '…' : text;
    }

    /** Build the YouTube/Vimeo embed URL from a watch URL */
    function toEmbedUrl(url) {
        try {
            const u = new URL(url);
            // YouTube
            if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
                const vid = u.searchParams.get('v') || u.pathname.replace('/', '');
                return `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
            }
            // Vimeo
            if (u.hostname.includes('vimeo.com')) {
                const vid = u.pathname.replace('/', '');
                return `https://player.vimeo.com/video/${vid}`;
            }
        } catch (_) { }
        return url; // return as-is for other platforms
    }

    function renderApod(data) {
        const container = document.getElementById('apod-container');
        if (!container) return;

        const title = data.title || 'NASA Astronomy Picture of the Day';
        const excerpt = truncate(data.explanation, 160);
        const date = data.date ? `<span style="color:#666;font-size:11px;">${data.date}</span>` : '';
        const copy = data.copyright ? `<span style="color:#555;font-size:11px;">© ${data.copyright.replace(/\n/g, ' ')}</span>` : '';

        let mediaHtml = '';

        if (data.media_type === 'video') {
            // ------- VIDEO -------
            const thumbUrl = data.thumbnail_url || '';
            const embedUrl = toEmbedUrl(data.url || '');

            if (thumbUrl) {
                // Show thumbnail with play button overlay that swaps to iframe on click
                mediaHtml = `
          <div id="apod-video-thumb" style="position:relative;width:100%;cursor:pointer;border-radius:8px;overflow:hidden;" title="Click to play" onclick="(function(el){
            var iframe=document.createElement('iframe');
            iframe.src='${embedUrl}';
            iframe.style.cssText='width:100%;height:180px;border:none;border-radius:8px;';
            iframe.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';
            iframe.allowFullscreen=true;
            el.parentNode.replaceChild(iframe,el);
          })(this)">
            <img src="${thumbUrl}" alt="Video thumbnail" style="width:100%;height:160px;object-fit:cover;display:block;border-radius:8px;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);">
              <div style="width:52px;height:52px;background:rgba(255,80,80,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:18px solid #fff;margin-left:4px;"></div>
              </div>
            </div>
          </div>`;
            } else {
                // No thumbnail — show iframe directly
                mediaHtml = `
          <iframe src="${embedUrl}" style="width:100%;height:180px;border:none;border-radius:8px;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen title="${title}"></iframe>`;
            }

            mediaHtml += `
        <a href="${data.url || '#'}" target="_blank" rel="noopener noreferrer"
           style="font-size:12px;color:#7ec8f5;text-decoration:none;">
          <i class="fa-solid fa-film"></i> Watch on YouTube / NASA
        </a>`;

        } else {
            // ------- IMAGE -------
            const imgUrl = data.url || FALLBACK.url;
            const hdUrl = data.hdurl || imgUrl;

            mediaHtml = `
        <a href="${hdUrl}" target="_blank" rel="noopener noreferrer" title="Open HD version" style="display:block;width:100%;">
          <img src="${imgUrl}" alt="${title}"
               style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;display:block;transition:opacity 0.3s;"
               loading="lazy"
               onerror="this.src='${FALLBACK.url}'">
        </a>`;
        }

        container.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;gap:10px;">
        ${mediaHtml}
        <div style="text-align:left;">
          <div style="font-weight:bold;color:#fff;font-size:14px;margin-bottom:4px;">${title}</div>
          <div style="color:#999;font-size:12px;line-height:1.5;">${excerpt}</div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
            ${date}
            ${copy}
          </div>
        </div>
      </div>`;
    }

    async function loadApod() {
        try {
            const res = await fetch(CACHE_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Basic sanity check — must have at least url or thumbnail_url
            if (!data.url && !data.thumbnail_url) {
                renderApod(FALLBACK);
                return;
            }

            renderApod(data);
        } catch (err) {
            console.warn('[APOD] Failed to load cache:', err.message);
            // Try rendering with fallback; hide widget only if container isn't there
            const container = document.getElementById('apod-container');
            if (container) {
                renderApod(FALLBACK);
            } else {
                hideWidget();
            }
        }
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadApod);
    } else {
        loadApod();
    }
})();

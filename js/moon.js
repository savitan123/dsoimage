/**
 * Moon Phase Widget — API-Cached Model
 *
 * Reads from /data/moon_cache.json (updated daily by GitHub Actions via USNO API).
 * Never calls the USNO API directly from the browser.
 *
 * Populates:
 *   - #home-lunar-widget-content  (home page widget)
 *   - #moon-phase-name, #moon-illumination, #days-to-new-moon  (astronomy-tools page)
 */

(function () {
    'use strict';

    const CACHE_URL = 'data/moon_cache.json';

    /** Map USNO phase names → moon emoji */
    const PHASE_EMOJI = {
        'New Moon': '🌑',
        'Waxing Crescent': '🌒',
        'First Quarter': '🌓',
        'Waxing Gibbous': '🌔',
        'Full Moon': '🌕',
        'Waning Gibbous': '🌖',
        'Last Quarter': '🌗',
        'Waning Crescent': '🌘'
    };

    /**
     * Derive a normalised phase name from the USNO curphase string.
     * USNO values include: "Waxing Crescent", "First Quarter", "Waxing Gibbous",
     * "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent", "New Moon"
     */
    function normalisePhaseName(raw) {
        if (!raw) return 'Unknown';
        // Title-case and trim — USNO is usually already correct
        const s = raw.trim();
        // Match known names (case-insensitive) and return canonical form
        for (const key of Object.keys(PHASE_EMOJI)) {
            if (key.toLowerCase() === s.toLowerCase()) return key;
        }
        return s; // Return as-is if not matched (shouldn't happen)
    }

    function getImagingRecommendation(illumination) {
        if (illumination === null || illumination === undefined) return '';
        if (illumination < 25) return 'Excellent for broadband & narrowband imaging — low moon interference.';
        if (illumination < 50) return 'Good conditions for broadband imaging.';
        if (illumination < 75) return 'Consider narrowband imaging (H-alpha works well).';
        return 'Ideal for narrowband (H-alpha). Broadband galaxy hunting not recommended tonight.';
    }

    function renderHomeWidget(data) {
        const widget = document.getElementById('home-lunar-widget-content');
        if (!widget) return;

        const phaseName = normalisePhaseName(data.phase);
        const icon = PHASE_EMOJI[phaseName] || '🌙';
        const illum = (data.illumination !== undefined) ? data.illumination : '?';
        const rec = getImagingRecommendation(data.illumination);

        let nextPhaseHtml = '';
        if (data.closestphase && data.closestphase.phase) {
            nextPhaseHtml = `<div style="color:#666; font-size:12px; margin-top:6px;">Next: ${data.closestphase.phase} on ${data.closestphase.date}</div>`;
        }

        let localMathHtml = '';
        if (typeof Astronomy !== 'undefined') {
            try {
                let lat = 31.05, lng = 34.85; // Default fallback
                const observer = new Astronomy.Observer(lat, lng, 0); // Will use IP lookup if implemented globally, or fallback

                // For simplicity without duplicating the big IP fetch, let's just attempt a synchronous-style 
                // calculation or use default if geolocation hasn't finished yet.
                // Fortunately, eclipse is global, just local time formatting.
                const date = new Date();

                // 1. Rise / Set
                let riseStr = "--", setStr = "--", transitStr = "--";
                const nextRise = Astronomy.SearchRiseSet('Moon', observer, +1, date, 2);
                const nextSet = Astronomy.SearchRiseSet('Moon', observer, -1, date, 2);
                const nextTransit = Astronomy.SearchAltitude('Moon', observer, +1, date, 1, 0); // Approx transit

                if (nextRise) riseStr = nextRise.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (nextSet) setStr = nextSet.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                // We'll calculate true transit by finding peak hour angle
                const equ_2000 = Astronomy.Equator('Moon', date, observer, true, true);

                // 2. Next Eclipse
                const eclipse = Astronomy.SearchLunarEclipse(date);
                let eclStr = "None upcoming soon";
                if (eclipse && eclipse.peak) {
                    const eDate = eclipse.peak.date;
                    eclStr = eDate.toLocaleDateString() + " (" + (eclipse.kind || "Partial") + ")";
                }

                localMathHtml = `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #333; font-size: 13px; color: #aaa;">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 4px;">
                        <span><i class="fa-solid fa-arrow-up" style="font-size:10px; color:#5E8C7F;"></i> Rise: <span style="font-family:monospace; color:#ddd;">${riseStr}</span></span>
                        <span><i class="fa-solid fa-arrow-down" style="font-size:10px; color:#d9534f;"></i> Set: <span style="font-family:monospace; color:#ddd;">${setStr}</span></span>
                    </div>
                    <div style="color: #888;">
                        <i class="fa-solid fa-eclipse"></i> Next Eclipse: <span style="color:#ddd;">${eclStr}</span>
                    </div>
                </div>`;
            } catch (e) {
                console.warn("Astronomy engine moon calc failed", e);
            }
        }

        widget.innerHTML = `
      <div style="font-size: 4rem; filter: grayscale(0.2) drop-shadow(0px 0px 10px rgba(255,255,255,0.2));">
        ${icon}
      </div>
      <div style="flex-grow: 1;">
        <div style="font-size: 22px; font-weight: bold; color: #fff;">${phaseName}</div>
        <div style="color: #bbb; font-size: 14px;">Illumination: ${illum}%</div>
        <div style="color: #888; font-size: 13px; margin-top: 5px;">${rec}</div>
        ${nextPhaseHtml}
        ${localMathHtml}
      </div>
    `;
    }

    function renderToolsPage(data) {
        const moonNameEl = document.getElementById('moon-phase-name');
        const moonIllumEl = document.getElementById('moon-illumination');
        const daysToNewEl = document.getElementById('days-to-new-moon');
        if (!moonNameEl) return;

        const phaseName = normalisePhaseName(data.phase);
        const icon = PHASE_EMOJI[phaseName] || '🌙';
        const illum = (data.illumination !== undefined) ? data.illumination : '?';

        if (moonNameEl) moonNameEl.innerText = `${icon} ${phaseName}`;
        if (moonIllumEl) moonIllumEl.innerText = `Illumination: ${illum}%`;

        // Estimate days to next new moon from closestphase if available
        if (daysToNewEl && data.closestphase && data.closestphase.date) {
            try {
                const target = new Date(data.closestphase.date);
                const today = new Date();
                const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
                daysToNewEl.innerText = diff > 0 ? diff : 0;
            } catch (e) {
                daysToNewEl.innerText = '—';
            }
        }
    }

    function renderFallback() {
        const widget = document.getElementById('home-lunar-widget-content');
        if (widget) {
            widget.innerHTML = `
        <div style="font-size: 4rem;">🌙</div>
        <div>
          <div style="font-size: 18px; color: #ccc;">Moon data unavailable</div>
          <div style="color: #777; font-size: 13px; margin-top: 4px;">
            <a href="https://www.timeanddate.com/moon/" target="_blank" rel="noopener"
               style="color:#7ec8f5;">View on timeanddate.com ↗</a>
          </div>
        </div>`;
        }
    }

    async function loadMoonPhase() {
        try {
            const res = await fetch(CACHE_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data.phase) throw new Error('No phase field in cache');

            renderHomeWidget(data);
            renderToolsPage(data);
        } catch (err) {
            console.warn('[Moon] Failed to load cache:', err.message);
            renderFallback();
        }
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMoonPhase);
    } else {
        loadMoonPhase();
    }

})();

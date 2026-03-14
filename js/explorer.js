document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('explorer-input');
    const searchBtn = document.getElementById('explorer-btn');
    const resultsContainer = document.getElementById('explorer-results');
    const loadingIndicator = document.getElementById('explorer-loading');

    let galleryData = [];
    let targetsData = null;
    let aladinInstance = null;
    let fovOverlayLayer = null;
    let fovLabelUpdateFn = null;
    let currentObjectCoords = null; // { ra: decDeg, dec: decDeg }

    // ── Camera database ─────────────────────────────────────────────────────
    const CAMERAS = [
        // ZWO
        { name: "ZWO ASI 2600 Mono/Color",  w: 23.5,  h: 15.7,  px: 3.76 },
        { name: "ZWO ASI 6200 Mono/Color",  w: 35.6,  h: 23.8,  px: 3.76 },
        { name: "ZWO ASI 2400 Mono/Color",  w: 35.9,  h: 23.9,  px: 2.74 },
        { name: "ZWO ASI 1600 Mono/Color",  w: 17.7,  h: 13.4,  px: 3.80 },
        { name: "ZWO ASI 294 Mono/Color",   w: 19.1,  h: 13.0,  px: 4.63 },
        { name: "ZWO ASI 533 Mono/Color",   w: 11.31, h: 11.31, px: 3.76 },
        { name: "ZWO ASI 183 Mono/Color",   w: 13.2,  h: 8.8,   px: 2.40 },
        { name: "ZWO ASI 071 Color Pro",    w: 23.6,  h: 15.6,  px: 4.78 },
        { name: "ZWO ASI 120 Mini Mono",    w: 4.8,   h: 3.6,   px: 3.75 },
        // QHY
        { name: "QHY 600M/C",              w: 35.9,  h: 24.0,  px: 3.76 },
        { name: "QHY 268M/C",              w: 23.5,  h: 15.7,  px: 3.76 },
        { name: "QHY 163M",               w: 17.7,  h: 13.4,  px: 3.80 },
        { name: "QHY 533M",               w: 11.31, h: 11.31, px: 3.76 },
        // Canon
        { name: "Canon EOS Ra",            w: 36.0,  h: 24.0,  px: 5.36 },
        { name: "Canon EOS 6D",            w: 35.8,  h: 23.9,  px: 6.55 },
        { name: "Canon EOS 6D Mark II",    w: 35.9,  h: 24.0,  px: 5.74 },
        { name: "Canon EOS 5D Mark IV",    w: 36.0,  h: 24.0,  px: 5.36 },
        // Nikon
        { name: "Nikon D810A",             w: 35.9,  h: 24.0,  px: 4.88 },
        { name: "Nikon Z6 II",             w: 35.9,  h: 24.0,  px: 5.94 },
        // Sony
        { name: "Sony A7S III",            w: 35.6,  h: 23.8,  px: 9.40 },
        { name: "Sony A7R IV",             w: 35.7,  h: 23.8,  px: 3.73 },
        { name: "Sony A7C II",             w: 35.9,  h: 24.0,  px: 5.93 },
    ];

    // Populate camera dropdown
    const cameraSelect = document.getElementById('fov-camera');
    if (cameraSelect) {
        CAMERAS.forEach((cam, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = cam.name;
            cameraSelect.appendChild(opt);
        });
        cameraSelect.addEventListener('change', () => {
            const idx = parseInt(cameraSelect.value);
            if (isNaN(idx)) return;
            const cam = CAMERAS[idx];
            document.getElementById('fov-sensor-w').value = cam.w;
            document.getElementById('fov-sensor-h').value = cam.h;
            document.getElementById('fov-pixel-size').value = cam.px;
            drawFovOverlay();
        });
    }

    // Redraw when focal length or sensor fields change manually
    ['fov-focal', 'fov-sensor-w', 'fov-sensor-h'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', drawFovOverlay);
    });

    // ── Coordinate helpers ───────────────────────────────────────────────────
    // Convert RA string (decimal degrees with "°", or HMS "HH MM SS.ss") to decimal degrees
    function raToDecDeg(raStr) {
        raStr = String(raStr).replace('°', '').trim();
        if (/^[\d.]+$/.test(raStr)) return parseFloat(raStr); // already decimal degrees
        const parts = raStr.split(/[\s:]+/);
        const h = parseFloat(parts[0]) || 0;
        const m = parseFloat(parts[1]) || 0;
        const s = parseFloat(parts[2]) || 0;
        return (h + m / 60 + s / 3600) * 15; // hours → degrees
    }

    // Convert Dec string (decimal degrees with "°", or DMS "+DD MM SS.s") to decimal degrees
    function decToDecDeg(decStr) {
        decStr = String(decStr).replace('°', '').trim();
        if (/^-?[\d.]+$/.test(decStr)) return parseFloat(decStr);
        const neg = decStr.startsWith('-');
        const parts = decStr.replace('-', '').split(/[\s:]+/);
        const d = parseFloat(parts[0]) || 0;
        const m = parseFloat(parts[1]) || 0;
        const s = parseFloat(parts[2]) || 0;
        return (neg ? -1 : 1) * (d + m / 60 + s / 3600);
    }

    // ── FOV overlay drawing ──────────────────────────────────────────────────
    function drawFovOverlay() {
        if (!aladinInstance || !currentObjectCoords) return;

        const focalLength = parseFloat(document.getElementById('fov-focal').value);
        const sensorW = parseFloat(document.getElementById('fov-sensor-w').value);
        const sensorH = parseFloat(document.getElementById('fov-sensor-h').value);

        const resultDiv = document.getElementById('fov-result');

        if (!focalLength || !sensorW || !sensorH || focalLength <= 0) {
            if (resultDiv) resultDiv.style.display = 'none';
            const oldC = document.getElementById('fov-canvas-overlay');
            if (oldC) oldC.remove();
            return;
        }

        const fovW_arcmin = (sensorW * 3438) / focalLength;
        const fovH_arcmin = (sensorH * 3438) / focalLength;
        const fovW_deg = fovW_arcmin / 60;
        const fovH_deg = fovH_arcmin / 60;

        const { ra, dec } = currentObjectCoords;
        const dDec = fovH_deg / 2;
        const dRa = (fovW_deg / 2) / Math.cos(dec * Math.PI / 180);

        // corners: TL, TR, BR, BL
        const corners = [
            [ra - dRa, dec + dDec],
            [ra + dRa, dec + dDec],
            [ra + dRa, dec - dDec],
            [ra - dRa, dec - dDec]
        ];

        // Zoom Aladin to show the full FOV with margin
        const viewFov = Math.max(fovW_deg, fovH_deg) * 1.6;
        aladinInstance.setFov(viewFov);

        // Draw rectangle + labels on HTML Canvas overlay (bypasses Aladin layer API)
        drawFovCanvas(corners, fovW_arcmin, fovH_arcmin);

        // Update result bar
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<i class="fa-solid fa-crop-simple" style="color:#FFAB40;"></i>&nbsp; FOV: <strong style="color:#fff;">${arcminToDMS(fovW_arcmin)} &times; ${arcminToDMS(fovH_arcmin)}</strong> &nbsp;<span style="color:#888;">(${fovW_arcmin.toFixed(1)}' &times; ${fovH_arcmin.toFixed(1)}')</span>`;
        }
    }

    // ── FOV label helpers ────────────────────────────────────────────────────
    function arcminToDMS(arcmin) {
        const totalArcsec = arcmin * 60;
        const deg = Math.floor(totalArcsec / 3600);
        const min = Math.floor((totalArcsec % 3600) / 60);
        const sec = Math.round(totalArcsec % 60);
        if (deg > 0) return `${deg}\u00b0 ${min}' ${sec}"`;
        if (min > 0) return `${min}' ${sec}"`;
        return `${sec}"`;
    }

    // Draw the FOV rectangle + DMS labels on an HTML Canvas placed over the Aladin div.
    // This bypasses Aladin's layer API entirely — always visible, always works.
    function drawFovCanvas(corners, fovW_arcmin, fovH_arcmin) {
        const aladinDiv = document.getElementById('aladin-lite-div');
        if (!aladinDiv || !aladinInstance) return;
        aladinDiv.style.position = 'relative';

        // Get or create a persistent <canvas> on top of the Aladin WebGL canvas
        let canvas = document.getElementById('fov-canvas-overlay');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'fov-canvas-overlay';
            canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:10;';
            aladinDiv.appendChild(canvas);
        }

        const wDMS = arcminToDMS(fovW_arcmin);
        const hDMS = arcminToDMS(fovH_arcmin);

        function redraw() {
            canvas.width  = aladinDiv.offsetWidth  || 600;
            canvas.height = aladinDiv.offsetHeight || 400;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Convert sky coordinates → canvas pixel positions
            const px = corners.map(c => {
                try {
                    const p = aladinInstance.world2pix(c[0], c[1]);
                    return (p && !isNaN(p[0]) && !isNaN(p[1])) ? p : null;
                } catch(e) { return null; }
            });
            if (px.some(p => p === null)) return;

            // ── Rectangle ──────────────────────────────────────────────────
            ctx.beginPath();
            ctx.moveTo(px[0][0], px[0][1]);
            ctx.lineTo(px[1][0], px[1][1]);
            ctx.lineTo(px[2][0], px[2][1]);
            ctx.lineTo(px[3][0], px[3][1]);
            ctx.closePath();
            ctx.strokeStyle = '#FFAB40';
            ctx.lineWidth = 2;
            ctx.stroke();

            // ── Side labels with background boxes ──────────────────────────
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            function drawLabel(text, x, y, angleDeg) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angleDeg * Math.PI / 180);
                const tw = ctx.measureText(text).width;
                const pad = 3, th = 13;
                ctx.fillStyle = 'rgba(0,0,0,0.78)';
                ctx.fillRect(-tw / 2 - pad, -th / 2 - pad, tw + pad * 2, th + pad * 2);
                ctx.fillStyle = '#FFAB40';
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }

            // Midpoints — corners order: TL[0], TR[1], BR[2], BL[3]
            // Top side: TL → TR
            drawLabel(wDMS, (px[0][0] + px[1][0]) / 2, (px[0][1] + px[1][1]) / 2, 0);
            // Bottom side: BL → BR
            drawLabel(wDMS, (px[3][0] + px[2][0]) / 2, (px[3][1] + px[2][1]) / 2, 0);
            // Left side: TL → BL  (compute natural angle so label follows the side)
            const leftAngle = Math.atan2(px[3][1] - px[0][1], px[3][0] - px[0][0]) * 180 / Math.PI;
            drawLabel(hDMS, (px[0][0] + px[3][0]) / 2, (px[0][1] + px[3][1]) / 2, leftAngle);
            // Right side: TR → BR
            const rightAngle = Math.atan2(px[2][1] - px[1][1], px[2][0] - px[1][0]) * 180 / Math.PI;
            drawLabel(hDMS, (px[1][0] + px[2][0]) / 2, (px[1][1] + px[2][1]) / 2, rightAngle);
        }

        redraw();

        // Re-render whenever the user pans or zooms Aladin
        if (fovLabelUpdateFn) {
            try { aladinInstance.off('positionChanged', fovLabelUpdateFn); } catch(e) {}
            try { aladinInstance.off('zoomChanged',     fovLabelUpdateFn); } catch(e) {}
        }
        fovLabelUpdateFn = redraw;
        try { aladinInstance.on('positionChanged', fovLabelUpdateFn); } catch(e) {}
        try { aladinInstance.on('zoomChanged',     fovLabelUpdateFn); } catch(e) {}
    }

    // ── Data fetching ────────────────────────────────────────────────────────
    fetch('data/gallery.json')
        .then(res => res.json())
        .then(data => galleryData = data)
        .catch(err => console.error("Error loading gallery data:", err));

    fetch('data/targets.json')
        .then(res => res.json())
        .then(data => targetsData = data)
        .catch(err => console.error("Error loading targets data:", err));

    function formatNumber(numStr) {
        if (numStr === "99" || !numStr) return "N/A";
        return parseFloat(numStr).toFixed(2);
    }

    function searchCatalog(query) {
        if (!query) return;
        query = query.toLowerCase().trim();

        resultsContainer.style.display = 'none';
        loadingIndicator.style.display = 'block';

        // Check Gallery for a match badge
        const queryClean = query.replace(/\s+/g, '').toLowerCase();
        const galleryMatch = galleryData.find(item => {
            const titleMatch = item.title.toLowerCase() === query;
            const cleanMatch = item.cleanName.toLowerCase() === queryClean;
            const aliases = item.aliases ? item.aliases.split(',').map(s => s.trim().toLowerCase()) : [];
            const titles = item.title.toLowerCase().split(/[ \-]/);
            return titleMatch || cleanMatch || aliases.includes(query) || titles.includes(query);
        });

        // Step A: Check local OpenNGC Data
        let localMatch = null;

        const messierToNgc = {
            1: "NGC1952", 2: "NGC7089", 3: "NGC5272", 4: "NGC6121", 5: "NGC5904", 6: "NGC6405", 7: "NGC6475", 8: "NGC6523", 9: "NGC6333", 10: "NGC6254",
            11: "NGC6705", 12: "NGC6218", 13: "NGC6205", 14: "NGC6402", 15: "NGC7078", 16: "NGC6611", 17: "NGC6618", 18: "NGC6613", 19: "NGC6273", 20: "NGC6514",
            21: "NGC6531", 22: "NGC6656", 23: "NGC6494", 24: "IC4715", 25: "IC4725", 26: "NGC6694", 27: "NGC6853", 28: "NGC6626", 29: "NGC6913", 30: "NGC7099",
            31: "NGC0224", 32: "NGC0221", 33: "NGC0598", 34: "NGC1039", 35: "NGC2168", 36: "NGC1960", 37: "NGC2099", 38: "NGC1912", 39: "NGC7092", 40: "WIN04",
            41: "NGC2287", 42: "NGC1976", 43: "NGC1982", 44: "NGC2632", 45: "MEL22", 46: "NGC2437", 47: "NGC2422", 48: "NGC2548", 49: "NGC4472", 50: "NGC2323",
            51: "NGC5194", 52: "NGC7654", 53: "NGC5024", 54: "NGC6715", 55: "NGC6809", 56: "NGC6779", 57: "NGC6720", 58: "NGC4579", 59: "NGC4621", 60: "NGC4649",
            61: "NGC4303", 62: "NGC6266", 63: "NGC5055", 64: "NGC4826", 65: "NGC3623", 66: "NGC3627", 67: "NGC2682", 68: "NGC4590", 69: "NGC6637", 70: "NGC6681",
            71: "NGC6838", 72: "NGC6981", 73: "NGC6994", 74: "NGC0628", 75: "NGC6864", 76: "NGC0650", 77: "NGC1068", 78: "NGC2068", 79: "NGC1904", 80: "NGC6093",
            81: "NGC3031", 82: "NGC3034", 83: "NGC5236", 84: "NGC4374", 85: "NGC4382", 86: "NGC4406", 87: "NGC4486", 88: "NGC4501", 89: "NGC4552", 90: "NGC4569",
            91: "NGC4548", 92: "NGC6341", 93: "NGC2447", 94: "NGC4736", 95: "NGC3351", 96: "NGC3368", 97: "NGC3587", 98: "NGC4192", 99: "NGC4254", 100: "NGC4321",
            101: "NGC5457", 102: "NGC5866", 103: "NGC0581", 104: "NGC4594", 105: "NGC3379", 106: "NGC4258", 107: "NGC6171", 108: "NGC3556", 109: "NGC3992", 110: "NGC0205"
        };

        let searchId = null;
        if (query.startsWith('m')) {
            const mNum = query.match(/\d+/);
            if (mNum && messierToNgc[mNum[0]]) {
                searchId = messierToNgc[mNum[0]];
            }
        } else if (query.startsWith('ngc') || query.startsWith('ic')) {
            const isNgc = query.startsWith('ngc');
            const prefix = isNgc ? 'NGC' : 'IC';
            const numMatch = query.match(/\d+/);
            if (numMatch) {
                const numPadded = numMatch[0].padStart(4, '0');
                searchId = prefix + numPadded;
            }
        }

        if (targetsData && searchId) {
            localMatch = targetsData.find(item => item.n === searchId);
        }

        if (localMatch) {
            renderResults({
                id: localMatch.n,
                searchId: searchId || localMatch.n,
                type: localMatch.t,
                mag: formatNumber(localMatch.m),
                size: localMatch.sz,
                constellation: localMatch.c,
                ra: localMatch.r,
                dec: localMatch.d,
                source: "OpenNGC"
            }, galleryMatch);
            return;
        }

        // Step B: SIMBAD TAP
        const tapUrl = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
        const safeQuery = query.replace(/'/g, "''");
        const adql = `SELECT TOP 1 b.main_id, b.otype, b.ra, b.dec, b.galdim_majaxis, b.galdim_minaxis, f.V, f.B FROM ident i JOIN basic b ON i.oidref = b.oid LEFT JOIN allfluxes f ON b.oid = f.oidref WHERE i.id = '${safeQuery}'`;

        const formData = new URLSearchParams();
        formData.append('request', 'doQuery');
        formData.append('lang', 'adql');
        formData.append('format', 'json');
        formData.append('query', adql);

        fetch(tapUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.data || data.data.length === 0) {
                    renderError(query);
                    return;
                }

                const row = data.data[0];
                const oname = row[0] || query.toUpperCase();
                const otype = row[1] || "Unknown";
                const ra = row[2] ? parseFloat(row[2]).toFixed(4) + "°" : "N/A";
                const dec = row[3] ? parseFloat(row[3]).toFixed(4) + "°" : "N/A";
                const maj = row[4];
                const min = row[5];
                const size = (maj && min) ? `${parseFloat(maj).toFixed(2)} x ${parseFloat(min).toFixed(2)}` : (maj ? parseFloat(maj).toFixed(2) : "N/A");
                const vMag = row[6] ? parseFloat(row[6]).toFixed(2) : null;
                const bMag = row[7] ? parseFloat(row[7]).toFixed(2) : null;
                const magText = vMag ? vMag : (bMag ? bMag : "N/A");

                renderResults({
                    id: oname,
                    searchId: searchId || oname,
                    type: otype,
                    mag: magText,
                    size: size,
                    constellation: "Resolved via Coords",
                    ra: ra,
                    dec: dec,
                    source: "SIMBAD (TAP/ADQL)"
                }, galleryMatch);
            })
            .catch(err => {
                console.error("SIMBAD TAP error:", err);
                renderError(query);
            });
    }

    function renderResults(data, galleryMatch) {
        loadingIndicator.style.display = 'none';

        let galleryHtml = '';
        if (galleryMatch) {
            galleryHtml = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(30, 144, 255, 0.1); border: 1px solid #1e90ff; border-radius: 10px; display: flex; align-items: center; gap: 20px;">
                    <img src="${galleryMatch.thumb || galleryMatch.full}" alt="${galleryMatch.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #1e90ff;">
                    <div>
                        <h4 style="color: #1e90ff; margin-bottom: 5px;">🔥 Found in Your Gallery!</h4>
                        <p style="color: #ccc; font-size: 14px; margin-bottom: 10px;">${galleryMatch.title}</p>
                        <a href="${galleryMatch.page}?object=${encodeURIComponent(galleryMatch.cleanName)}" style="display: inline-block; background: #FFAB40; color: #111; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 13px;">View Capture</a>
                    </div>
                </div>
            `;
        }

        resultsContainer.innerHTML = `
            <div class="result-card" style="background: rgba(20, 20, 20, 0.9); border: 1px solid #333; border-radius: 15px; padding: 30px; margin-top: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 id="wd-main-title" style="color: #FFF; margin: 0; font-size: 28px;">${data.id}</h2>
                        <div id="wd-hebrew-title" style="color: #1e90ff; font-weight: bold; font-size: 16px; margin-top: 5px;"></div>
                        <div id="wikidata-desc" style="color: #aaa; font-style: italic; margin-top: 5px; font-size: 14px;">Querying Wikidata...</div>
                    </div>
                    <span style="background: #333; color: #aaa; padding: 4px 10px; border-radius: 12px; font-size: 12px; height: fit-content;">Source: ${data.source}</span>
                </div>

                <div class="result-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                    <div>
                        <span class="stat-label" style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Identifier / Type</span>
                        <strong class="stat-value" style="color: #FFAB40; font-size: 18px;">${data.type}</strong>
                    </div>
                    <div>
                        <span class="stat-label" style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Magnitude</span>
                        <strong class="stat-value" style="color: #FFF; font-size: 18px;">${data.mag}</strong>
                    </div>
                    <div>
                        <span class="stat-label" style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Size (arcmin)</span>
                        <strong class="stat-value" style="color: #FFF; font-size: 18px;">${data.size}</strong>
                    </div>
                    <div>
                        <span class="stat-label" style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Constellation</span>
                        <strong class="stat-value" style="color: #1e90ff; font-size: 18px;">${data.constellation}</strong>
                    </div>
                    <div>
                        <span class="stat-label" style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">RA / DEC</span>
                        <strong class="stat-value stat-radec" style="color: #FFF; font-size: 14px;">${data.ra} <br> ${data.dec}</strong>
                    </div>
                </div>

                <div id="wd-extended-properties" style="display: none; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 20px; margin-top: 20px; padding-top: 20px; border-top: 1px dashed #444;"></div>

                <div id="wd-satellites-container" style="display: none; margin-top: 20px;">
                    <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Child Bodies / Satellites</span>
                    <div id="wd-satellites-list" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
                </div>

                ${galleryHtml}

                <div id="aladin-lite-div" style="width: 100%; height: 400px; margin-top: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #333;"></div>
            </div>
        `;

        resultsContainer.style.display = 'block';

        // Reset aladin instance for new search
        aladinInstance = null;
        fovLabelUpdateFn = null;

        // Store object coordinates for FOV overlay
        if (data.ra && data.dec && data.ra !== "N/A" && data.dec !== "N/A") {
            try {
                currentObjectCoords = { ra: raToDecDeg(data.ra), dec: decToDecDeg(data.dec) };
            } catch (e) {
                currentObjectCoords = null;
            }
        } else {
            currentObjectCoords = null;
        }

        // Wikidata query
        let wdQuery = data.searchId || data.id;
        let wdMatch = wdQuery.match(/^(NGC|IC)0*(\d+)$/i);
        if (wdMatch) {
            wdQuery = wdMatch[1].toUpperCase() + " " + parseInt(wdMatch[2], 10);
        }

        const sparqlQuery = `
        SELECT ?item ?itemLabel ?itemDescription ?heLabel ?distance ?mass ?radius ?redshift ?radVel (GROUP_CONCAT(DISTINCT ?childLabel; separator=", ") AS ?satellites)
        WHERE {
          ?item wdt:P528 "${wdQuery}" .
          OPTIONAL { ?item rdfs:label ?heLabel FILTER (LANG(?heLabel) = "he") }
          OPTIONAL { ?item wdt:P2583 ?distance . }
          OPTIONAL { ?item wdt:P2067 ?mass . }
          OPTIONAL { ?item wdt:P2120 ?radius . }
          OPTIONAL { ?item wdt:P1090 ?redshift . }
          OPTIONAL { ?item wdt:P2211 ?radVel . }
          OPTIONAL {
              ?child wdt:P397 ?item .
              ?child rdfs:label ?childLabel FILTER (LANG(?childLabel) = "en")
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        } GROUP BY ?item ?itemLabel ?itemDescription ?heLabel ?distance ?mass ?radius ?redshift ?radVel LIMIT 1
        `;

        const wdUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

        fetch(wdUrl, { headers: { 'Accept': 'application/sparql-results+json' } })
            .then(res => res.json())
            .then(wdData => {
                const results = wdData.results.bindings;
                const descEl = document.getElementById('wikidata-desc');
                const heTitleEl = document.getElementById('wd-hebrew-title');
                const mainTitleEl = document.getElementById('wd-main-title');
                const extPropsGrid = document.getElementById('wd-extended-properties');
                const satsContainer = document.getElementById('wd-satellites-container');
                const satsList = document.getElementById('wd-satellites-list');

                if (results && results.length > 0) {
                    const obj = results[0];

                    let displayTitle = (document.getElementById('explorer-input').value.toUpperCase().startsWith('M'))
                        ? document.getElementById('explorer-input').value.toUpperCase()
                        : data.id;

                    if (obj.itemLabel) mainTitleEl.innerHTML = `${displayTitle} <span style="font-size: 18px; color:#aaa; font-weight:normal;">- ${obj.itemLabel.value}</span>`;
                    if (obj.heLabel) heTitleEl.innerText = obj.heLabel.value;

                    if (obj.itemDescription) {
                        let rawDesc = obj.itemDescription.value;
                        let cleanDesc = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1);
                        descEl.innerHTML = `<i class="fa-solid fa-book-open"></i> <strong>Wikidata:</strong> ${cleanDesc}`;
                    } else {
                        descEl.style.display = 'none';
                    }

                    let extPropsHtml = '';
                    const formatSci = (val, unit) => {
                        let num = parseFloat(val);
                        if (num > 1e9) return (num / 1e9).toFixed(2) + " Billion " + unit;
                        if (num > 1e6) return (num / 1e6).toFixed(2) + " Million " + unit;
                        return num.toLocaleString() + " " + unit;
                    };

                    if (obj.distance) {
                        let lyVal = parseFloat(obj.distance.value) * 3.26;
                        extPropsHtml += `<div><span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Distance</span><strong style="color: #4CAF50; font-size: 16px;">${formatSci(lyVal, "ly")}</strong></div>`;
                    }
                    if (obj.radius) extPropsHtml += `<div><span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Radius</span><strong style="color: #4CAF50; font-size: 16px;">${formatSci(obj.radius.value, "ly")}</strong></div>`;
                    if (obj.mass) extPropsHtml += `<div><span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Mass</span><strong style="color: #4CAF50; font-size: 16px;">${parseFloat(obj.mass.value).toExponential(2)} M☉</strong></div>`;
                    if (obj.radVel) extPropsHtml += `<div><span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Radial Velocity</span><strong style="color: #4CAF50; font-size: 16px;">${parseFloat(obj.radVel.value).toFixed(2)} km/s</strong></div>`;
                    if (obj.redshift) extPropsHtml += `<div><span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Redshift</span><strong style="color: #4CAF50; font-size: 16px;">${parseFloat(obj.redshift.value).toFixed(5)}</strong></div>`;

                    if (extPropsHtml) {
                        extPropsGrid.innerHTML = extPropsHtml;
                        extPropsGrid.style.display = 'grid';
                    }

                    if (obj.satellites && obj.satellites.value) {
                        const satArray = obj.satellites.value.split(', ');
                        let satHtml = '';
                        satArray.forEach(sat => {
                            if (sat.trim() === '') return;
                            satHtml += `<span class="sat-badge" style="background: rgba(255,171,64,0.1); border: 1px solid rgba(255,171,64,0.5); color: #FFAB40; padding: 4px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; margin-bottom: 5px; display: inline-block; transition: 0.2s;" onclick="document.getElementById('explorer-input').value='${sat}'; document.getElementById('explorer-btn').click();">${sat}</span>`;
                        });
                        if (satHtml) {
                            satsList.innerHTML = satHtml;
                            satsContainer.style.display = 'block';
                            document.querySelectorAll('.sat-badge').forEach(badge => {
                                badge.addEventListener('mouseenter', e => { e.target.style.background = 'rgba(255,171,64,0.3)'; });
                                badge.addEventListener('mouseleave', e => { e.target.style.background = 'rgba(255,171,64,0.1)'; });
                            });
                        }
                    }

                } else {
                    const descEl = document.getElementById('wikidata-desc');
                    if (descEl) descEl.innerHTML = `<i class="fa-solid fa-database"></i> Wikidata: No extended data found.`;
                }
            })
            .catch(err => {
                console.error("Wikidata SPARQL fetch error:", err);
                const descEl = document.getElementById('wikidata-desc');
                if (descEl) descEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Wikidata: Network Error`;
            });

        // Initialize Aladin Lite
        if (window.A) {
            let targetCoords = data.id;
            if (data.ra && data.dec && data.ra !== "N/A" && data.dec !== "N/A") {
                let cleanRa = data.ra.replace('°', '').trim();
                let cleanDec = data.dec.replace('°', '').trim();
                targetCoords = `${cleanRa} ${cleanDec}`;
            }
            setTimeout(() => {
                A.init.then(() => {
                    aladinInstance = A.aladin('#aladin-lite-div', {
                        target: targetCoords,
                        fov: 1.0,
                        survey: "P/DSS2/color",
                        showReticle: true,
                        showZoomControl: true,
                        showFullscreenControl: true
                    });
                    // Draw FOV rectangle after Aladin finishes its first render
                    setTimeout(() => drawFovOverlay(), 400);
                }).catch(e => console.error("Aladin init error:", e));
            }, 100);
        }
    }

    function renderError(query) {
        loadingIndicator.style.display = 'none';
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: rgba(255, 50, 50, 0.1); border: 1px solid #ff4444; border-radius: 15px; margin-top: 20px;">
                <i class="fa-solid fa-satellite-dish" style="font-size: 40px; color: #ff4444; margin-bottom: 15px;"></i>
                <h3 style="color: #FFF;">Object Not Found</h3>
                <p style="color: #aaa;">We couldn't find "${query}" in the OpenNGC database or via SIMBAD. Please check the ID and try again.</p>
            </div>
            `;
        resultsContainer.style.display = 'block';
    }

    searchBtn.addEventListener('click', () => {
        searchCatalog(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCatalog(searchInput.value);
        }
    });

    // Handle deep linking for explorer ?q=
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        searchInput.value = q;
        setTimeout(() => searchCatalog(q), 500);
    }
});

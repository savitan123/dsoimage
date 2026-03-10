document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('explorer-input');
    const searchBtn = document.getElementById('explorer-btn');
    const resultsContainer = document.getElementById('explorer-results');
    const loadingIndicator = document.getElementById('explorer-loading');

    let galleryData = [];
    let targetsData = null; // We'll fetch this on demand or load it once

    // 1. Fetch the gallery index
    fetch('data/gallery.json')
        .then(res => res.json())
        .then(data => galleryData = data)
        .catch(err => console.error("Error loading gallery data:", err));

    // 2. Fetch OpenNGC targets (large file, maybe load once on page load)
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

        // Show loading
        resultsContainer.style.display = 'none';
        loadingIndicator.style.display = 'block';

        // Check Gallery first to prepare the "Match" badge
        const queryClean = query.replace(/\s+/g, '').toLowerCase();
        const galleryMatch = galleryData.find(item => {
            const titleMatch = item.title.toLowerCase() === query;
            const cleanMatch = item.cleanName.toLowerCase() === queryClean;
            const aliases = item.aliases ? item.aliases.split(',').map(s => s.trim().toLowerCase()) : [];
            const titles = item.title.toLowerCase().split(/[ \-]/);
            return titleMatch || cleanMatch || aliases.includes(query) || titles.includes(query);
        });

        // Step A: Check local OpenNGC Data (NGC, IC, M)
        let localMatch = null;

        // Messier mapping to OpenNGC equivalents
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
                dataLabel = query.toUpperCase(); // Retain "M1" display initially
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

        // Step B: If not found locally, query SIMBAD via TAP API for rich data
        const tapUrl = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
        // Escape single quotes for SQL ADQL
        const safeQuery = query.replace(/'/g, "''");
        // ADQL joins basic object properties with its flux properties based on exact ID match
        const adql = `SELECT TOP 1 b.main_id, b.otype, b.ra, b.dec, b.galdim_majaxis, b.galdim_minaxis, f.V, f.B FROM ident i JOIN basic b ON i.oidref = b.oid LEFT JOIN allfluxes f ON b.oid = f.oidref WHERE i.id = '${safeQuery}'`;

        const formData = new URLSearchParams();
        formData.append('request', 'doQuery');
        formData.append('lang', 'adql');
        formData.append('format', 'json');
        formData.append('query', adql);

        fetch(tapUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.data || data.data.length === 0) {
                    renderError(query);
                    return;
                }

                const row = data.data[0];
                // Format Data
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
            <div style="background: rgba(20, 20, 20, 0.9); border: 1px solid #333; border-radius: 15px; padding: 30px; margin-top: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #FFF; margin: 0; font-size: 28px;">${data.id}</h2>
                    <span style="background: #333; color: #aaa; padding: 4px 10px; border-radius: 12px; font-size: 12px; height: fit-content;">Source: ${data.source}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                    <div>
                        <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Identifier / Type</span>
                        <strong style="color: #FFAB40; font-size: 18px;">${data.type}</strong>
                    </div>
                    <div>
                        <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Magnitude</span>
                        <strong style="color: #FFF; font-size: 18px;">${data.mag}</strong>
                    </div>
                    <div>
                        <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Size (arcmin)</span>
                        <strong style="color: #FFF; font-size: 18px;">${data.size}</strong>
                    </div>
                    <div>
                        <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">Constellation</span>
                        <strong style="color: #1e90ff; font-size: 18px;">${data.constellation}</strong>
                    </div>
                    <div>
                        <span style="display: block; color: #888; font-size: 12px; text-transform: uppercase;">RA / DEC</span>
                        <strong style="color: #FFF; font-size: 14px;">${data.ra} <br> ${data.dec}</strong>
                    </div>
                </div>

                ${galleryHtml}
            </div>
        `;

        resultsContainer.style.display = 'block';
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
        // Wait briefly for datasets to fetch
        setTimeout(() => searchCatalog(q), 500);
    }
});

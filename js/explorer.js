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
        const galleryMatch = galleryData.find(item =>
            item.title.toLowerCase().includes(query) ||
            item.aliases.toLowerCase().includes(query) ||
            item.cleanName.toLowerCase() === query.replace(/\s+/g, '')
        );

        // Step A: Check local OpenNGC Data (NGC, IC)
        let localMatch = null;
        if (targetsData && (query.startsWith('ngc') || query.startsWith('ic'))) {
            // Clean query to match targets.json IDs (e.g., "ngc 224" -> "NGC0224")
            const isNgc = query.startsWith('ngc');
            const prefix = isNgc ? 'NGC' : 'IC';
            const numMatch = query.match(/\d+/);

            if (numMatch) {
                const numPadded = numMatch[0].padStart(4, '0');
                const searchId = prefix + numPadded;

                localMatch = targetsData.find(item => item.n === searchId);
            }
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

        // Step B: If not found locally, query SIMBAD via CDS Sesame
        // The Sesame API returns plain text, we parse it
        const encodedQuery = encodeURIComponent(query);
        const sesameUrl = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/SNVA?${encodedQuery}`;

        fetch(sesameUrl)
            .then(res => res.text())
            .then(xmlText => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                const resolver = xmlDoc.querySelector('Resolver');
                if (!resolver || !xmlDoc.querySelector('oname')) {
                    // Not found in SIMBAD either
                    renderError(query);
                    return;
                }

                // Extract data
                const oname = xmlDoc.querySelector('oname') ? xmlDoc.querySelector('oname').textContent : query.toUpperCase();
                const otype = xmlDoc.querySelector('otype') ? xmlDoc.querySelector('otype').textContent : "Unknown";
                // Pos
                const jradeg = xmlDoc.querySelector('jradeg') ? xmlDoc.querySelector('jradeg').textContent : "";
                const jdedeg = xmlDoc.querySelector('jdedeg') ? xmlDoc.querySelector('jdedeg').textContent : "";

                renderResults({
                    id: oname,
                    type: otype,
                    mag: "N/A (Simbad Base)",
                    size: "N/A",
                    constellation: "Resolved via Coords",
                    ra: jradeg ? parseFloat(jradeg).toFixed(4) + "°" : "N/A",
                    dec: jdedeg ? parseFloat(jdedeg).toFixed(4) + "°" : "N/A",
                    source: "SIMBAD (CDS)"
                }, galleryMatch);
            })
            .catch(err => {
                console.error("SIMBAD error:", err);
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

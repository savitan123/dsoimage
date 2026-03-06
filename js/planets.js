document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('planets-container');
    if (!container) return;

    try {
        // 1. Attempt to get local coordinates via IP lookup
        let lat = 31.05, lng = 34.85, city = "Tel Aviv"; // Default fallback
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

            const geoRes = await fetch("https://ipapi.co/json/", { signal: controller.signal });
            clearTimeout(timeoutId);

            if (geoRes.ok) {
                const geo = await geoRes.json();
                if (geo.latitude && geo.longitude) {
                    lat = geo.latitude;
                    lng = geo.longitude;
                    city = geo.city || geo.country_name || "your location";
                }
            }
        } catch (e) {
            console.log("Geolocation lookup failed or blocked. Using default coords.", e);
        }

        // 2. Compute planet data
        const bodies = [
            { id: 'Mercury', name: "Mercury", label: "fa-solid fa-circle", color: "#888" },
            { id: 'Venus', name: "Venus", label: "fa-solid fa-circle", color: "#e3bb76" },
            { id: 'Mars', name: "Mars", label: "fa-solid fa-circle", color: "#c1440e" },
            { id: 'Jupiter', name: "Jupiter", label: "fa-solid fa-circle", color: "#d39c7e" },
            { id: 'Saturn', name: "Saturn", label: "fa-solid fa-ring", color: "#eaddcf" },
            { id: 'Uranus', name: "Uranus", label: "fa-solid fa-circle", color: "#4b70dd" },
            { id: 'Neptune', name: "Neptune", label: "fa-solid fa-circle", color: "#274687" }
        ];

        const date = new Date();
        const observer = new Astronomy.Observer(lat, lng, 0);

        // Calculate sun position to know if it's dark
        const sunEqu = Astronomy.Equator('Sun', date, observer, true, true);
        const sunTopo = Astronomy.Horizon(date, observer, sunEqu.ra, sunEqu.dec, 'normal');
        const isDark = sunTopo.altitude < -6; // Civil twilight

        let html = `<div style="font-size: 11px; text-transform: uppercase; color: #777; margin-bottom: 8px; text-align: left; width: 100%;">Data calculated for ${city}</div>`;
        html += `<div style="display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: left; font-size: 13px;">`;

        for (const b of bodies) {
            // Equator + Constellation
            const equ_2000 = Astronomy.Equator(b.id, date, observer, true, true);
            const constel = Astronomy.Constellation(equ_2000.ra, equ_2000.dec);

            // Rise / Set
            let riseStr = "--:--", setStr = "--:--";
            try {
                // Direction: +1 for Rise, -1 for Set
                const nextRise = Astronomy.SearchRiseSet(b.id, observer, +1, date, 2);
                const nextSet = Astronomy.SearchRiseSet(b.id, observer, -1, date, 2);

                if (nextRise) {
                    riseStr = nextRise.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                if (nextSet) {
                    setStr = nextSet.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            } catch (calcErr) {
                console.warn(`Could not calculate rise/set for ${b.name} (happens near poles for some declinations)`);
            }

            // Altitude & Magnitude
            const topo = Astronomy.Horizon(date, observer, equ_2000.ra, equ_2000.dec, 'normal');
            const alt = topo.altitude;

            const ill = Astronomy.Illumination(b.id, date);
            const mag = ill ? ill.mag.toFixed(1) : "?";

            const isVisibleNow = alt > 0;
            // Best if visible AND it's dark
            let visIcon = '';
            let visStyle = '';

            if (isVisibleNow && isDark) {
                visIcon = `<i class="fa-solid fa-eye" style="color: #4CAF50;" title="Visible right now"></i>`;
                visStyle = `color: #fff; font-weight: bold;`;
            } else if (isVisibleNow && !isDark) {
                visIcon = `<i class="fa-solid fa-sun" style="color: #ddb21a;" title="In sky, but Sun is up"></i>`;
                visStyle = `color: #ddd;`;
            } else {
                visIcon = `<i class="fa-solid fa-moon" style="color: #444;" title="Below horizon"></i>`;
                visStyle = `color: #888;`;
            }

            html += `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 5px;">
               <div style="display: flex; align-items: center; gap: 8px; width: 30%;">
                   <i class="${b.label}" style="color: ${b.color}; width: 16px; text-align: center;"></i>
                   <span style="${visStyle}">${b.name}</span>
               </div>
               <div style="width: 15%; text-align: center;">${visIcon}</div>
               <div style="width: 25%; color: #aaa; text-align: center;" title="Rise / Set">
                   <i class="fa-solid fa-arrow-up" style="font-size: 9px;"></i> <span style="font-family: monospace;">${riseStr}</span><br>
                   <i class="fa-solid fa-arrow-down" style="font-size: 9px;"></i> <span style="font-family: monospace;">${setStr}</span>
               </div>
               <div style="width: 30%; color: #888; text-align: right; font-size: 11px;">
                   Mag: ${mag}<br>${constel.name}
               </div>
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Planets widget error:", err);
        container.innerHTML = `<div style="color: #d9534f; font-size: 14px;">Unavailable<br>Ad-blocker or calculation error.</div>`;
    }
});

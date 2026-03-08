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
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding: 8px 0; gap: 10px;">
               <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 90px; white-space: nowrap;">
                   <i class="${b.label}" style="color: ${b.color}; width: 16px; text-align: center;"></i>
                   <span style="${visStyle}">${b.name}</span>
               </div>
               <div style="flex: 0 0 40px; text-align: center;">${visIcon}</div>
               <div style="flex: 1.5; min-width: 100px; color: #aaa; text-align: center; white-space: nowrap;" title="Rise / Set">
                   <i class="fa-solid fa-arrow-up" style="font-size: 9px;"></i> <span style="font-family: monospace;">${riseStr}</span>
                   <span style="margin: 0 6px; color: #444;">|</span>
                   <i class="fa-solid fa-arrow-down" style="font-size: 9px;"></i> <span style="font-family: monospace;">${setStr}</span>
               </div>
               <div style="flex: 1; min-width: 90px; color: #888; text-align: right; font-size: 11px; white-space: nowrap;">
                   Mag: ${mag} <span style="margin: 0 4px; color: #444;">|</span> ${constel.name}
               </div>
            </div>`;
        }

        html += `</div>`;
        // Render Planets
        const container = document.getElementById('planets-container');
        if (container) container.innerHTML = html;

        // Custom Rise/Set math for deep sky
        function getRiseSet(raHours, decDeg, latDeg, lngDeg, currentDate) {
            const dec = decDeg * Math.PI / 180;
            const lat = latDeg * Math.PI / 180;
            const cosHA = -Math.tan(dec) * Math.tan(lat);

            if (cosHA < -1) return { status: 'circumpolar', rise: '--:--', set: '--:--' };
            if (cosHA > 1) return { status: 'never_rises', rise: '--:--', set: '--:--' };

            const HA_rad = Math.acos(cosHA);
            const HA_hours = HA_rad * 180 / Math.PI / 15;
            const LST = Astronomy.SiderealTime(currentDate) + lngDeg / 15;

            let transitTimeHours = (raHours - LST + 24) % 24;
            transitTimeHours *= 0.99727; // Sidereal to Solar time

            let riseTimeHours = transitTimeHours - HA_hours * 0.99727;
            let setTimeHours = transitTimeHours + HA_hours * 0.99727;

            // Normalize to current day
            const addHours = (hours) => {
                const d = new Date(currentDate.getTime());
                d.setHours(d.getHours() + hours);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            return {
                status: 'ok',
                rise: addHours(riseTimeHours),
                set: addHours(setTimeHours)
            };
        }

        const currentMonth = date.getMonth();
        const monthlyConstellations = [
            { name: "Orion", ra: 5.5, dec: 5 },
            { name: "Canis Major", ra: 7, dec: -20 },
            { name: "Leo", ra: 10.5, dec: 15 },
            { name: "Ursa Major", ra: 11.5, dec: 55 },
            { name: "Virgo", ra: 13, dec: 0 },
            { name: "Scorpius", ra: 16.5, dec: -30 },
            { name: "Sagittarius", ra: 19, dec: -25 },
            { name: "Cygnus", ra: 20.5, dec: 40 },
            { name: "Pegasus", ra: 22.5, dec: 20 },
            { name: "Andromeda", ra: 1, dec: 40 },
            { name: "Cassiopeia", ra: 1, dec: 60 },
            { name: "Taurus", ra: 4.5, dec: 15 }
        ];

        const monthlyDSOs = [
            { name: "Orion Nebula (M42)", ra: 5.58, dec: -5.39, type: "Nebula", mag: "4.0" },
            { name: "Rosette Nebula (NGC 2237)", ra: 6.53, dec: 4.98, type: "Nebula", mag: "9.0" },
            { name: "Leo Triplet (M65, 66)", ra: 11.31, dec: 13.09, type: "Galaxy Group", mag: "8.9" },
            { name: "Bode's Galaxy (M81)", ra: 9.92, dec: 69.06, type: "Galaxy", mag: "6.9" },
            { name: "Sombrero Galaxy (M104)", ra: 12.66, dec: -11.62, type: "Galaxy", mag: "8.0" },
            { name: "Lagoon Nebula (M8)", ra: 18.06, dec: -24.38, type: "Nebula", mag: "6.0" },
            { name: "Eagle Nebula (M16)", ra: 18.31, dec: -13.81, type: "Nebula", mag: "6.4" },
            { name: "Veil Nebula", ra: 20.8, dec: 31.0, type: "Supernova Remnant", mag: "7.0" },
            { name: "Dumbbell Nebula (M27)", ra: 19.99, dec: 22.72, type: "Planetary Nebula", mag: "7.5" },
            { name: "Andromeda Galaxy (M31)", ra: 0.71, dec: 41.26, type: "Galaxy", mag: "3.4" },
            { name: "Pleiades (M45)", ra: 3.78, dec: 24.11, type: "Star Cluster", mag: "1.6" },
            { name: "Crab Nebula (M1)", ra: 5.57, dec: 22.01, type: "Supernova Remnant", mag: "8.4" }
        ];

        // Render Constellation
        const constel = monthlyConstellations[currentMonth];
        const constelTimes = getRiseSet(constel.ra, constel.dec, lat, lng, date);
        const constelTopo = Astronomy.Horizon(date, observer, constel.ra, constel.dec, 'normal');

        // Render DSO
        const dso = monthlyDSOs[currentMonth];
        const dsoTimes = getRiseSet(dso.ra, dso.dec, lat, lng, date);
        const dsoTopo = Astronomy.Horizon(date, observer, dso.ra, dso.dec, 'normal');

        const blockStyle = "display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding: 12px 0; gap: 10px;";

        function formatTimes(times) {
            if (times.status === 'circumpolar') return `<span style="color:#5E8C7F;">Always Visible (Circumpolar)</span>`;
            if (times.status === 'never_rises') return `<span style="color:#d9534f;">Below Horizon (Never Rises)</span>`;
            return `<i class="fa-solid fa-arrow-up" style="font-size: 9px;"></i> <span style="font-family: monospace;">${times.rise}</span> <span style="margin: 0 6px; color: #444;">|</span> <i class="fa-solid fa-arrow-down" style="font-size: 9px;"></i> <span style="font-family: monospace;">${times.set}</span>`;
        }

        const constelHtml = `
            <div style="${blockStyle}">
               <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 90px; white-space: nowrap;">
                   <i class="fa-solid fa-star" style="color: #FFAB40; width: 16px; text-align: center;"></i>
                   <span style="color: #fff; font-weight: bold; font-size: 16px;">${constel.name}</span>
               </div>
               <div style="flex: 1.5; min-width: 100px; color: #aaa; text-align: center; white-space: nowrap;">
                   ${formatTimes(constelTimes)}
               </div>
               <div style="flex: 1; min-width: 90px; color: #888; text-align: right; font-size: 12px; white-space: nowrap;">
                   Current Alt: ${constelTopo.altitude.toFixed(1)}°
               </div>
            </div>`;

        const dsoHtml = `
            <div style="${blockStyle}">
               <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 120px; white-space: nowrap;">
                   <i class="fa-solid fa-camera-retro" style="color: #FFAB40; width: 16px; text-align: center;"></i>
                   <span style="color: #fff; font-weight: bold; font-size: 16px;">${dso.name}</span>
               </div>
               <div style="flex: 1.5; min-width: 100px; color: #aaa; text-align: center; white-space: nowrap;">
                   ${formatTimes(dsoTimes)}
               </div>
               <div style="flex: 1; min-width: 90px; color: #888; text-align: right; font-size: 12px; white-space: nowrap;">
                   Mag: ${dso.mag} <span style="margin: 0 4px; color: #444;">|</span> ${dso.type}
               </div>
            </div>`;

        document.getElementById('constellation-container').innerHTML = constelHtml;
        document.getElementById('dso-container').innerHTML = dsoHtml;

    } catch (err) {
        console.error("Widget error:", err);
        const errHtml = `<div style="color: #d9534f; font-size: 14px;">Unavailable<br>Ad-blocker or calculation error.</div>`;
        document.getElementById('planets-container').innerHTML = errHtml;
        document.getElementById('constellation-container').innerHTML = errHtml;
        document.getElementById('dso-container').innerHTML = errHtml;
    }
});

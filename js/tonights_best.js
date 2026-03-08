document.addEventListener('DOMContentLoaded', async () => {
    // 1. Geography
    let lat = 31.05, lng = 34.85, city = "Tel Aviv";
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.latitude && geo.longitude) {
                lat = geo.latitude; lng = geo.longitude; city = geo.city || geo.country_name || "your location";
            }
        }
    } catch (e) { console.log(e); }

    const date = new Date();
    const observer = new Astronomy.Observer(lat, lng, 0);

    // Helpers
    const sunEqu = Astronomy.Equator('Sun', date, observer, true, true);
    const sunTopo = Astronomy.Horizon(date, observer, sunEqu.ra, sunEqu.dec, 'normal');
    const isDark = sunTopo.altitude < -6;

    // PLANETS WIDGET (Preserved)
    const renderPlanets = () => {
        const container = document.getElementById('planets-container');
        if (!container) return;
        const bodies = [
            { id: 'Mercury', name: "Mercury", label: "fa-solid fa-circle", color: "#888" },
            { id: 'Venus', name: "Venus", label: "fa-solid fa-circle", color: "#e3bb76" },
            { id: 'Mars', name: "Mars", label: "fa-solid fa-circle", color: "#c1440e" },
            { id: 'Jupiter', name: "Jupiter", label: "fa-solid fa-circle", color: "#d39c7e" },
            { id: 'Saturn', name: "Saturn", label: "fa-solid fa-ring", color: "#eaddcf" },
            { id: 'Uranus', name: "Uranus", label: "fa-solid fa-circle", color: "#4b70dd" },
            { id: 'Neptune', name: "Neptune", label: "fa-solid fa-circle", color: "#274687" }
        ];

        let html = `<div style="font-size: 11px; text-transform: uppercase; color: #777; margin-bottom: 8px; text-align: left; width: 100%;">Data calculated for ${city}</div>`;
        html += `<div style="display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: left; font-size: 13px;">`;

        for (const b of bodies) {
            const equ_2000 = Astronomy.Equator(b.id, date, observer, true, true);
            const constel = Astronomy.Constellation(equ_2000.ra, equ_2000.dec);
            let riseStr = "--:--", setStr = "--:--";
            try {
                const nextRise = Astronomy.SearchRiseSet(b.id, observer, +1, date, 2);
                const nextSet = Astronomy.SearchRiseSet(b.id, observer, -1, date, 2);
                if (nextRise) riseStr = nextRise.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (nextSet) setStr = nextSet.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (err) { }

            const topo = Astronomy.Horizon(date, observer, equ_2000.ra, equ_2000.dec, 'normal');
            const ill = Astronomy.Illumination(b.id, date);
            const mag = ill ? ill.mag.toFixed(1) : "?";
            const isVisibleNow = topo.altitude > 0;

            let visIcon = '', visStyle = '';
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
        container.innerHTML = html;
    };
    renderPlanets();

    // CUSTOM RISE/SET MATH
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

        const pad = n => n.toString().padStart(2, '0');
        const formatTime = (h) => {
            let offset = new Date(currentDate.getTime() + h * 3600 * 1000);
            return pad(offset.getHours()) + ":" + pad(offset.getMinutes());
        };
        return { status: 'ok', rise: formatTime(riseTimeHours), set: formatTime(setTimeHours) };
    }

    // NIGHT VISIBILITY FILTER (20:00 to 05:00 next day)
    function checkNightVisibility(raHours, decDeg) {
        let maxAlt = -90;
        let isVisible = false;

        let now = new Date();
        let baseDate = new Date(now);
        if (now.getHours() < 12) baseDate.setDate(baseDate.getDate() - 1);

        for (let h = 0; h <= 9; h++) {
            let chk = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 20 + h, 0, 0);
            let topo = Astronomy.Horizon(chk, observer, raHours, decDeg, 'normal');
            if (topo.altitude > maxAlt) maxAlt = topo.altitude;
            if (topo.altitude >= 10) isVisible = true; // threshold is 10 deg
        }
        return { isVisible, maxAlt };
    }

    // CATALOGS
    const constellations = [
        { name: "Andromeda", ra: 1, dec: 40 }, { name: "Aquarius", ra: 22.5, dec: -10 },
        { name: "Aquila", ra: 19.5, dec: 5 }, { name: "Aries", ra: 2.5, dec: 20 },
        { name: "Auriga", ra: 6, dec: 40 }, { name: "Bootes", ra: 14.5, dec: 30 },
        { name: "Cancer", ra: 8.5, dec: 20 }, { name: "Canis Major", ra: 7, dec: -20 },
        { name: "Capricornus", ra: 21, dec: -20 }, { name: "Carina", ra: 9, dec: -60 },
        { name: "Cassiopeia", ra: 1, dec: 60 }, { name: "Centaurus", ra: 13, dec: -50 },
        { name: "Cepheus", ra: 22, dec: 70 }, { name: "Cetus", ra: 1.5, dec: -10 },
        { name: "Corona Borealis", ra: 15.5, dec: 30 }, { name: "Corvus", ra: 12.5, dec: -20 },
        { name: "Cygnus", ra: 20.5, dec: 40 }, { name: "Draco", ra: 17, dec: 65 },
        { name: "Eridanus", ra: 3.5, dec: -30 }, { name: "Gemini", ra: 7, dec: 20 },
        { name: "Hercules", ra: 17, dec: 30 }, { name: "Leo", ra: 10.5, dec: 15 },
        { name: "Libra", ra: 15, dec: -15 }, { name: "Lyra", ra: 19, dec: 40 },
        { name: "Ophiuchus", ra: 17, dec: 0 }, { name: "Orion", ra: 5.5, dec: 5 },
        { name: "Pegasus", ra: 22.5, dec: 20 }, { name: "Perseus", ra: 3, dec: 45 },
        { name: "Pisces", ra: 1, dec: 10 }, { name: "Puppis", ra: 7.5, dec: -30 },
        { name: "Sagittarius", ra: 19, dec: -25 }, { name: "Scorpius", ra: 16.5, dec: -30 },
        { name: "Taurus", ra: 4.5, dec: 15 }, { name: "Ursa Major", ra: 11.5, dec: 55 },
        { name: "Ursa Minor", ra: 15, dec: 75 }, { name: "Virgo", ra: 13, dec: 0 }
    ];

    const dsos = [
        { name: "Andromeda Galaxy (M31)", ra: 0.71, dec: 41.26, type: "Galaxy", mag: "3.4" },
        { name: "Orion Nebula (M42)", ra: 5.58, dec: -5.39, type: "Nebula", mag: "4.0" },
        { name: "Pleiades (M45)", ra: 3.78, dec: 24.11, type: "Star Cluster", mag: "1.6" },
        { name: "Great Hercules Cluster (M13)", ra: 16.69, dec: 36.46, type: "Cluster", mag: "5.8" },
        { name: "Lagoon Nebula (M8)", ra: 18.06, dec: -24.38, type: "Nebula", mag: "6.0" },
        { name: "Trifid Nebula (M20)", ra: 18.04, dec: -22.49, type: "Nebula", mag: "6.3" },
        { name: "Eagle Nebula (M16)", ra: 18.31, dec: -13.81, type: "Nebula", mag: "6.4" },
        { name: "Omega Nebula (M17)", ra: 18.34, dec: -16.18, type: "Nebula", mag: "6.0" },
        { name: "Dumbbell Nebula (M27)", ra: 19.99, dec: 22.72, type: "Planetary Nebula", mag: "7.5" },
        { name: "Ring Nebula (M57)", ra: 18.89, dec: 33.03, type: "Planetary Nebula", mag: "8.8" },
        { name: "Crab Nebula (M1)", ra: 5.57, dec: 22.01, type: "Supernova Remnant", mag: "8.4" },
        { name: "Whirlpool Galaxy (M51)", ra: 13.49, dec: 47.19, type: "Galaxy", mag: "8.4" },
        { name: "Pinwheel Galaxy (M101)", ra: 14.05, dec: 54.34, type: "Galaxy", mag: "7.9" },
        { name: "Bode's Galaxy (M81)", ra: 9.92, dec: 69.06, type: "Galaxy", mag: "6.9" },
        { name: "Cigar Galaxy (M82)", ra: 9.92, dec: 69.67, type: "Galaxy", mag: "8.4" },
        { name: "Sombrero Galaxy (M104)", ra: 12.66, dec: -11.62, type: "Galaxy", mag: "8.0" },
        { name: "Triangulum Galaxy (M33)", ra: 1.56, dec: 30.66, type: "Galaxy", mag: "5.7" },
        { name: "Rosette Nebula (NGC 2237)", ra: 6.53, dec: 4.98, type: "Nebula", mag: "9.0" },
        { name: "North America Nebula (NGC 7000)", ra: 20.98, dec: 44.33, type: "Nebula", mag: "4.0" },
        { name: "Veil Nebula", ra: 20.76, dec: 30.71, type: "Supernova Remnant", mag: "7.0" },
        { name: "Heart Nebula (IC 1805)", ra: 2.55, dec: 61.45, type: "Nebula", mag: "6.5" },
        { name: "Soul Nebula (IC 1848)", ra: 2.85, dec: 60.41, type: "Nebula", mag: "6.5" },
        { name: "Carina Nebula (NGC 3372)", ra: 10.74, dec: -59.87, type: "Nebula", mag: "1.0" },
        { name: "Omega Centauri (NGC 5139)", ra: 13.44, dec: -47.47, type: "Cluster", mag: "3.9" },
        { name: "Centaurus A (NGC 5128)", ra: 13.42, dec: -43.01, type: "Galaxy", mag: "6.8" },
        { name: "Horsehead Nebula", ra: 5.68, dec: -2.45, type: "Dark Nebula", mag: "7.3" }
    ];

    const blockStyle = "display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding: 12px 0; gap: 10px;";

    function formatTimes(times) {
        if (times.status === 'circumpolar') return `<span style="color:#5E8C7F;">Circumpolar</span>`;
        if (times.status === 'never_rises') return `<span style="color:#d9534f;">Below Horizon</span>`;
        return `<i class="fa-solid fa-arrow-up" style="font-size: 9px;"></i> <span style="font-family: monospace;">${times.rise}</span> <span style="margin: 0 6px; color: #444;">|</span> <i class="fa-solid fa-arrow-down" style="font-size: 9px;"></i> <span style="font-family: monospace;">${times.set}</span>`;
    }

    // Process & Render Constellations
    const cContainer = document.getElementById('constellation-container');
    if (cContainer) {
        let visibleConstels = constellations.map(c => {
            const vis = checkNightVisibility(c.ra, c.dec);
            return { ...c, isVisible: vis.isVisible, maxAlt: vis.maxAlt };
        }).filter(c => c.isVisible).sort((a, b) => b.maxAlt - a.maxAlt);

        if (visibleConstels.length === 0) {
            cContainer.innerHTML = `<div style="padding: 20px; color: #888;">No constellations meet the criteria tonight.</div>`;
        } else {
            cContainer.innerHTML = '';
            visibleConstels.forEach(c => {
                const times = getRiseSet(c.ra, c.dec, lat, lng, date);
                const topo = Astronomy.Horizon(date, observer, c.ra, c.dec, 'normal');
                let nowStr = topo.altitude > 0 ? `Alt: ${topo.altitude.toFixed(0)}°` : "Below Horizon";
                cContainer.innerHTML += `
                <div style="${blockStyle}">
                   <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 90px; white-space: nowrap;">
                       <i class="fa-solid fa-star" style="color: #FFAB40; width: 16px; text-align: center;"></i>
                       <span style="color: #fff; font-weight: bold; font-size: 15px;">${c.name}</span>
                   </div>
                   <div style="flex: 1.5; min-width: 100px; color: #aaa; text-align: center; white-space: nowrap;">
                       ${formatTimes(times)}
                   </div>
                   <div style="flex: 1; min-width: 90px; color: #888; text-align: right; font-size: 11px; white-space: nowrap;">
                       Max: ${c.maxAlt.toFixed(0)}° <span style="margin: 0 4px; color: #444;">|</span> ${nowStr}
                   </div>
                </div>`;
            });
        }
    }

    // Process & Render DSOs
    const dContainer = document.getElementById('dso-container');
    if (dContainer) {
        let visibleDSOs = dsos.map(d => {
            const vis = checkNightVisibility(d.ra, d.dec);
            return { ...d, isVisible: vis.isVisible, maxAlt: vis.maxAlt };
        }).filter(d => d.isVisible).sort((a, b) => b.maxAlt - a.maxAlt);

        if (visibleDSOs.length === 0) {
            dContainer.innerHTML = `<div style="padding: 20px; color: #888;">No DSOs meet the criteria tonight.</div>`;
        } else {
            dContainer.innerHTML = '';
            visibleDSOs.forEach(d => {
                const times = getRiseSet(d.ra, d.dec, lat, lng, date);
                const topo = Astronomy.Horizon(date, observer, d.ra, d.dec, 'normal');
                let nowStr = topo.altitude > 0 ? `Alt: ${topo.altitude.toFixed(0)}°` : "Below Horizon";
                dContainer.innerHTML += `
                <div style="${blockStyle}">
                   <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 120px; white-space: nowrap;">
                       <i class="fa-solid fa-camera-retro" style="color: #FFAB40; width: 16px; text-align: center;"></i>
                       <span style="color: #fff; font-weight: bold; font-size: 15px;">${d.name}</span>
                   </div>
                   <div style="flex: 1.5; min-width: 100px; color: #aaa; text-align: center; white-space: nowrap;">
                       ${formatTimes(times)}
                   </div>
                   <div style="flex: 1; min-width: 120px; color: #888; text-align: right; font-size: 11px; white-space: nowrap;">
                       Mg: ${d.mag} <span style="margin: 0 4px; color: #444;">|</span> ${d.type} <br/> Max: ${d.maxAlt.toFixed(0)}°
                   </div>
                </div>`;
            });
        }
    }

});

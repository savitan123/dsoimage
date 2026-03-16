document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Leaflet Map
    const map = L.map('issMap', {
        minZoom: 2,
        maxZoom: 18
    }).setView([0, 0], 3);

    // 2. CartoDB Voyager tiles — bright colors, English-only labels worldwide
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Day/Night terminator layer — dark overlay simulates night side
    const terminator = L.terminator({
        fillColor: '#000820',
        fillOpacity: 0.55,
        color: '#1a3a6a',
        weight: 1.5
    }).addTo(map);

    // Refresh terminator every 60 seconds
    setInterval(() => terminator.setTime(new Date()), 60000);

    // 4. Create Custom ISS Marker Icon
    const issIcon = L.divIcon({
        className: 'custom-iss-marker',
        html: '<div style="background: rgba(0,0,0,0.5); padding: 8px; border-radius: 50%; border: 2px solid #eedc82; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; box-shadow: 0 0 15px rgba(238,220,130,0.6);"><i class="fa-solid fa-satellite" style="color: #eedc82; font-size: 20px;"></i></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    const issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    issMarker.bindPopup("<b>International Space Station</b><br>Translating at ~27,600 km/h");

    // 5. Red dashed breadcrumb trail
    const pathCoords = [];
    const orbitLine = L.polyline(pathCoords, {
        color: '#E53935',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(map);

    // 6. DOM Elements for stats
    const elLat = document.getElementById('iss-lat');
    const elLon = document.getElementById('iss-lon');
    const elAlt = document.getElementById('iss-alt');
    const elVel = document.getElementById('iss-vel');

    let isFirstLoad = true;

    // 7. Fetch Function
    async function fetchISSLocation() {
        try {
            const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
            if (!response.ok) throw new Error("API request failed");

            const data = await response.json();

            const lat = data.latitude;
            const lon = data.longitude;
            const alt = data.altitude; // in km
            const vel = data.velocity; // in km/h

            // Update DOM
            elLat.innerHTML = `${lat.toFixed(4)}&deg;`;
            elLon.innerHTML = `${lon.toFixed(4)}&deg;`;
            elAlt.textContent = `${Math.round(alt)} km`;
            elVel.textContent = `${Math.round(vel).toLocaleString()} km/h`;

            // Update Marker Position
            issMarker.setLatLng([lat, lon]);

            // Add to breadcrumb path
            pathCoords.push([lat, lon]);
            if (pathCoords.length > 200) pathCoords.shift();
            orbitLine.setLatLngs(pathCoords);

            // On first load, pan map to ISS position
            if (isFirstLoad) {
                map.setView([lat, lon], 3);
                isFirstLoad = false;
            } else {
                const bounds = map.getBounds();
                const pad = bounds.pad(-0.2);
                if (!pad.contains([lat, lon])) {
                    // auto-pan disabled — let user freely drag
                }
            }

        } catch (error) {
            console.error("Error fetching ISS data:", error);
            if (isFirstLoad) {
                elLat.textContent = "Error";
                elLon.textContent = "Connecting";
            }
        }
    }

    // 8. Initial Fetch + poll every 3 seconds
    fetchISSLocation();
    setInterval(fetchISSLocation, 3000);
});

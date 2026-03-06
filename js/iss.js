document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Leaflet Map
    // We center it initially on 0,0 with zoom level 3
    const map = L.map('issMap', {
        minZoom: 2,
        maxZoom: 7
    }).setView([0, 0], 3);

    // 2. Add Dark Mode OpenStreetMap Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // 3. Create Custom ISS Marker Icon
    const issIcon = L.icon({
        // Using a built-in emoji/svg or generic marker is fine, but let's try to make it look cool
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
    });

    const issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

    // Add a popup that shows when clicked
    issMarker.bindPopup("<b>International Space Station</b><br>Translating at ~27,600 km/h");

    // 4. Create an orbit path line (optional cool feature)
    // We won't draw the whole orbit, but we can draw a breadcrumb trail
    const pathCoords = [];
    const orbitLine = L.polyline(pathCoords, {
        color: '#eedc82',
        weight: 3,
        opacity: 0.5,
        dashArray: '5, 10'
    }).addTo(map);

    // 5. DOM Elements for stats
    const elLat = document.getElementById('iss-lat');
    const elLon = document.getElementById('iss-lon');
    const elAlt = document.getElementById('iss-alt');
    const elVel = document.getElementById('iss-vel');

    let isFirstLoad = true;

    // 6. Fetch Function
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

            // Keep path from getting infinitely huge (e.g. keep last 200 points)
            if (pathCoords.length > 200) {
                pathCoords.shift();
            }
            orbitLine.setLatLngs(pathCoords);

            // On first load, smoothly pan the map to center the ISS
            if (isFirstLoad) {
                map.setView([lat, lon], 3);
                isFirstLoad = false;
            } else {
                // Determine if we want map to auto-follow. 
                // Many users find forced pan annoying when they zoom/drag. 
                // Let's only pan if ISS gets too close to edge of current view.
                const bounds = map.getBounds();
                const pad = bounds.pad(-0.2); // 20% inner padding
                if (!pad.contains([lat, lon])) {
                    // map.panTo([lat, lon], { animate: true, duration: 1.0 });
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

    // 7. Initial Fetch
    fetchISSLocation();

    // 8. Poll every 3 seconds (as requested, within wheretheiss.at rate limits)
    setInterval(fetchISSLocation, 3000);
});

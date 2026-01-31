
const meteorShowers = [
    { name: "Quadrantids", month: 0, day: 3 },
    { name: "Lyrids", month: 3, day: 22 },
    { name: "Eta Aquariids", month: 4, day: 6 },
    { name: "Perseids", month: 7, day: 12 }, // Aug 12
    { name: "Draconids", month: 9, day: 8 },
    { name: "Orionids", month: 9, day: 21 },
    { name: "Leonids", month: 10, day: 17 },
    { name: "Geminids", month: 11, day: 14 },
    { name: "Ursids", month: 11, day: 22 }
];

// Simple "Best Target" suggestions based on Month (Northern Hemisphere)
// Detailed "Best Target" suggestions based on Month
const monthlyData = {
    0: { // January
        imaging: ["Orion Nebula (M42)", "Rosette Nebula (C49)", "Horsehead Nebula", "M78"],
        observing: ["Pleiades (M45)", "Double Cluster", "Jupiter", "Orion Nebula"]
    },
    1: { // February
        imaging: ["Rosette Nebula", "Christmas Tree Cluster", "Cone Nebula", "M81 & M82"],
        observing: ["M41 (Little Beehive)", "M46 & M47", "Orion Nebula"]
    },
    2: { // March
        imaging: ["Leo Triplet (M65/M66/NGC 3628)", "Markarian's Chain", "M106"],
        observing: ["Cancer (M44 Beehive)", "Ghost of Jupiter (NGC 3242)"]
    },
    3: { // April
        imaging: ["Markarian's Chain", "Whirlpool Galaxy (M51)", "Pinwheel Galaxy (M101)"],
        observing: ["M3 (Globular Cluster)", "M53", "Coma Berenices Cluster"]
    },
    4: { // May
        imaging: ["Whirlpool Galaxy (M51)", "M101", "Sunflower Galaxy (M63)"],
        observing: ["M13 (Hercules Cluster)", "M92", "Ring Nebula (M57)"]
    },
    5: { // June
        imaging: ["Lagoon Nebula (M8)", "Trifid Nebula (M20)", "Eagle Nebula (M16)"],
        observing: ["M13", "M27 (Dumbbell)", "Albireo (Double Star)"]
    },
    6: { // July
        imaging: ["Eagle Nebula (M16)", "Omega Nebula (M17)", "North America Nebula"],
        observing: ["Saturn", "M22", "M11 (Wild Duck)"]
    },
    7: { // August
        imaging: ["Andromeda Galaxy (M31)", "Elephant's Trunk", "Heart & Soul Nebulae"],
        observing: ["Perseids Meteor Shower", "Saturn", "M31"]
    },
    8: { // September
        imaging: ["Triangulum Galaxy (M33)", "Pacman Nebula", "Bubble Nebula"],
        observing: ["Jupiter", "Pegasus Cluster (M15)", "Double Cluster"]
    },
    9: { // October
        imaging: ["Pleiades (M45)", "California Nebula", "NGC 7331"],
        observing: ["Jupiter", "Uranus", "M31 Andromeda"]
    },
    10: { // November
        imaging: ["California Nebula", "Hyades", "M78", "Witch Head Nebula"],
        observing: ["Pleiades", "M38", "M36"]
    },
    11: { // December
        imaging: ["Horsehead Nebula", "Orion Nebula (M42)", "Running Man", "M1"],
        observing: ["Geminids Meteor Shower", "M35", "M37"]
    }
};

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar(currentDate);

    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Close Modal Logic
    document.getElementById('close-details-modal').addEventListener('click', () => {
        document.getElementById('day-details-modal').style.display = 'none';
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target == document.getElementById('day-details-modal')) {
            document.getElementById('day-details-modal').style.display = 'none';
        }
    });
});

function renderCalendar(date) {
    const monthYear = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11

    // Formatting locale
    monthYear.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    const realToday = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');

        // Add click handler for details
        cell.addEventListener('click', () => openDayModal(year, month, day));

        // Check if this is today
        if (day === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) {
            cell.classList.add('today');
        }

        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-number');
        dayHeader.innerText = day;
        cell.appendChild(dayHeader);

        // Moon Phase Calculation
        const moonAge = getMoonAge(year, month, day);
        if (moonAge < 1 || moonAge > 28) {
            const moon = document.createElement('div');
            moon.classList.add('event-marker', 'new-moon');
            moon.title = "New Moon";
            moon.innerHTML = '🌑';
            cell.appendChild(moon);
        } else if (moonAge >= 14 && moonAge <= 16) {
            const moon = document.createElement('div');
            moon.classList.add('event-marker', 'full-moon');
            moon.title = "Full Moon";
            moon.innerHTML = '🌕';
            cell.appendChild(moon);
        }

        // Meteor Showers
        const shower = meteorShowers.find(s => s.month === month && s.day === day);
        if (shower) {
            const meteor = document.createElement('div');
            meteor.classList.add('event-marker', 'meteor');
            meteor.innerHTML = '🌠 ' + shower.name;
            cell.appendChild(meteor);
        }

        // Best Target removed as per user request


        // Check for planned range
        if (plannedRange && plannedRange.start && plannedRange.end) {
            const checkDate = new Date(year, month, day);
            // Normalize time
            checkDate.setHours(12, 0, 0, 0);
            const s = new Date(plannedRange.start); s.setHours(12, 0, 0, 0);
            const e = new Date(plannedRange.end); e.setHours(12, 0, 0, 0);

            if (checkDate >= s && checkDate <= e) {
                cell.classList.add('planned-day');
            }
        }

        calendarGrid.appendChild(cell);
    }

    // Calculate ISS Passes (Async)
    addISSPasses(year, month);
}

let plannedRange = null;

window.highlightPlannedSession = function (startStr, endStr) {
    if (!startStr || !endStr) {
        plannedRange = null;
    } else {
        plannedRange = {
            start: new Date(startStr),
            end: new Date(endStr)
        };
    }
    // Re-render current view
    renderCalendar(currentDate);
}

function openDayModal(year, month, day) {
    const modal = document.getElementById('day-details-modal');
    const dateTitle = document.getElementById('details-date');
    const imgList = document.getElementById('imaging-list');
    const obsList = document.getElementById('observing-list');

    const d = new Date(year, month, day);
    dateTitle.innerText = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    imgList.innerHTML = '';
    obsList.innerHTML = '';

    // Data for the month
    const data = monthlyData[month];

    data.imaging.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        imgList.appendChild(li);
    });

    data.observing.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        obsList.appendChild(li);
    });

    // Add special events like meteors/moon for this specific day
    const moonAge = getMoonAge(year, month, day);
    if (moonAge < 1 || moonAge > 28) {
        const li = document.createElement('li');
        li.innerHTML = "🌑 <strong>New Moon</strong> - Perfect for Deep Sky!";
        obsList.prepend(li); // Add to top
    } else if (moonAge >= 14 && moonAge <= 16) {
        const li = document.createElement('li');
        li.innerHTML = "🌕 <strong>Full Moon</strong> - Bright sky, focus on planets.";
        obsList.prepend(li);
    }

    const shower = meteorShowers.find(s => s.month === month && s.day === day);
    if (shower) {
        const li = document.createElement('li');
        li.innerHTML = `🌠 <strong>${shower.name} Peak</strong>`;
        obsList.prepend(li);
    }

    modal.style.display = 'block';
}


// ISS Pass Calculation
async function addISSPasses(year, month) {
    if (!window.satellite) return;

    // Default location if not set
    const lat = window.userLat || 32.0853;
    const lon = window.userLon || 34.7818;

    try {
        // Fetch TLE from CelesTrak (CORS enabled)
        const resp = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE');
        if (!resp.ok) return;
        const text = await resp.text();
        const lines = text.split('\n');
        // TLE format check
        let tle1 = "", tle2 = "";
        for (let l of lines) {
            if (l.startsWith('1 ')) tle1 = l.trim();
            if (l.startsWith('2 ')) tle2 = l.trim();
        }
        if (!tle1 || !tle2) return;

        const satrec = satellite.twoline2satrec(tle1, tle2);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Loop through days
        for (let d = 1; d <= daysInMonth; d++) {
            // Check evening (17:00 - 23:00) and morning (03:00 - 06:00) passes?
            // Simplified: Check every 5 mins for the whole 24h? (Or just night)
            // To save perf, check 18:00 to 06:00

            // We need to find the specific day cell to append to
            // This is DOM heavy lookup, better to modify monthlyData? 
            // Better: loop days, calculate, then find cell.

            const passes = [];

            // Sampling start: Day 12:00 PM -> Next Day 12:00 PM ? 
            // Or just local day 00:00 to 23:59.
            const startOfDay = new Date(year, month, d, 0, 0, 0);

            // Coarse search: step 4 mins
            for (let m = 0; m < 1440; m += 4) {
                const time = new Date(startOfDay.getTime() + m * 60000);

                // Propagate
                const positionAndVelocity = satellite.propagate(satrec, time);
                const positionEci = positionAndVelocity.position;
                if (!positionEci) continue; // Decay or error

                const gmst = satellite.gstime(time);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                const lookAngles = satellite.ecfToLookAngles(
                    satellite.geodeticToEcf(positionGd),
                    satellite.geodeticToEcf({
                        latitude: lat * Math.PI / 180,
                        longitude: lon * Math.PI / 180,
                        height: 0
                    })
                );

                // Elevation > 10 degrees
                if (lookAngles.elevation > 0.174) { // ~10 deg in rad
                    // Check if Sun is down? (Optional but better for visibility)
                    // For now, raw "ISS Pass" is okay, or maybe "Visible ISS"
                    // User said "if ISS pass ... notify".
                    // Let's assume visible passes (Night).
                    // Simple night check: Hour < 6 || Hour > 18
                    const h = time.getHours();
                    if (h < 6 || h > 17) {
                        // Found a pass!
                        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (!passes.some(p => Math.abs(p.time - time) < 600000)) { // Debounce 10 mins
                            passes.push({ time: time, str: timeStr });
                        }
                    }
                }
            }

            if (passes.length > 0) {
                // Find cell
                // We assume cells match the order. 
                // We can find by text content or re-select.
                // The day cells have 'day-number' div with text `d`.
                const cells = document.querySelectorAll('.day-cell');
                for (let cell of cells) {
                    const num = cell.querySelector('.day-number');
                    if (num && parseInt(num.innerText) === d && !cell.classList.contains('empty')) {
                        const marker = document.createElement('div');
                        marker.classList.add('event-marker', 'iss-pass');
                        marker.style.background = 'rgba(255, 0, 0, 0.2)';
                        marker.style.border = '1px solid red';
                        marker.title = `ISS Passes at: ${passes.map(p => p.str).join(', ')}`;
                        marker.innerText = `🛰️ ISS ${passes[0].str}`;
                        cell.appendChild(marker);

                        // Add to details?
                        // We would need to store this data relative to the day to show in modal.
                        // Hack: Store in data attribute
                        cell.dataset.iss = JSON.stringify(passes.map(p => p.str));
                        break;
                    }
                }
            }
        }

    } catch (e) { console.error(e); }
}

// Update openDayModal to show ISS
const originalOpenDayModal = openDayModal;
openDayModal = function (year, month, day) {
    originalOpenDayModal(year, month, day); // Call original to clear list
    const obsList = document.getElementById('observing-list');

    // Find cell to retrieve data
    // This is inefficient but works
    const cells = document.querySelectorAll('.day-cell');
    let foundCell = null;
    for (let cell of cells) {
        const num = cell.querySelector('.day-number');
        if (num && parseInt(num.innerText) === day && !cell.classList.contains('empty')) {
            foundCell = cell;
            break;
        }
    }

    if (foundCell && foundCell.dataset.iss) {
        const passes = JSON.parse(foundCell.dataset.iss);
        const li = document.createElement('li');
        li.innerHTML = `🛰️ <strong>ISS Passes:</strong> ${passes.join(', ')}`;
        li.style.color = '#ff4444';
        obsList.prepend(li);
    }
}



// Simple "Best Target" suggestions based on Month
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

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar(currentDate);

    document.getElementById('prev-month').addEventListener('click', () => {
        // Safe navigation: Go to 1st of prev month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar(currentDate);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        // Safe navigation: Go to 1st of next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
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
        const synodic = 29.53058867;
        const fraction = moonAge / synodic;
        const distToNew = Math.min(fraction, 1.0 - fraction);
        const distToFull = Math.abs(fraction - 0.5);
        const THRESHOLD = 0.5 / synodic; // Ensures exactly 1 day gets marked

        if (distToNew <= THRESHOLD) {
            const moon = document.createElement('div');
            moon.classList.add('event-marker', 'new-moon');
            moon.title = "New Moon";
            moon.innerHTML = '🌑';
            cell.appendChild(moon);
        } else if (distToFull <= THRESHOLD) {
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

    // Fill remaining cells to ensure constant height (Total 6 rows * 7 cols = 42)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;

    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty', 'next-month-filler');
        calendarGrid.appendChild(emptyCell);
    }

    console.log("Calendar Rendered for", year, month);
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
        // Move calendar view to the start date of the plan
        if (!isNaN(plannedRange.start)) {
            currentDate = new Date(plannedRange.start.getFullYear(), plannedRange.start.getMonth(), 1);
        }
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
    const synodic = 29.53058867;
    const fraction = moonAge / synodic;
    const distToNew = Math.min(fraction, 1.0 - fraction);
    const distToFull = Math.abs(fraction - 0.5);
    const THRESHOLD = 0.5 / synodic; // Ensures exactly 1 day gets marked

    if (distToNew <= THRESHOLD) {
        const li = document.createElement('li');
        li.innerHTML = "🌑 <strong>New Moon</strong> - Perfect for Deep Sky!";
        obsList.prepend(li); // Add to top
    } else if (distToFull <= THRESHOLD) {
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

// Precision Moon Age Calculator based on Synodic Month
function getMoonAge(year, month, day) {
    const synodic = 29.53058867;
    // Known New Moon: Jan 18, 2026 17:55 UTC
    const knownNewMoon = new Date(Date.UTC(2026, 0, 18, 17, 55, 0));
    // Set to noon to avoid timezone/daylight saving edge cases
    const targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0));

    const diffMs = targetDate.getTime() - knownNewMoon.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let phase = diffDays % synodic;
    if (phase < 0) phase += synodic;

    return phase;
}

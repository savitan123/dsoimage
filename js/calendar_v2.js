
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

    // Formatting locale — use Hebrew if site is in Hebrew mode
    const calLocale = (document.documentElement.getAttribute('lang') === 'he') ? 'he-IL' : 'en-US';
    monthYear.innerText = new Intl.DateTimeFormat(calLocale, { month: 'long', year: 'numeric' }).format(date);

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

        // Moon Phase Calculation using astronomy-engine
        if (typeof Astronomy !== 'undefined') {
            const checkDate = new Date(year, month, day, 12, 0, 0);

            // Check if this specific day has a primary phase
            // SearchMoonPhase searches for the NEXT occurrence of a phase from a given time.
            // To see if TODAY has a phase, we check if the next phase is within this day.
            const startOfDay = new Date(year, month, day, 0, 0, 0);
            const endOfDay = new Date(year, month, day, 23, 59, 59);

            const phases = [
                { name: 'New Moon', angle: 0, icon: '🌑' },
                { name: 'First Quarter', angle: 90, icon: '🌓' },
                { name: 'Full Moon', angle: 180, icon: '🌕' },
                { name: 'Last Quarter', angle: 270, icon: '🌗' }
            ];

            phases.forEach(p => {
                const event = Astronomy.SearchMoonPhase(p.angle, startOfDay, 1.5); // Search 1.5 days to be safe
                if (event && event.date >= startOfDay && event.date <= endOfDay) {
                    console.log(`Found ${p.name} on ${day}/${month + 1}/${year} at ${event.date}`);
                    const moon = document.createElement('div');
                    moon.classList.add('event-marker', 'moon-phase');
                    moon.title = p.name;
                    moon.innerHTML = p.icon;
                    cell.appendChild(moon);
                }
            });
        }

        // Add Click Listener for Modal
        cell.style.cursor = 'pointer'; // Visual hint
        cell.onclick = () => {
            console.log(`Cell clicked: Day ${day}`);
            openDayModal(year, month, day);
        };

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

// Re-render calendar header when language switches
window.addEventListener('languageChanged', () => renderCalendar(currentDate));

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
    if (typeof Astronomy !== 'undefined') {
        const startOfDay = new Date(year, month, day, 0, 0, 0);
        const endOfDay = new Date(year, month, day, 23, 59, 59);
        const phases = [
            { name: 'New Moon', angle: 0, icon: '🌑', desc: 'Perfect for Deep Sky!' },
            { name: 'First Quarter', angle: 90, icon: '🌓', desc: 'Good conditions.' },
            { name: 'Full Moon', angle: 180, icon: '🌕', desc: 'Bright sky, focus on planets.' },
            { name: 'Last Quarter', angle: 270, icon: '🌗', desc: 'Good conditions after midnight.' }
        ];

        phases.forEach(p => {
            const event = Astronomy.SearchMoonPhase(p.angle, startOfDay, 1.2);
            if (event && event.date >= startOfDay && event.date <= endOfDay) {
                const li = document.createElement('li');
                li.innerHTML = `${p.icon} <strong>${p.name}</strong> - ${p.desc}`;
                obsList.prepend(li);
            }
        });
    }

    const shower = meteorShowers.find(s => s.month === month && s.day === day);
    if (shower) {
        const li = document.createElement('li');
        li.innerHTML = `🌠 <strong>${shower.name} Peak</strong>`;
        obsList.prepend(li);
    }

    modal.style.display = 'block';
}


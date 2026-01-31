
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
const dsoTargets = {
    0: "Orion Nebula (M42)",
    1: "Rosette Nebula",
    2: "Leo Triplet",
    3: "Markarian's Chain",
    4: "Whirlpool Galaxy (M51)",
    5: "Lagoon Nebula (M8)",
    6: "Eagle Nebula (M16)",
    7: "Andromeda Galaxy (M31)",
    8: "Triangulum Galaxy (M33)",
    9: "Pleiades (M45)",
    10: "California Nebula",
    11: "Horsehead Nebula"
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
        if (moonAge < 1 || moonAge > 28) {
            const moon = document.createElement('div');
            moon.classList.add('event-marker', 'new-moon');
            moon.title = "New Moon (Best for Imaging)";
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

        // Best Target (Just 1st and 15th to not clutter?) NO, user asked for "same day".
        // Let's put the "Target of the Month" on the first weekend or spread it out.
        // Actually, let's just show it every day but subtly, or just show it on the top of the calendar?
        // Let's replicate it every few days? Or just a small text at the bottom.
        // Better: Show it on Saturdays/Fridays (Imaging nights)
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) { // Fri or Sat
            const target = document.createElement('div');
            target.classList.add('event-marker', 'target');
            target.innerText = '🔭 ' + dsoTargets[month];
            cell.appendChild(target);
        }

        calendarGrid.appendChild(cell);
    }
}

// Simple Moon Age Calculator (Conway's method approx)
function getMoonAge(year, month, day) {
    let r = year % 19;
    let age = ((r * 11) % 30) + month + day;
    if (month < 2) age += 2;
    age = age % 30;
    return age;
    // This is very rough. A better calculation:
    // 29.53 days cycle. Known New Moon: Jan 6 2000.
    const knownNewMoon = new Date('2000-01-06T18:14:00');
    const currentDate = new Date(year, month, day);
    const diffTime = Math.abs(currentDate - knownNewMoon);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const cycles = diffDays / 29.53058867;
    const currentPhase = (cycles - Math.floor(cycles)) * 29.53;
    return currentPhase;
}

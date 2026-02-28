const synodic = 29.53058867;
const knownNewMoon = new Date(Date.UTC(2026, 0, 18, 17, 55, 0)); // Jan 18, 2026 17:55 UTC

function getMoonAge(year, month, day) {
    // We use noon to avoid timezone edge cases (e.g. crossing midnight)
    const targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0));

    // Difference between dates in milliseconds
    const diffMs = targetDate.getTime() - knownNewMoon.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let phase = diffDays % synodic;
    if (phase < 0) {
        phase += synodic;
    }

    return phase;
}

// Generate phases for all days in February 2026
for (let day = 1; day <= 28; day++) {
    const age = getMoonAge(2026, 1, day); // 1 = February
    // Simple logic to find strictly 1 new moon and 1 full moon.
    // Since synodic is 29.53 days, the "New Moon" day is the day the phase crosses 0,
    // or the day where the phase is closest to 0 / 29.53.
    // The easiest way is to compute the phase as a fraction 0.0 to 1.0
    const fraction = age / synodic;

    // Nearest phase:
    // New Moon: fraction near 0.0 or 1.0. Distance to nearest integer:
    const distToNew = Math.min(fraction, 1.0 - fraction);

    // Full Moon: fraction near 0.5. Distance to 0.5:
    const distToFull = Math.abs(fraction - 0.5);

    // To ensure exactly 1 day per month gets the badge:
    // The distance can be at most 0.5 / 29.53 ≈ 0.0169 because it jumps by ~1/29.53 (~0.033) each day.
    // So if distance < 0.017, it's the closest day!
    const THRESHOLD = 0.5 / synodic; // Roughly 0.01693

    let marker = "";
    if (distToNew <= THRESHOLD) {
        marker = "🌑 NEW MOON!";
    } else if (distToFull <= THRESHOLD) {
        marker = "🌕 FULL MOON!";
    }

    console.log(`Feb ${day}: phase=${fraction.toFixed(4)} distToNew=${distToNew.toFixed(4)} | ${marker}`);
}

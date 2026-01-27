
document.addEventListener('DOMContentLoaded', () => {
    const statsContainer = document.getElementById('image-stats');
    if (!statsContainer) return;

    Promise.all([
        fetch('galaxies.html').then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        }),
        fetch('nebulae.html').then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        }),
        fetch('clusters.html').then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
    ]).then(([galaxiesHtml, nebulaeHtml, clustersHtml]) => {
        const countItems = (html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            return doc.querySelectorAll('.carousel-slide').length;
        };

        const galaxiesCount = countItems(galaxiesHtml);
        const nebulaeCount = countItems(nebulaeHtml);
        const clustersCount = countItems(clustersHtml);

        statsContainer.innerHTML = `
            <div style="margin: 15px 0; padding: 0 20px; font-size: 14px; color: #ccc;">
                <p style="margin-bottom: 5px; color: #aaa;">Currently the site stores:</p>
                <ul style="padding-left: 20px; list-style-type: disc;">
                    <li>${galaxiesCount} Galax${galaxiesCount === 1 ? 'y' : 'ies'}</li>
                    <li>${nebulaeCount} Nebula${nebulaeCount === 1 ? '' : 'e'}</li>
                    <li>${clustersCount} Star Cluster${clustersCount === 1 ? '' : 's'}</li>
                </ul>
            </div>
        `;
    }).catch(error => {
        console.warn('Error fetching image stats:', error);
        // Fallback or empty if offline/error
        statsContainer.innerHTML = '';
    });
});

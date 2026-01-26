
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
            <p style="font-size: 14px; color: #bbb; margin: 15px 0; padding: 0 20px; line-height: 1.4;">
                Currently the site stores ${galaxiesCount} image galaxies, ${nebulaeCount} image nebulae and ${clustersCount} star clusters
            </p>
        `;
    }).catch(error => {
        console.warn('Error fetching image stats:', error);
        // Fallback or empty if offline/error
        statsContainer.innerHTML = '';
    });
});

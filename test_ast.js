const fs = require('fs');
try {
    const data = fs.readFileSync('js/glossary_data.js', 'utf8');

    // Syntax test via Function evaluation
    new Function(data);
    console.log('Syntax IS Valid JavaScript!');

    const matches = data.match(/title:\s*"([^"]+)"/g);
    console.log('Definitions Found:', matches ? matches.length : 0);

    console.log('FWHM Exists:', data.includes('Full Width at Half Maximum (FWHM)'));
    console.log('Bandpass Exists:', data.includes('Bandpass'));

    const fwhmBlock = data.substring(data.indexOf('Full Width at Half Maximum (FWHM)'), data.indexOf('Full Width at Half Maximum (FWHM)') + 200);
    console.log('\\nPreview of FWHM Block:');
    console.log(fwhmBlock);

} catch (e) {
    console.error('Syntax Error found in glossary_data.js:', e.message);
}

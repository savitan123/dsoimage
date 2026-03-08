const fs = require('fs');
const https = require('https');
const path = require('path');

const URL = 'https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/NGC.csv';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'ngc_ic.json');

console.log('Fetching OpenNGC data from GitHub...');

https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Data received. Parsing...');
        const lines = data.split('\n');
        const headers = lines[0].split(';');

        // Find indices for important columns
        // Standard OpenNGC CSV format uses ';' as separator
        // Columns: Name;Type;RA;Dec;Const;Mag;Size_Max;Size_Min;...
        const idx = {
            name: headers.indexOf('Name'),
            type: headers.indexOf('Type'),
            ra: headers.indexOf('RA'),
            dec: headers.indexOf('Dec'),
            const: headers.indexOf('Const'),
            mag: headers.indexOf('Mag'),
            majAxis: headers.indexOf('MajAx'),
            minAxis: headers.indexOf('MinAx'),
            commonNames: headers.indexOf('Common names')
        };

        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length < 5) continue;

            const entry = {
                n: cols[idx.name] ? cols[idx.name].trim() : '', // Name
                t: cols[idx.type] ? cols[idx.type].trim() : '', // Type
                ra: cols[idx.ra] ? cols[idx.ra].trim() : '',   // RA
                de: cols[idx.dec] ? cols[idx.dec].trim() : '', // Dec
                co: cols[idx.const] ? cols[idx.const].trim() : '', // Constellation
                ma: cols[idx.mag] ? cols[idx.mag].trim() : '', // Magnitude
                sz: (cols[idx.majAxis] || '') + (cols[idx.minAxis] ? ' x ' + cols[idx.minAxis] : ''), // Size
                cn: cols[idx.commonNames] ? cols[idx.commonNames].trim() : '' // Common Name
            };
            results.push(entry);
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results));
        console.log(`Successfully generated ${OUTPUT_FILE} with ${results.length} objects.`);
    });
}).on('error', (err) => {
    console.error('Error fetching data:', err.message);
});

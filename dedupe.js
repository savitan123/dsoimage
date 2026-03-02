const fs = require('fs');

const data = fs.readFileSync('js/glossary_data.js', 'utf8');

const arrayMatch = data.match(/const\s+GLOSSARY_ITEMS\s*=\s*\[([\s\S]*)\];/);
if (!arrayMatch) {
    console.log("Could not find GLOSSARY_ITEMS");
    process.exit(1);
}

const func = new Function("return [" + arrayMatch[1] + "];");
const GLOSSARY_ITEMS = func();

const seen = new Set();
const uniqueItems = [];
const duplicates = [];

for (const item of GLOSSARY_ITEMS) {
    if (item.category && item.category.toLowerCase().includes('constellation')) {
        uniqueItems.push(item);
        continue;
    }
    const normTitle = item.title.trim().toLowerCase();
    if (seen.has(normTitle)) {
        duplicates.push(item.title);
    } else {
        seen.add(normTitle);
        uniqueItems.push(item);
    }
}

console.log("Found duplicates:", duplicates);

let newContent = 'const GLOSSARY_ITEMS = [\n';

for (let i = 0; i < uniqueItems.length; i++) {
    const item = uniqueItems[i];
    newContent += '    {\n';
    newContent += `        title: "${item.title.replace(/"/g, '\\"')}",\n`;
    newContent += `        category: "${item.category.replace(/"/g, '\\"')}",\n`;
    newContent += `        content: \`${item.content}\`\n`;
    newContent += '    }';
    if (i < uniqueItems.length - 1) {
        newContent += ',';
    }
    newContent += '\n';
}

newContent += '];\n';

fs.writeFileSync('js/glossary_data.js', newContent, 'utf8');
console.log("Deduplication complete. Items left: " + uniqueItems.length);

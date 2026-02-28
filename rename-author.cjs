const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.astro') || file.endsWith('.md')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let count = 0;
files.forEach(f => {
    const orig = fs.readFileSync(f, 'utf8');
    const updated = orig.replace(/Josh Smith/g, 'Andrew Derek').replace(/josh-smith\.png/g, 'andrew-derek.png');
    if (orig !== updated) {
        fs.writeFileSync(f, updated);
        count++;
    }
});
console.log(`Updated ${count} files.`);

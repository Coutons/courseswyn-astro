const coupons = require('./src/data/coupons.json');
const categories = [...new Set(coupons.map(c => c.category))].filter(c => typeof c === 'string' && c.trim() !== '');

console.log('Categories found:', categories);

categories.forEach(category => {
    const filtered = coupons.filter(c => c.category === category);
    console.log(`Category: "${category}", Count: ${filtered.length}`);
    if (filtered.length === 0) {
        console.error(`ERROR: Empty category "${category}"`);
    }
});

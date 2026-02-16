const coupons = require('./src/data/coupons.json');

console.log('Total coupons:', coupons.length);
console.log('Coupons with createdAt:', coupons.filter(c => c.createdAt).length);
console.log('Coupons without createdAt:', coupons.filter(c => !c.createdAt).length);

const withCreatedAt = coupons.filter(c => c.createdAt);
if (withCreatedAt.length > 0) {
  console.log('\nSample createdAt values:');
  withCreatedAt.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i+1}. ${c.title.substring(0, 50)}... - ${c.createdAt}`);
  });
}

const sorted = [...coupons].sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime());
console.log('\nFirst 3 coupons after sorting:');
sorted.slice(0, 3).forEach((c, i) => {
  console.log(`  ${i+1}. ${c.title.substring(0, 50)}... - ${c.createdAt || 'NO DATE'}`);
});

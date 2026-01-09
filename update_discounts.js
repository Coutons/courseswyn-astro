import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/coupons.json', 'utf8'));

function calculateDiscount(price, originalPrice) {
  const p = parseFloat(price.replace(/[^\d.-]/g, ''));
  const op = parseFloat(originalPrice.replace(/[^\d.-]/g, ''));

  if (isNaN(p) || isNaN(op) || op <= 0) return '-0%';

  const discountPercent = Math.round(((op - p) / op) * 100);
  return `-${discountPercent}%`;
}

data.forEach(item => {
  item.discount = calculateDiscount(item.price, item.originalPrice);
});

fs.writeFileSync('src/data/coupons.json', JSON.stringify(data, null, 2));

console.log('Discounts updated automatically!');
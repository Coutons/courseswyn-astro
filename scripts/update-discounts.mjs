#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const COUPONS_FILE = path.join(ROOT, 'src', 'data', 'coupons.json');

function calculateDiscount(price, originalPrice) {
  const p = parseFloat(price.replace(/[^\d.-]/g, ''));
  const op = parseFloat(originalPrice.replace(/[^\d.-]/g, ''));
  if (op > 0 && p >= 0) {
    const discountPercent = Math.round(((op - p) / op) * 100);
    return `-${discountPercent}%`;
  }
  return '-0%';
}

const updateDiscounts = async () => {
  try {
    const data = await fs.readFile(COUPONS_FILE, 'utf-8');
    const coupons = JSON.parse(data);

    let updated = 0;
    for (const coupon of coupons) {
      const calculatedDiscount = calculateDiscount(coupon.price, coupon.originalPrice);
      if (coupon.discount !== calculatedDiscount) {
        coupon.discount = calculatedDiscount;
        updated++;
        console.log(`Updated ${coupon.slug}: ${calculatedDiscount}`);
      }
    }

    if (updated > 0) {
      await fs.writeFile(COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf-8');
      console.log(`Updated discounts for ${updated} coupons.`);
    } else {
      console.log('All discounts are already up to date.');
    }
  } catch (error) {
    console.error('Failed to update discounts:', error);
    process.exit(1);
  }
};

updateDiscounts();
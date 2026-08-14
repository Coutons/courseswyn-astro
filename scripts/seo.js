#!/usr/bin/env node

/**
 * SEO description fixer for CourseWyn Astro.
 * Regenerates seoDescription directly from course data (no Gemini, no manual editing).
 *
 * Usage:
 *   npm run seo:start                  -> fix ALL instructors
 *   npm run seo:start -- "Name"        -> fix ONE instructor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'src', 'data', 'coupons.json');

const MIN_LEN = 250;
const MAX_LEN = 350;
const BULK_MAX = 320;
const BULK_MIN_BODY = 170;

const BOILERPLATE = [
  'this is applicable',
  'discount offers',
  'thia is',
  'udemy discount offer',
];

const TEMPLATE_FRAGMENTS = [
  "You'll cover ",
  'Step-by-step lessons take you through ',
  'Hands-on training walks you through ',
  'Dive into ',
  'The curriculum includes ',
  'Level up your career with this comprehensive ',
  'Go from beginner to confident in ',
  'Build real skills in ',
  'through real-world projects.',
  'from start to finish.',
  'with practical examples.',
];

function loadCourses() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function saveCourses(courses) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(courses, null, 2));
}

function realDiscountPercent(course) {
  const p = Number(course.price);
  const op = Number(course.originalPrice);
  if (!isFinite(p) || !isFinite(op) || op <= 0 || p > op || p <= 0) return null;
  return Math.round((1 - p / op) * 100);
}

function issuesFor(desc, course) {
  const issues = [];
  const text = desc || '';
  const len = text.length;
  if (len < MIN_LEN) issues.push(`tooShort(${len})`);
  if (len > MAX_LEN) issues.push(`tooLong(${len})`);
  const lower = text.toLowerCase();
  for (const b of BOILERPLATE) {
    if (lower.includes(b)) { issues.push('boilerplate'); break; }
  }
  for (const f of TEMPLATE_FRAGMENTS) {
    if (lower.includes(f)) { issues.push(`template:${JSON.stringify(f.trim())}`); break; }
  }
  const real = realDiscountPercent(course);
  const matches = text.match(/(\d{1,3})\s*%/g) || [];
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (real != null && Math.abs(n - real) > 1) {
      issues.push(`discountSaid${n}%real${real}%`);
      break;
    }
  }
  return issues;
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

function trimToFit(text, maxLen) {
  if (text.length <= maxLen) return text;
  let cut = text.lastIndexOf('. ', maxLen);
  if (cut > 0 && cut + 1 <= maxLen) return text.slice(0, cut + 1).trim();
  cut = text.lastIndexOf(' ', maxLen);
  if (cut > 0) return text.slice(0, cut).trim();
  return text.slice(0, maxLen).trim();
}

function hashStr(s) {
  let h = 0;
  for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtShortDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return '';
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

function fmtPrice(n) {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return '';
  return `$${v.toFixed(2).replace(/\.00$/, '')}`;
}

function isSpanishCourse(c) {
  return /es\b|spanish|español/i.test(c.language || '');
}

function cleanText(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/["“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FRESH_EN = [
  (c, d, price, orig, cat, until, updated) =>
    `— ${price} today (${d}% off), listed until ${until}.`,
  (c, d, price, orig, cat, until, updated) =>
    `— now ${price}, was ${orig}, ${cat} deal updated ${updated}.`,
  (c, d, price, orig, cat, until, updated) =>
    `— ${d}% off through ${until}, ${c.rating}★ on Udemy.`,
  (c, d, price, orig, cat, until, updated) =>
    `— ${price} verified deal, ${cat}, last synced ${updated}.`,
];

const FRESH_ES = [
  (c, d, price, orig, cat, until, updated) =>
    `— ${price} hoy (${d}% de descuento), listado hasta el ${until}.`,
  (c, d, price, orig, cat, until, updated) =>
    `— ahora ${price}, antes ${orig}, oferta de ${cat} actualizada el ${updated}.`,
  (c, d, price, orig, cat, until, updated) =>
    `— ${d}% de descuento hasta ${until}, ${c.rating}★ en Udemy.`,
  (c, d, price, orig, cat, until, updated) =>
    `— ${price} oferta verificada, ${cat}, última sincronización ${updated}.`,
];

function freshnessClause(course) {
  const d = realDiscountPercent(course);
  const price = fmtPrice(course.price) || 'current price';
  const orig = fmtPrice(course.originalPrice) || 'regular price';
  const cat = cleanText(course.subcategory || course.category || '');
  const until = fmtShortDate(course.expiresAt || course.updatedAt || course.createdAt);
  const updated = fmtShortDate(course.updatedAt || course.createdAt || course.expiresAt);
  const variants = isSpanishCourse(course) ? FRESH_ES : FRESH_EN;
  let idx = hashStr(course.slug) % variants.length;
  if (d == null && (idx === 0 || idx === 2)) idx = idx === 0 ? 1 : 3;
  return variants[idx](course, d, price, orig, cat, until, updated);
}

function bulkPieces(course) {
  const raw = [
    ...(course.learn || []),
    course.description,
    course.title,
    course.seoTitle,
    ...(course.requirements || []),
  ]
    .map(cleanText)
    .filter(Boolean);
  const real = realDiscountPercent(course);
  const seen = new Set();
  const pieces = [];
  for (const p of raw) {
    const low = p.toLowerCase();
    if (seen.has(low)) continue;
    if (BOILERPLATE.some((b) => low.includes(b))) continue;
    if (TEMPLATE_FRAGMENTS.some((f) => low.includes(f))) continue;
    if (real != null) {
      const m = p.match(/(\d{1,3})\s*%/);
      if (m && Math.abs(parseInt(m[1], 10) - real) > 1) continue;
    }
    seen.add(low);
    pieces.push(p);
  }
  return pieces;
}

function bulkBodyFor(course, used) {
  const pieces = bulkPieces(course);
  if (pieces.length === 0) return null;
  const fresh = freshnessClause(course);
  const maxBody = BULK_MAX - fresh.length - 1;
  const minBody = Math.max(BULK_MIN_BODY, MIN_LEN - fresh.length + 10);
  const start = hashStr(course.slug) % pieces.length;
  let lastIssues = [];
  for (let tries = 0; tries < pieces.length * 3; tries++) {
    const parts = [];
    let len = 0;
    for (let k = 0; k < pieces.length; k++) {
      const piece = pieces[(start + tries + k) % pieces.length];
      parts.push(piece);
      len += piece.length;
      if (len >= minBody) break;
    }
    const body = parts.join('. ');
    const b = trimToFit(body, maxBody);
    const desc = `${b} ${fresh}`.trim().replace(/\s+/g, ' ');
    const issues = issuesFor(desc, course);
    if (used.has(normalize(desc))) issues.push('duplicateWording');
    lastIssues = issues;
    if (issues.length === 0) return { body: b, desc };
  }
  return { issue: lastIssues.join(' | ') };
}

function run(instructor) {
  if (instructor) {
    console.log(`🎯 Fixing "${instructor}"...`);
  } else {
    console.log('🎯 Fixing all instructors...');
  }

  const courses = loadCourses();
  const targets = instructor
    ? courses.filter(
        (c) =>
          (c.instructor || '').toLowerCase().includes(instructor.toLowerCase()) &&
          issuesFor(c.seoDescription, c).length > 0
      )
    : courses.filter((c) => issuesFor(c.seoDescription, c).length > 0);

  if (targets.length === 0) {
    console.log('✅ Nothing to fix — all descriptions are OK.');
    return;
  }

  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  for (const c of targets) used.delete(normalize(c.seoDescription));

  let ok = 0;
  const failed = [];
  for (const course of targets) {
    const r = bulkBodyFor(course, used);
    if (r && r.desc) {
      course.seoDescription = r.desc;
      used.add(normalize(r.desc));
      ok++;
    } else {
      failed.push(`${course.slug} (${(r && r.issue) || 'no-source'})`);
    }
  }

  if (ok > 0) {
    saveCourses(courses);
    console.log(`✅ Fixed ${ok}/${targets.length} — saved to src/data/coupons.json`);
  } else {
    console.log(`❌ Nothing could be fixed for ${targets.length} course(s).`);
  }

  if (failed.length) {
    console.log('❌ Could not generate (add learn/description data in coupons.json):');
    failed.forEach((s) => console.log(`   - ${s}`));
  }
}

const instructor = process.argv[2];
run(instructor);

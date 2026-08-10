#!/usr/bin/env node

/**
 * SEO Description helper for CourseWyn Astro
 *
 * Commands:
 *   report                  - Show instructors with old/boilerplate seoDescription
 *   dump <instructor>       - Export courses for an instructor to work/seo-dump.json
 *   apply <file>            - Apply new descriptions from {slug: seoDescription} JSON
 *   validate                - Validate all seoDescription fields (length + boilerplate + unique wording)
 *
 * Usage:
 *   node scripts/seo-descriptions.js report
 *   node scripts/seo-descriptions.js dump "Stephane Maarek"
 *   node scripts/seo-descriptions.js apply work/seo-new.json
 *   node scripts/seo-descriptions.js validate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUPONS_PATH = path.join(__dirname, '..', 'src', 'data', 'coupons.json');
const WORK_DIR = path.join(__dirname, 'work');

const MIN_LEN = 250;
const MAX_LEN = 350;
const YEAR = 2026;

const BOILERPLATE = [
  'this is applicable',
  'discount offers',
  'thia is',
  'udemy discount offer',
];

// Phrases from the removed autogen template generator. Rejecting them here
// blocks any attempt to re-introduce mass-templated thin content.
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
  const raw = fs.readFileSync(COUPONS_PATH, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function saveCourses(courses) {
  fs.writeFileSync(COUPONS_PATH, JSON.stringify(courses, null, 2));
}

function hasBoilerplate(desc = '') {
  const lower = desc.toLowerCase();
  return BOILERPLATE.some((b) => lower.includes(b));
}

// Anti-thin-content checks:
// 1. length must be in range
// 2. no boilerplate phrases
// 3. no leftover autogen template fragments
// 4. must not be identical/reused wording already applied to another course
function checkDescription(desc, usedWords, course) {
  const issues = [];
  const len = (desc || '').length;
  if (len < MIN_LEN) issues.push(`tooShort(${len})`);
  if (len > MAX_LEN) issues.push(`tooLong(${len})`);
  if (hasBoilerplate(desc)) issues.push('boilerplate');
  const lower = (desc || '').toLowerCase();
    for (const f of TEMPLATE_FRAGMENTS) {
      if (lower.includes(f)) {
        issues.push(`template:${JSON.stringify(f.trim())}`);
        break;
      }
    }
    const norm = (desc || '').toLowerCase().replace(/\s+/g, ' ');
    if (usedWords && usedWords.has(norm)) issues.push('duplicateWording');
    addDiscountIssue(issues, desc, course);
    return issues;
  }

// Actual discount % for a course, based on real price data
function realDiscountPercent(course) {
  const p = Number(course.price);
  const op = Number(course.originalPrice);
  if (!isFinite(p) || !isFinite(op) || op <= 0 || p > op || p <= 0) return null;
  return Math.round((1 - p / op) * 100);
}

// Any "NN%" mentioned in a description must match the course's real discount
function addDiscountIssue(issues, desc, course) {
  const real = realDiscountPercent(course);
  if (real == null) return;
  const matches = String(desc).match(/(\d{1,3})\s*%/g);
  if (!matches) return;
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (Math.abs(n - real) > 1) {
      issues.push(`discountSaid${n}%real${real}%`);
      return;
    }
  }
}

function applyUpdates(courses, updates) {
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  let applied = 0;
  const skipped = [];
  const invalid = [];

  for (const [slug, newDesc] of Object.entries(updates)) {
    const course = bySlug.get(slug);
    if (!course) {
      skipped.push(`${slug} (not found)`);
      continue;
    }
    if (typeof newDesc !== 'string' || !newDesc.trim()) {
      invalid.push(`${slug} (empty)`);
      continue;
    }
    const issues = checkDescription(newDesc, undefined, course);
    if (issues.length) {
      invalid.push(`${slug} (${issues.join(', ')})`);
      continue;
    }
    course.seoDescription = newDesc.trim();
    applied++;
  }

  return { applied, skipped, invalid };
}

function report() {
  const courses = loadCourses();
  const byInstructor = new Map();

  for (const c of courses) {
    const issues = checkDescription(c.seoDescription, undefined, c);
    if (!issues.length) continue;
    const key = c.instructor || '(no instructor)';
    if (!byInstructor.has(key)) byInstructor.set(key, []);
    byInstructor.get(key).push({ slug: c.slug, issues });
  }

  const entries = [...byInstructor.entries()].sort((a, b) => b[1].length - a[1].length);
  const total = entries.reduce((sum, [, list]) => sum + list.length, 0);

  console.log(`🔍 Courses with old/bad seoDescription: ${total}`);
  console.log('');
  for (const [instructor, list] of entries) {
    console.log(`${String(list.length).padStart(3)}  ${instructor}`);
  }
  console.log('');
  console.log('Next: dump by instructor and write unique descriptions, then apply.');
  console.log('  node scripts/seo-descriptions.js dump "<name>"');
}

function dump(instructor) {
  const courses = loadCourses();
  const selected = courses.filter(
    (c) =>
      (c.instructor || '').toLowerCase().includes(instructor.toLowerCase()) &&
      checkDescription(c.seoDescription, undefined, c).length > 0
  );

  if (selected.length === 0) {
    console.log('❌ No matching courses with bad seoDescription found.');
    return;
  }

  fs.mkdirSync(WORK_DIR, { recursive: true });
  const out = {
    instructions: 'Rewrite each seoDescription. See docs/seo-description-prompt.md',
    minLength: MIN_LEN,
    maxLength: MAX_LEN,
    year: YEAR,
    courses: selected.map((c) => ({
      slug: c.slug,
      title: c.title,
      instructor: c.instructor,
      category: c.category,
      subcategory: c.subcategory,
      discountPercent: realDiscountPercent(c),
      currentDescription: c.description,
      currentSeoDescription: c.seoDescription,
    })),
  };

  const outPath = path.join(WORK_DIR, 'seo-dump.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✅ Dumped ${selected.length} course(s) -> ${outPath}`);
  console.log('Write unique descriptions, save as JSON, then run:');
  console.log('  node scripts/seo-descriptions.js apply <result-file>');
}

function apply(applyFile) {
  if (!applyFile) {
    console.error('❌ Usage: node scripts/seo-descriptions.js apply <file.json>');
    process.exit(1);
  }
  const applyPath = path.resolve(process.cwd(), applyFile);
  if (!fs.existsSync(applyPath)) {
    console.error(`❌ File not found: ${applyPath}`);
    process.exit(1);
  }

  let updates;
  try {
    const raw = fs.readFileSync(applyPath, 'utf8').replace(/^\uFEFF/, '');
    updates = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Invalid JSON in ${applyPath}: ${e.message}`);
    process.exit(1);
  }

  if (Array.isArray(updates)) {
    updates = Object.fromEntries(updates.map((u) => [u.slug, u.seoDescription]));
  }

  const courses = loadCourses();

  // Duplicate-wording guard across the ENTIRE existing dataset + this batch
  const used = new Set(
    courses
      .map((c) => (c.seoDescription || '').toLowerCase().replace(/\s+/g, ' '))
      .filter(Boolean)
  );
  // Temporarily exclude courses this batch will overwrite (they will be re-checked below)
  for (const [slug] of Object.entries(updates)) {
    const c = courses.find((x) => x.slug === slug);
    if (c) used.delete((c.seoDescription || '').toLowerCase().replace(/\s+/g, ' '));
  }

  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  let applied = 0;
  const skipped = [];
  const invalid = [];

  for (const [slug, newDesc] of Object.entries(updates)) {
    const course = bySlug.get(slug);
    if (!course) {
      skipped.push(`${slug} (not found)`);
      continue;
    }
    if (typeof newDesc !== 'string' || !newDesc.trim()) {
      invalid.push(`${slug} (empty)`);
      continue;
    }
    const issues = checkDescription(newDesc, used, course);
    if (issues.length) {
      invalid.push(`${slug} (${issues.join(', ')})`);
      continue;
    }
    course.seoDescription = newDesc.trim();
    used.add(newDesc.trim().toLowerCase().replace(/\s+/g, ' '));
    applied++;
  }

  if (applied > 0) saveCourses(courses);

  console.log(`✅ Applied: ${applied}`);
  if (skipped.length) console.log(`⚠️  Skipped: ${skipped.join(', ')}`);
  if (invalid.length) console.log(`❌ Invalid (not applied): ${invalid.join(', ')}`);
  if (applied > 0) {
    console.log(`💾 Saved to ${COUPONS_PATH}`);
    console.log('Next: node scripts/seo-descriptions.js validate');
  }
}

function validate() {
  const courses = loadCourses();
  const dup = new Map();
  for (const c of courses) {
    if (!c.seoDescription) continue;
    const norm = c.seoDescription.toLowerCase().replace(/\s+/g, ' ');
    if (!dup.has(norm)) dup.set(norm, []);
    dup.get(norm).push(c.slug);
  }
  const duplicated = [...dup.entries()].filter(([, v]) => v.length > 1);

  const bad = [];
  const usedWords = new Set();
  for (const c of courses) {
    const issues = checkDescription(c.seoDescription, usedWords, c);
    if (issues.length) {
      bad.push({ slug: c.slug, issues });
      continue;
    }
    usedWords.add(c.seoDescription.toLowerCase().replace(/\s+/g, ' '));
  }

  let short = 0;
  let long = 0;
  let boiler = 0;
  let templ = 0;
  for (const c of courses) {
    const len = (c.seoDescription || '').length;
    if (len < MIN_LEN) short++;
    if (len > MAX_LEN) long++;
    const lower = (c.seoDescription || '').toLowerCase();
    if (BOILERPLATE.some((b) => lower.includes(b))) boiler++;
    if (TEMPLATE_FRAGMENTS.some((f) => lower.includes(f))) templ++;
  }

  console.log(`📦 Total courses: ${courses.length}`);
  console.log(
    `   Bad: ${bad.length} (tooShort: ${short}, tooLong: ${long}, boilerplate: ${boiler}, template: ${templ}, duplicateWording: ${duplicated.length})`
  );
  if (bad.length) {
    console.log('');
    for (const c of bad) {
      console.log(`   - ${c.slug} (${c.issues.join(', ')})`);
    }
  }
  if (duplicated.length) {
    console.log('');
    console.log(`⚠️  Same seoDescription reused ${duplicated.length} time(s) across courses:`);
    for (const [norm, slugs] of duplicated) {
      console.log(`   ${slugs.join(' | ')}`);
    }
  }
  return bad.length === 0 && duplicated.length === 0 ? 0 : 1;
}

function showHelp() {
  console.log('🔧 CourseWyn SEO Description Helper');
  console.log('');
  console.log('Usage: node scripts/seo-descriptions.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  report                 - Show instructors with old/bad seoDescription');
  console.log('  dump "<instructor>"    - Export matching courses to scripts/work/seo-dump.json');
  console.log('  apply <file.json>      - Apply {slug: seoDescription} updates to coupons.json');
  console.log('  validate               - Check length, boilerplate, template remnants, duplicates');
  console.log('  help                   - Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/seo-descriptions.js report');
  console.log('  node scripts/seo-descriptions.js dump "Stephane Maarek"');
  console.log('  node scripts/seo-descriptions.js apply scripts/work/seo-new.json');
  console.log('  node scripts/seo-descriptions.js validate');
}

const command = process.argv[2];

switch (command) {
  case 'report':
    report();
    break;
  case 'dump':
    dump(process.argv[3]);
    break;
  case 'apply':
    apply(process.argv[3]);
    break;
  case 'validate':
    process.exit(validate());
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    showHelp();
    break;
}
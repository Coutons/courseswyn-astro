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

/**
 * Old auto-generated "freshness" clauses (see scripts/seo.js history) that
 * made meta descriptions misleading: they only repeated price/discount/date
 * and the subcategory instead of describing the actual course. Anything
 * matching these gets regenerated.
 */
const MISLEADING_RE = [
  /— now \$\d[\d.,]*, was \$\d[\d.,]*, [a-z].* deal updated [a-z]+ \d+\./i,
  /— ahora \$[\d.,]*, antes \$[\d.,]*, oferta de .* actualizada el [a-z]+ \d+\./i,
  /— \$\d[\d.,]* verified deal, .* last synced [a-z]+ \d+\./i,
  /— \$\d[\d.,]* oferta verificada, .* última sincronización [a-z]+ \d+\./i,
  /— \$\d[\d.,]* today \(\d+% off\), listed until [a-z]+ \d+\./i,
  /— \$\d[\d.,]* hoy \(\d+% de descuento\), listado hasta el [a-z]+ \d+\./i,
  /— \d+% off through [a-z]+ \d+, \d(\.\d)?★ on udemy\./i,
  /— \d+% de descuento hasta [a-z]+ \d+, \d(\.\d)?★ en udemy\./i,
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
  for (const re of MISLEADING_RE) {
    if (re.test(text)) { issues.push('misleadingDealClause'); break; }
  }
  if (!TEMPLATE_RE.test(text)) issues.push('notTemplate');
  const real = realDiscountPercent(course);
  const matches = text.match(/(\d{1,3})\s*%\s*(?:de\s+)?(?:off|discount|descuento|oferta|rebaja|menos|less)\b/gi) || [];
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

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_FULL_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function fmtMonthYear(iso, months) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{1,2})/);
  if (!m) return '';
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return '';
  return `${months[mo - 1]} ${m[1]}`;
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

/**
 * Descriptions must follow the site's SEO template:
 *   "Title" is a Udemy course by Instructor, rated X/5, updated in Month Year, <course description>
 * Anything that doesn't open with the quoted title gets regenerated.
 */
const TEMPLATE_RE = /^"[^"]+"\s+(?:is a |es un curso de )/;

function identityLead(course) {
  const es = isSpanishCourse(course);
  const title = cleanText(course.title) || 'This course';
  const provider = cleanText(course.provider) || 'Udemy';
  const months = es ? MONTHS_FULL_ES : MONTHS_FULL;
  const clauses = [];
  if (course.instructor) {
    clauses.push(
      es
        ? `es un curso de ${provider} de ${cleanText(course.instructor)}`
        : `is a ${provider} course by ${cleanText(course.instructor)}`
    );
  } else {
    clauses.push(es ? `es un curso de ${provider}` : `is a ${provider} course`);
  }
  if (course.rating != null) {
    clauses.push(es ? `con ${course.rating}/5 de calificación` : `rated ${course.rating}/5`);
  }
  const dt = fmtMonthYear(course.updatedAt || course.createdAt || course.expiresAt, months);
  if (dt) clauses.push(es ? `actualizado en ${dt}` : `updated in ${dt}`);
  return `"${title}" ${clauses.join(', ')}`;
}

function bulkPieces(course) {
  const raw = [
    course.description,
    ...(course.learn || []),
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
      const m = p.match(/(\d{1,3})\s*%\s*(?:de\s+)?(?:off|discount|descuento|oferta|rebaja|menos|less)\b/i);
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
  const lead = identityLead(course);
  const fixedLen = lead.length + 2;
  const maxBody = Math.max(30, BULK_MAX - fixedLen - 1);
  const minBody = Math.max(20, MIN_LEN - fixedLen + 10);
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
    const body = trimToFit(parts.join('. '), maxBody).trim().replace(/\s+/g, ' ');
    const b = body.replace(/\.+$/, '') + '.';
    const desc = `${lead}, ${b}`.trim().replace(/\s+/g, ' ');
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

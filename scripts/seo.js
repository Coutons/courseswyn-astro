#!/usr/bin/env node

/**
 * SEO description workflow for CourseWyn Astro using the Gemini API (free tier).
 *
 * Setup: put your key in .env (already gitignored):
 *   GEMINI_API_KEY=...
 *   GEMINI_MODEL=gemini-2.5-flash   (optional, default gemini-2.5-flash)
 *
 * Flow (one instructor at a time):
 *   npm run seo:auto -- "<instructor>"   -> Gemini generates, validates + applies
 *   npm run seo:start -- "<instructor>"  -> dump to scripts/work/seo.json (manual)
 *   npm run seo:finish                   -> apply scripts/work/seo.json (manual)
 *   npm run seo:check -- "<instructor>"  -> verify one instructor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'src', 'data', 'coupons.json');
const WORK_FILE = path.join(__dirname, 'work', 'seo.json');
const PENDING_FILE = path.join(__dirname, 'work', 'pending.json');
const ENV_PATH = path.join(ROOT, '.env');

const MIN_LEN = 250;
const MAX_LEN = 350;
const BULK_MAX = 320;
const BULK_MIN_BODY = 170;
const YEAR = 2026;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const BATCH_SIZE = 8;
const PACE_MS = 6500;
const QUOTA_RETRIES = 6;
const QUOTA_BACKOFF_MS = 10000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const API_KEY = env.GEMINI_API_KEY;
const MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

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

// Last-resort: cut text at the nearest sentence/word boundary below maxLen.
function trimToFit(text, maxLen) {
  if (text.length <= maxLen) return text;
  let cut = text.lastIndexOf('. ', maxLen);
  if (cut > 0 && cut + 1 <= maxLen) return text.slice(0, cut + 1).trim();
  cut = text.lastIndexOf(' ', maxLen);
  if (cut > 0) return text.slice(0, cut).trim();
  return text.slice(0, maxLen).trim();
}

function ctaTopic(course) {
  const sub = course.subcategory || '';
  const generic = /tools|fundamentals|basics|\b101\b|general|skills/i;
  if (sub && !generic.test(sub)) return sub;
  return course.category || 'IT';
}

const CTA_VARIANTS = [
  (d, topic) =>
    `Claim a verified Udemy coupon code and save ${d}% on ${topic} courses in 2026.`,
  (d, topic) =>
    `Use an exclusive Udemy coupon now and get ${d}% off ${topic} training while it lasts in 2026.`,
  (d, topic) =>
    `Grab a verified Udemy coupon today and save ${d}% on ${topic} learning in 2026.`,
];

function ctaFor(course) {
  const d = realDiscountPercent(course);
  const topic = ctaTopic(course);
  if (d == null) return `Claim a verified Udemy coupon code and enjoy today's discount on ${topic} courses in 2026.`;
  const idx = [...course.slug].reduce((a, ch) => a + ch.charCodeAt(0), 0) % CTA_VARIANTS.length;
  return CTA_VARIANTS[idx](d, topic);
}

// Gemini returns the body; the script appends the CTA so length is always controllable.
function assembleDesc(course, body) {
  const cta = ctaFor(course);
  const maxBody = MAX_LEN - cta.length - 1;
  const b = body ? trimToFit(body, maxBody) : '';
  return `${b} ${cta}`.trim().replace(/\s+/g, ' ');
}

function findTargets(instructor) {
  return loadCourses().filter(
    (c) =>
      (c.instructor || '').toLowerCase().includes(instructor.toLowerCase()) &&
      issuesFor(c.seoDescription, c).length > 0
  );
}

// ---------- Gemini ----------

const SYSTEM_PROMPT = `You are an expert SEO copywriter for a Udemy coupon/deals website (courseswyn.com). You will be given JSON objects for courses. For EACH course write a description BODY. The coupon CTA sentence is added automatically later, so do NOT write any discount, coupon, CTA or percentage sentence.

Rules:
1. Write 2-3 sentences: a unique hook naming what the student will learn, then real topics from the course data. No "claim", "save", "coupon", "discount", "today" phrases.
2. BODY length MUST be between 170 and 280 characters (plain text). Aim for ~230. Count characters before returning.
3. Never use boilerplate like "this is applicable to", "Udemy discount offers", "with practical examples", "real-world projects", "Find out other", "highest rated and bestselling", "in this course", "course delves".
4. Vary the opening words between courses. No invented facts; only topics present in the course data.
5. No emojis.`;

async function callGemini(courses, feedback) {
  const userText =
    'Write the description BODY for every course. Return ONLY a JSON object mapping each slug to its body text (no markdown fences, no extra text):\n' +
    JSON.stringify(
      courses.map((c) => ({
        slug: c.slug,
        title: c.title,
        category: c.category,
        subcategory: c.subcategory,
        discountPercent: realDiscountPercent(c),
        currentDescription: c.description,
      })),
      null,
      2
    ) +
    (feedback ? `\n\nPrevious attempts were rejected for these reasons, FIX them:\n${feedback}` : '');

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  };

  for (let attempt = 0; attempt <= QUOTA_RETRIES; attempt++) {
    const res = await fetch(`${GEMINI_URL}/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 429 && attempt < QUOTA_RETRIES) {
      const wait = QUOTA_BACKOFF_MS * (attempt + 1);
      console.log(`  ⏳ rate-limited (429), waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = content.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object in response');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  throw new Error('Gemini API 429: still rate-limited after retries');
}

// ---------- commands ----------

async function processInstructor(courses, instructor) {
  const targets = courses.filter(
    (c) =>
      (c.instructor || '').toLowerCase().includes(instructor.toLowerCase()) &&
      issuesFor(c.seoDescription, c).length > 0
  );
  if (targets.length === 0) return 0;

  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  for (const c of targets) used.delete(normalize(c.seoDescription));

  let applied = 0;
  const bad = [];
  let todo = targets;
  const MAX_ROUNDS = 3;

  for (let round = 0; round < MAX_ROUNDS && todo.length > 0; round++) {
    const pending = todo;
    todo = [];
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      const feedback = batch
        .map((c) => `${c.slug}: ${(c.__issues || []).join(', ')}`)
        .filter(Boolean)
        .join('\n');
      try {
        const generated = await callGemini(batch, feedback);
        for (const course of batch) {
          const body = (generated[course.slug] || '').trim();
          if (!body) { course.__issues = ['empty body']; course.__lastBody = null; todo.push(course); continue; }
          const desc = assembleDesc(course, body);
          const issues = issuesFor(desc, course);
          if (used.has(normalize(desc))) issues.push('duplicateWording');
          if (issues.length) {
            course.__issues = issues;
            course.__lastBody = body;
            todo.push(course);
            continue;
          }
          course.seoDescription = desc;
          used.add(normalize(desc));
          applied++;
        }
        } catch (e) {
          console.error(`  ⚠️  batch failed: ${e.message}`);
          batch.forEach((c) => { c.__issues = ['batch error']; c.__lastBody = null; todo.push(c); });
        }
        if (i + BATCH_SIZE < pending.length) await sleep(PACE_MS);
    }
    if (todo.length > 0 && round < MAX_ROUNDS - 1) {
      console.log(`  ↻ retrying ${todo.length} rejected course(s) (round ${round + 2})...`);
    }
  }

  for (const course of todo) {
    const t = course.__lastBody ? assembleDesc(course, course.__lastBody) : '';
    if (t) {
      const issues = issuesFor(t, course);
      if (used.has(normalize(t))) issues.push('duplicateWording');
      if (issues.length === 0) {
        course.seoDescription = t;
        used.add(normalize(t));
        applied++;
        continue;
      }
    }
    bad.push(`${course.slug} (${(course.__issues || ['failed']).join(', ')})`);
  }

  return { applied, bad };
}

async function auto(instructor) {
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found. Add it to .env');
    process.exit(1);
  }
  if (!instructor) {
    console.error('❌ Usage: npm run seo:auto -- "<instructor name>" or "all"');
    process.exit(1);
  }

  const courses = loadCourses();
  const all = String(instructor).toLowerCase() === 'all';

  if (all) {
    const groups = new Map();
    for (const c of courses) {
      if (issuesFor(c.seoDescription, c).length === 0) continue;
      const key = c.instructor || '(no instructor)';
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    const list = [...groups.entries()].sort((a, b) => b[1] - a[1]);
    const totalCourses = list.reduce((s, [, n]) => s + n, 0);
    console.log(`🤖 Processing ${list.length} instructor(s) — ${totalCourses} course(s) need fixing...`);

    let totalApplied = 0;
    const allBad = [];
    for (const [name, count] of list) {
      console.log(`▶ ${name} (${count})...`);
      const res = await processInstructor(courses, name);
      if (res.applied > 0) saveCourses(courses);
      totalApplied += res.applied;
      allBad.push(...res.bad.map((b) => `  ${name} — ${b}`));
      console.log(`   ✅ ${res.applied}/${count} applied${res.bad.length ? `, skipped ${res.bad.length}` : ''}`);
    }

    fs.mkdirSync(path.dirname(WORK_FILE), { recursive: true });
    fs.writeFileSync(
      WORK_FILE,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          model: MODEL,
          mode: 'all',
          courses: courses
            .filter((c) => c.seoDescription && c.seoDescription.length >= MIN_LEN)
            .map((c) => ({ slug: c.slug, title: c.title, seoDescription: c.seoDescription })),
        },
        null,
        2
      )
    );

    console.log(`✅ Done. Applied: ${totalApplied}/${totalCourses}`);
    if (allBad.length) {
      console.log('❌ Skipped:');
      allBad.forEach((b) => console.log(b));
    }
    if (totalApplied > 0) console.log('💾 Saved to src/data/coupons.json');
    return;
  }

  const targets = courses.filter((c) =>
    (c.instructor || '').toLowerCase().includes(instructor.toLowerCase()) &&
    issuesFor(c.seoDescription, c).length > 0
  );
  if (targets.length === 0) {
    console.log('✅ Nothing to fix for that instructor.');
    return;
  }

  console.log(`🤖 Generating with ${MODEL} for ${targets.length} course(s)...`);
  const res = await processInstructor(courses, instructor);
  if (res.applied > 0) saveCourses(courses);

  fs.mkdirSync(path.dirname(WORK_FILE), { recursive: true });
  fs.writeFileSync(
    WORK_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: MODEL,
        instructor: targets[0].instructor,
        courses: targets.map((c) => ({
          slug: c.slug,
          title: c.title,
          seoDescription: c.seoDescription,
        })),
      },
      null,
      2
    )
  );

  console.log(`✅ Applied: ${res.applied}/${targets.length}`);
  if (res.bad.length) {
    console.log('❌ Skipped:');
    res.bad.forEach((b) => console.log(`   - ${b}`));
  }
  if (res.applied > 0) console.log('💾 Saved to src/data/coupons.json (review copy in scripts/work/seo.json)');
}

function start(instructor) {
  if (!instructor) {
    console.error('❌ Usage: npm run seo:start -- "<instructor name>"');
    process.exit(1);
  }
  const matches = findTargets(instructor);
  if (matches.length === 0) {
    console.log('✅ No courses need fixing for that instructor.');
    return;
  }
  fs.mkdirSync(path.dirname(WORK_FILE), { recursive: true });
  const out = {
    instructor: matches[0].instructor,
    year: YEAR,
    minLength: MIN_LEN,
    maxLength: MAX_LEN,
    courses: matches.map((c) => ({
      slug: c.slug,
      title: c.title,
      instructor: c.instructor,
      category: c.category,
      subcategory: c.subcategory,
      discountPercent: realDiscountPercent(c),
      currentDescription: c.description,
      currentSeoDescription: c.seoDescription,
      seoDescription: '',
    })),
  };
  fs.writeFileSync(WORK_FILE, JSON.stringify(out, null, 2));
  console.log(`📄 ${matches.length} course(s) dumped to scripts/work/seo.json`);
  console.log('Next:');
  console.log('  1. Open scripts/work/seo.json');
  console.log(`  2. Fill every "seoDescription" (${MIN_LEN}-${MAX_LEN} chars, unique wording)`);
  console.log('  3. Run: npm run seo:finish');
}

function finish() {
  if (!fs.existsSync(WORK_FILE)) {
    console.error('❌ scripts/work/seo.json not found. Run npm run seo:start -- "<instructor>" first.');
    process.exit(1);
  }
  const dump = JSON.parse(fs.readFileSync(WORK_FILE, 'utf8').replace(/^\uFEFF/, ''));
  const courses = loadCourses();
  const bySlug = new Map(courses.map((c) => [c.slug, c]));

  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  const updatedSlugs = new Set((dump.courses || []).map((x) => x.slug));
  for (const c of courses) {
    if (updatedSlugs.has(c.slug)) used.delete(normalize(c.seoDescription));
  }

  let applied = 0;
  const bad = [];
  for (const item of dump.courses || []) {
    const course = bySlug.get(item.slug);
    if (!course) { bad.push(`${item.slug} (not found)`); continue; }
    const desc = (item.seoDescription || '').trim();
    if (!desc) { bad.push(`${item.slug} (empty)`); continue; }
    const issues = issuesFor(desc, course);
    if (used.has(normalize(desc))) issues.push('duplicateWording');
    if (issues.length) { bad.push(`${item.slug} (${issues.join(', ')})`); continue; }
    course.seoDescription = desc;
    used.add(normalize(desc));
    applied++;
  }

  if (applied > 0) saveCourses(courses);
  console.log(`✅ Applied: ${applied} course(s)`);
  if (bad.length) {
    console.log('❌ Not applied (fix scripts/work/seo.json then rerun):');
    bad.forEach((b) => console.log(`   - ${b}`));
  }
  if (applied > 0) console.log('💾 Saved to src/data/coupons.json');
}

function dump() {
  const courses = loadCourses();
  const pending = courses.filter((c) => issuesFor(c.seoDescription, c).length > 0);
  const byInstructor = new Map();
  for (const c of pending) {
    const key = c.instructor || '(none)';
    if (!byInstructor.has(key)) byInstructor.set(key, []);
    byInstructor.get(key).push(c);
  }
  const order = [...byInstructor.entries()].sort((a, b) => b[1].length - a[1].length);
  const lines = [];
  for (const [, list] of order) {
    list.sort((a, b) => (a.slug < b.slug ? -1 : 1));
    for (const c of list) {
      const desc = (c.description || '').length > 600 ? c.description.slice(0, 600) + '…' : c.description;
      lines.push(
        JSON.stringify({
          slug: c.slug,
          title: c.title,
          category: c.category,
          subcategory: c.subcategory,
          instructor: c.instructor,
          discountPercent: realDiscountPercent(c),
          description: desc,
        })
      );
    }
  }
  fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true });
  fs.writeFileSync(PENDING_FILE, lines.join('\n') + '\n');
  console.log(`📄 ${lines.length} course(s) dumped to scripts/work/pending.json`);
  console.log('Next: write batch files {"<slug>": "<body>"}, then run: npm run seo:apply -- <file>');
}

function apply(file) {
  if (!file) {
    console.error('❌ Usage: npm run seo:apply -- scripts/work/batch-1.json');
    process.exit(1);
  }
  const batch = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8').replace(/^\uFEFF/, ''));
  const courses = loadCourses();
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  const slugs = Object.keys(batch);

  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  for (const s of slugs) {
    const c = bySlug.get(s);
    if (c) used.delete(normalize(c.seoDescription));
  }

  const appliedSlugs = new Set();
  let applied = 0;
  const bad = [];
  for (const [slug, body0] of Object.entries(batch)) {
    const course = bySlug.get(slug);
    if (!course) { bad.push(`${slug} (not found)`); continue; }
    const body = String(body0 || '').trim();
    if (!body) { bad.push(`${slug} (empty body)`); continue; }
    const desc = assembleDesc(course, body);
    const issues = issuesFor(desc, course);
    if (used.has(normalize(desc))) issues.push('duplicateWording');
    if (issues.length) { bad.push(`${slug} (${issues.join(', ')})`); continue; }
    course.seoDescription = desc;
    used.add(normalize(desc));
    appliedSlugs.add(slug);
    applied++;
  }

  if (applied > 0) saveCourses(courses);
  console.log(`✅ Applied: ${applied} course(s)`);
  if (bad.length) {
    console.log('❌ Not applied:');
    bad.forEach((b) => console.log(`   - ${b}`));
  }

  if (fs.existsSync(PENDING_FILE)) {
    const remaining = fs
      .readFileSync(PENDING_FILE, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .filter((l) => {
        try {
          return !appliedSlugs.has(JSON.parse(l).slug);
        } catch {
          return true;
        }
      });
    fs.writeFileSync(PENDING_FILE, remaining.join('\n') + (remaining.length ? '\n' : ''));
    console.log(`🗂  ${remaining.length} course(s) still pending in scripts/work/pending.json`);
  }
}

function preview(file) {
  if (!file) {
    console.error('❌ Usage: npm run seo:preview -- <file>');
    process.exit(1);
  }
  const batch = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8').replace(/^\uFEFF/, ''));
  const courses = loadCourses();
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  for (const s of Object.keys(batch)) {
    const c = bySlug.get(s);
    if (c) used.delete(normalize(c.seoDescription));
  }
  let ok = 0;
  for (const [slug, body0] of Object.entries(batch)) {
    const course = bySlug.get(slug);
    if (!course) { console.log(`   ✗ ${slug} (not found)`); continue; }
    const body = String(body0 || '').trim();
    if (!body) { console.log(`   ✗ ${slug} (empty body)`); continue; }
    const desc = assembleDesc(course, body);
    const issues = issuesFor(desc, course);
    if (used.has(normalize(desc))) issues.push('duplicateWording');
    if (issues.length) {
      console.log(`   ✗ ${slug} (${desc.length}) ${issues.join(', ')}`);
    } else {
      ok++;
      used.add(normalize(desc));
    }
  }
  console.log(`Preview: ${ok}/${Object.keys(batch).length} would apply OK`);
}

// ---------- Bulk hybrid generator ----------

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

function bulk(all) {
  const courses = loadCourses();
  const used = new Set(courses.map((c) => normalize(c.seoDescription)).filter(Boolean));
  const targets = all
    ? courses
    : courses.filter((c) => issuesFor(c.seoDescription, c).length > 0);
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
  if (ok > 0) saveCourses(courses);
  const remaining = courses.filter((c) => issuesFor(c.seoDescription, c).length > 0).length;
  console.log(`✅ Bulk regenerated: ${ok} course(s)${all ? ' (--all)' : ''}`);
  if (failed.length) {
    console.log('❌ Could not generate:');
    failed.forEach((s) => console.log(`   - ${s}`));
  }
  console.log(`📊 Remaining bad descriptions: ${remaining}`);
}

function check(instructor) {
  if (!instructor) {
    console.error('❌ Usage: npm run seo:check -- "<instructor name>"');
    process.exit(1);
  }
  const courses = loadCourses().filter((c) =>
    (c.instructor || '').toLowerCase().includes(instructor.toLowerCase())
  );
  if (courses.length === 0) {
    console.log('❌ No courses found for that instructor.');
    return;
  }
  const bad = courses.filter((c) => issuesFor(c.seoDescription, c).length > 0);
  console.log(`🔍 ${instructor}: ${courses.length - bad.length}/${courses.length} OK`);
  for (const c of bad) {
    console.log(`   - ${c.slug} (${issuesFor(c.seoDescription, c).join(', ')})`);
  }
  if (bad.length === 0) console.log('✅ All descriptions are good.');
}

function showHelp() {
  console.log('🔧 CourseWyn SEO helper (Gemini)');
  console.log('');
  console.log('Commands:');
  console.log('  npm run seo:auto -- "<instructor>"    Gemini generates + validates + applies');
  console.log('  npm run seo:start -- "<instructor>"   Dump courses to scripts/work/seo.json (manual)');
  console.log('  npm run seo:finish                    Apply scripts/work/seo.json (manual)');
  console.log('  npm run seo:check -- "<instructor>"   Show pass/fail for one instructor');
  console.log('  npm run seo:dump                       Dump all pending courses to scripts/work/pending.json');
  console.log('  npm run seo:apply -- <file>            Apply {"<slug>": "<body>"} batch file');
  console.log('  npm run seo:preview -- <file>          Dry-run check a batch file without applying');
  console.log('  npm run seo:bulk                        Regenerate bad descriptions from course data');
  console.log('  npm run seo:bulk -- --all               Regenerate descriptions for ALL courses');
  console.log('');
  console.log('Env (.env): GEMINI_API_KEY=..., GEMINI_MODEL=gemini-2.5-flash (optional)');
}

const command = process.argv[2];

switch (command) {
  case 'auto':
    await auto(process.argv[3]);
    break;
  case 'start':
    start(process.argv[3]);
    break;
  case 'finish':
    finish();
    break;
  case 'dump':
    dump();
    break;
  case 'apply':
    apply(process.argv[3]);
    break;
  case 'preview':
    preview(process.argv[3]);
    break;
  case 'bulk':
    bulk(process.argv[3] === '--all');
    break;
  case 'check':
    check(process.argv[3]);
    break;
  default:
    showHelp();
    break;
}

#!/usr/bin/env node
/**
 * Featured / OG image generator for CoursesWyn.
 *
 * One design system, one layout: periwinkle brand palette, oversized outline
 * keyword on the right, two-line headline, fixed chrome (logo lockup, category
 * pill, kicker, footer rule). Only the text changes per image, so every card
 * reads as CoursesWyn at a glance.
 *
 * Usage:
 *   node scripts/generate-og.mjs                  # every blog post + every static page
 *   node scripts/generate-og.mjs --blog           # blog posts only
 *   node scripts/generate-og.mjs --pages          # static pages only
 *   node scripts/generate-og.mjs --only slug-a,og-home
 *   node scripts/generate-og.mjs --dry            # report text fit, write nothing
 *   node scripts/generate-og.mjs --check          # verify every image exists + 1200x630
 *
 * Blog posts without an entry in scripts/og-specs.mjs are rendered from an
 * auto-derived spec (keyword, headline, category and kicker guessed from the
 * frontmatter), so a brand-new article gets a usable card with no setup.
 *
 * Needs sharp (project dependency) and the brand fonts installed locally
 * (Space Grotesk Bold, IBM Plex Mono). This is an authoring tool: images are
 * generated once and committed, so the build and CI never run it.
 */

import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { POST_SPECS, PAGE_SPECS } from './og-specs.mjs';

const W = 1200;
const H = 630;
const CARD_W = 600;
const CARD_H = 315;

const INK = '#0b0e14';
const CREAM = '#e8e4d6';
const ACC = '#A9C7FF'; // --brand
const ACC2 = '#D6E4FF'; // --brand-hover

const BLOG_DIR = 'src/content/blog';
const OUT_DIR = 'public/assets/images';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------ *
 * Text measurement — same rasteriser as the output, so the fit checks
 * reflect what actually lands in the JPEG.
 * ------------------------------------------------------------------ */
const measureCache = new Map();
async function measure(text, { size, family, weight = 700, letterSpacing = 0 }) {
  const key = `${text}|${size}|${family}|${weight}|${letterSpacing}`;
  if (measureCache.has(key)) return measureCache.get(key);
  const pad = 80;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="${size * 3}">
    <text x="${pad}" y="${size * 2}" font-family="${family}" font-weight="${weight}" font-size="${size}"
      letter-spacing="${letterSpacing}" fill="#fff">${esc(text)}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()
    .then((b) => sharp(b).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true }));
  const width = Math.max(0, info.width - pad);
  measureCache.set(key, width);
  return width;
}

/** Fit `text` to a target width. Text width scales linearly with font size, so one
 *  measurement at 100px plus a correction step is enough (much faster than a search). */
async function fitSize(text, target, opts) {
  const clamp = (n) => Math.max(40, Math.min(320, Math.round(n)));
  const w100 = await measure(text, { ...opts, size: 100 });
  if (!w100) return 100;
  let size = clamp((target * 100) / w100);
  const w = await measure(text, { ...opts, size });
  if (w > 0 && Math.abs(w - target) > 4) size = clamp((size * target) / w);
  return size;
}

/* ------------------------------------------------------------------ *
 * Frontmatter
 * ------------------------------------------------------------------ */
async function readFrontmatter(slug) {
  for (const file of ['index.mdx', 'index.md']) {
    const p = path.join(BLOG_DIR, slug, file);
    if (!existsSync(p)) continue;
    const raw = await readFile(p, 'utf8');
    const block = raw.split(/^---$/m)[1] ?? '';
    const get = (key) => (block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) ?? [])[1]?.trim();
    const tagsBlock = (block.match(/^tags:\s*\n((?:[ \t]*-[^\n]*\n)+)/m) ?? [])[1] ?? '';
    const tags = [...tagsBlock.matchAll(/-\s*(.+)/g)].map((m) => m[1].trim().replace(/^["']|["']$/g, ''));
    return { title: (get('title') ?? '').replace(/^["']|["']$/g, ''), updatedAt: get('updatedAt'), pubDate: get('pubDate'), tags };
  }
  return { title: '', tags: [] };
}

/** Footer label comes from the post's real updatedAt, so the image never looks fresher than the page. */
function dateLabelFor(fm) {
  const iso = fm.updatedAt || fm.pubDate;
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return 'UPDATED NOV 2026';
  return `UPDATED ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* ------------------------------------------------------------------ *
 * Auto-derived spec for posts that are not in og-specs.mjs
 * ------------------------------------------------------------------ */
const ACRONYMS = ['AIGP', 'COMPTIA', 'WINDSURF', 'NOTEBOOK', 'LANGCHAIN', 'COPILOT', 'CLAUDE', 'CURSOR', 'MLOPS', 'CCA', 'MCP', 'RAG', 'LLM', 'SQL', 'DSA', 'GPT', 'AWS', 'GCP', 'API', 'NFT', 'QA', 'RL', 'ML', 'AI', '3D', 'n8n'];
const STOPWORDS = new Set(['best', 'top', 'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'are', 'you', 'what', 'how', 'why', 'guide', 'review', 'reviews', 'courses', 'course', 'udemy', 'on', 'in', 'of', 'to', 'vs', 'is', 'it', 'worth', 'beginners', 'beginner']);

/** Split a cleaned title into two balanced lines (character-length heuristic). */
function splitLines(clean) {
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [clean];
  let best = null;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length) * 2 + Math.abs(a.length - b.length);
    if (!best || score < best.score) best = { a, b, score };
  }
  return [best.a, best.b];
}

function deriveSpec(slug, fm) {
  const title = fm.title || slug.replace(/-/g, ' ');
  const year = (title.match(/20(2[5-9])/) ?? [])[1];
  const clean = title
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s+in\s+20(2[5-9])\b/gi, '')
    .replace(/\b(19|20)\d\d\b/g, '')
    .replace(/^(what are|what is|what's|which are|how to)\s+/i, '')
    .replace(/\s+([?.!,])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[\s:;,]+$/, '');

  const acronym = ACRONYMS.find((a) => new RegExp(`(^|[^a-z0-9])${a}([^a-z0-9]|$)`, 'i').test(title));
  const words = clean.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase()) && w.length >= 3);
  const keyword = (acronym ?? words.sort((a, b) => b.length - a.length)[0] ?? clean.split(' ')[0] ?? 'UDEMY')
    .toUpperCase()
    .slice(0, 10);

  const category = (fm.tags?.[0] ?? 'UDEMY COURSES').toUpperCase().slice(0, 16);
  const kicker = year ? `LIVE COURSE DATA \u00b7 ${year}` : 'VERIFIED COURSE DATA';

  return { keyword, lines: splitLines(clean), category, kicker, auto: true };
}

/* ------------------------------------------------------------------ *
 * SVG
 * ------------------------------------------------------------------ */
function chrome({ category, kicker, dateLabel }) {
  const pillW = Math.round(30 + category.length * 9.6);
  const pillX = 1136 - pillW;
  return `
  <defs>
    <radialGradient id="glow" cx="76%" cy="14%" r="66%">
      <stop offset="0%" stop-color="${ACC}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${ACC}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACC2}"/>
      <stop offset="1" stop-color="${ACC}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.035"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <rect x="64" y="54" width="46" height="46" rx="10" fill="url(#mark)"/>
  <path d="M77 66l11 10-11 10" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M86 90h13" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/>
  <text x="124" y="78" font-family="Space Grotesk" font-weight="700" font-size="27" fill="${CREAM}">CoursesWyn</text>
  <text x="125" y="97" font-family="IBM Plex Mono" font-weight="600" font-size="9.5" letter-spacing="2.4" fill="${ACC}">VERIFIED COUPONS &#183; DAILY</text>

  <rect x="${pillX}" y="56" width="${pillW}" height="34" rx="17" fill="none" stroke="${ACC}" stroke-opacity="0.55"/>
  <text x="${1136 - pillW / 2}" y="78" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="11.5" letter-spacing="2.2" fill="${ACC}">${esc(category)}</text>

  <text x="64" y="310" font-family="IBM Plex Mono" font-weight="600" font-size="13" letter-spacing="3.4" fill="${ACC}" fill-opacity="0.9">${esc(kicker)}</text>

  <line x1="64" y1="552" x2="1136" y2="552" stroke="#ffffff" stroke-opacity="0.10"/>
  <text x="64" y="586" font-family="IBM Plex Mono" font-size="12.5" fill="${CREAM}" fill-opacity="0.55">courseswyn.com</text>
  <text x="1136" y="586" text-anchor="end" font-family="IBM Plex Mono" font-weight="600" font-size="12" letter-spacing="1.6" fill="${ACC}" fill-opacity="0.85">${esc(dateLabel)}</text>`;
}

function headline(lines, size) {
  const top = lines.length === 1 ? 408 : 374;
  return lines
    .map(
      (l, i) =>
        `<text x="64" y="${top + i * (size + 8)}" font-family="Space Grotesk" font-weight="700" font-size="${size}" letter-spacing="-1.1" fill="${CREAM}">${esc(l)}</text>`
    )
    .join('');
}

async function buildSvg(spec) {
  const { keyword, lines, category, kicker, dateLabel, keywordOpacity = 0.34 } = spec;
  const kwSize = await fitSize(keyword, spec.keywordTarget ?? 400, { family: 'Space Grotesk', weight: 700 });

  // Headline shrinks if its longest line would run into the keyword block.
  let size = 60;
  let widest = 0;
  for (const l of lines) widest = Math.max(widest, await measure(l, { size, family: 'Space Grotesk' }));
  if (widest > 700) size = Math.max(40, Math.floor((60 * 700) / widest));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${chrome({ category, kicker, dateLabel })}
  <text x="1136" y="470" text-anchor="end" font-family="Space Grotesk" font-weight="700" font-size="${kwSize}"
    fill="none" stroke="${ACC}" stroke-opacity="${keywordOpacity}" stroke-width="1.5">${esc(keyword)}</text>
  ${headline(lines, size)}
</svg>`;

  return { svg, kwSize, size, widest };
}

/* ------------------------------------------------------------------ *
 * Spec loading
 * ------------------------------------------------------------------ */
async function loadBlogSpecs(only) {
  const dirs = (await readdir(BLOG_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const specs = [];
  for (const slug of dirs) {
    if (!existsSync(path.join(BLOG_DIR, slug, 'index.md')) && !existsSync(path.join(BLOG_DIR, slug, 'index.mdx'))) continue;
    if (only && !only.includes(slug)) continue;
    const fm = await readFrontmatter(slug);
    const spec = POST_SPECS[slug] ?? deriveSpec(slug, fm);
    specs.push({ name: slug, ...spec, dateLabel: dateLabelFor(fm), card: true });
  }
  return specs;
}

function pageDateLabel() {
  const d = new Date();
  return `UPDATED ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function loadPageSpecs(only) {
  const dateLabel = pageDateLabel();
  return Object.entries(PAGE_SPECS)
    .filter(([name]) => !only || only.includes(name))
    .map(([name, spec]) => ({ name, dateLabel, ...spec, card: false }));
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */
async function main() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? null : args[i + 1];
  };
  const only = get('--only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
  const dry = args.includes('--dry');
  const check = args.includes('--check');
  const blogOnly = args.includes('--blog');
  const pagesOnly = args.includes('--pages');

  const specs = [
    ...(pagesOnly ? [] : await loadBlogSpecs(only)),
    ...(blogOnly ? [] : loadPageSpecs(only)),
  ];

  if (!specs.length) {
    console.error('No matching specs.');
    process.exit(1);
  }

  if (check) {
    const problems = [];
    for (const spec of specs) {
      const p = path.join(OUT_DIR, `${spec.name}.jpg`);
      if (!existsSync(p)) {
        problems.push(`missing image: ${p}${spec.auto ? ' (auto-derived spec)' : ''}`);
        continue;
      }
      const meta = await sharp(p).metadata();
      if (meta.width !== W || meta.height !== H) problems.push(`wrong size: ${p} is ${meta.width}x${meta.height}`);
      if (spec.card && !existsSync(path.join(OUT_DIR, `${spec.name}-600.jpg`))) problems.push(`missing card variant: ${spec.name}-600.jpg`);
    }
    if (problems.length) {
      console.error(`✗ ${problems.length} problem(s):`);
      problems.forEach((p) => console.error('  ' + p));
      process.exit(1);
    }
    console.log(`✓ ${specs.length} images present, 1200x630${specs.some((s) => s.card) ? ' (+ card variants)' : ''}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  let auto = 0;
  for (const spec of specs) {
    const { svg, kwSize, size, widest } = await buildSvg(spec);
    if (spec.auto) auto += 1;
    const base = path.join(OUT_DIR, spec.name);
    if (dry) {
      console.log(`dry ${spec.name.padEnd(60)} kw=${String(kwSize).padStart(3)}px headline=${size}px widest=${Math.round(widest)}px${spec.auto ? ' (auto)' : ''}`);
      continue;
    }
    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    await writeFile(`${base}.jpg`, buf);
    if (spec.card) {
      await writeFile(`${base}-600.jpg`, await sharp(buf).resize(CARD_W, CARD_H).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
    }
    console.log(`wrote ${spec.name}.jpg (${(buf.length / 1024).toFixed(0)}KB${spec.auto ? ', auto-derived' : ''})`);
    if (size < 50) console.log(`  ⚠ headline shrank to ${size}px — shorten it in scripts/og-specs.mjs`);
  }
  if (auto) {
    console.log(`\n⚠ ${auto} post(s) used an auto-derived spec. Add an entry to scripts/og-specs.mjs if the keyword or headline is not what you want.`);
  }
}

if (!existsSync('package.json')) {
  console.error('Run this from the repo root.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

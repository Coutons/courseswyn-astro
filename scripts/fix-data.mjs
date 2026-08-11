import fs from 'fs';

const p = 'src/data/coupons.json';
const raw = fs.readFileSync(p, 'utf8');
const courses = JSON.parse(raw.replace(/^\uFEFF/, ''));

const CP1252_EXTRA = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function toCp1252Bytes(s) {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    bytes[i] = code > 0xff ? (CP1252_EXTRA[code] ?? 0x3f) : code;
  }
  return bytes;
}

const decoder = new TextDecoder('utf-8', { fatal: false });
function fixMoji(s) {
  const out = decoder.decode(toCp1252Bytes(s));
  if (out.includes('\uFFFD') || out.includes('\u00c3')) return null;
  return out;
}

const cleanEdge = (s) => s.replace(/^[\s,]+|[\s,]+$/g, '');

let enc = 0, edge = 0;
for (const c of courses) {
  for (const [k, v] of Object.entries(c)) {
    if (typeof v !== 'string') continue;
    let nv = v;
    if (v.includes('\u00c3')) {
      const fixed = fixMoji(v);
      if (fixed) { nv = fixed; enc++; }
    }
    if (['category', 'subcategory', 'instructor', 'duration'].includes(k)) {
      const t = cleanEdge(nv);
      if (t !== nv) { nv = t; edge++; }
    }
    if (nv !== v) c[k] = nv;
  }
}

fs.writeFileSync(p, (raw.startsWith('\uFEFF') ? '\uFEFF' : '') + JSON.stringify(courses, null, 2));
console.log(`encoding fixed: ${enc} | edge whitespace/comma fixed: ${edge}`);

let moji = 0, trim = 0;
for (const c of courses) {
  for (const v of Object.values(c)) {
    if (typeof v === 'string') {
      if (v.includes('\u00c3')) moji++;
      if (v !== v.trim()) trim++;
    }
  }
}
console.log(`remaining mojibake: ${moji} | remaining edge spaces: ${trim}`);

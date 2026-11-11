# Featured & OG images

Every blog post and every shareable static page uses a generated CoursesWyn card.
One layout, one palette, only the text changes — so a link preview is recognisable
as CoursesWyn at a glance.

Do **not** upload stock images or AI art for these slots. Regenerate the card
instead; it takes seconds and stays on-brand.

```
1200×630  <slug>.jpg        OG image, article hero, JSON-LD image   ~35–45 KB
 600×315  <slug>-600.jpg    /blog listing cards via srcset          ~11–12 KB
```

Blog images live in `public/assets/images/`, so the public URL is
`/assets/images/<slug>.jpg`.

---

## TL;DR — new article

```bash
# 1. create src/content/blog/my-new-post/index.mdx with normal frontmatter
# 2. add an entry to POST_SPECS in scripts/og-specs.mjs (recommended)
# 3. generate the image + card variant
npm run og -- --only my-new-post

# 4. confirm the fit and that the file is valid
npm run og:dry -- --only my-new-post
npm run og:check
```

The post frontmatter must point at the generated file:

```yaml
image: /assets/images/my-new-post.jpg
```

That's it. The article hero, `og:image`, Twitter card, JSON-LD image and the
`/blog` card all read from that one field. The `-600.jpg` variant is generated
automatically next to it.

If you skip step 2, the generator still writes a usable card from an
auto-derived spec (see [Auto-derived fallback](#auto-derived-fallback)) and
prints a warning. Treat that as a draft: the keyword is often too generic.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run og` | Regenerate every blog post **and** every page image |
| `npm run og:blog` | Blog posts only |
| `npm run og:pages` | Static page images only (`og-*.jpg`) |
| `npm run og -- --only slug-a,og-home` | Only the named outputs |
| `npm run og:dry` | Print text-fit report, write nothing |
| `npm run og:dry -- --only slug-a` | Fit check for one post |
| `npm run og:check` | Fail if any expected image is missing or not 1200×630 |

Raw equivalent: `node scripts/generate-og.mjs [--blog|--pages] [--only a,b] [--dry] [--check]`.

Run it from the repo root. It is an authoring tool: images are committed, so the
build and CI never run it.

### Reading the dry run

```
dry best-rag-courses-on-udemy    kw=267px headline=60px widest=427px
```

- `kw` — font size of the oversized outline keyword. Anything ≥ ~110 px reads fine.
- `headline` — headline font size. 60 px is the design size; below 50 px the
  headline is too long and the generator prints a warning.
- `widest` — width of the widest headline line at 60 px. It must stay under
  ~700 px so it does not collide with the keyword block. The generator shrinks
  the headline automatically if it does not fit, but a shrunken headline looks
  weaker — shorten the line instead.

---

## Design anatomy

Fixed chrome (never changes per post):

- dark ink `#0b0e14`, 48 px grid, periwinkle radial glow
- logo chevron + `CoursesWyn` wordmark, `VERIFIED COUPONS · DAILY` subline
- category pill, top right
- mono kicker above the headline
- footer rule, `courseswyn.com` bottom left, date label bottom right

Variable text:

- `keyword` — oversized outline word, right side, periwinkle stroke
- `lines` — two-line headline, Space Grotesk Bold, cream `#e8e4d6`
- `category` — pill label
- `kicker` — small mono line

Palette: `#A9C7FF` (`--brand`), `#D6E4FF` (`--brand-hover`), ink `#0b0e14`,
cream `#e8e4d6`. If the site tokens in `src/styles/globals.css` change, update
`INK`/`ACC`/`ACC2`/`CREAM` at the top of `scripts/generate-og.mjs` too.

The footer date is **derived from the post's real `updatedAt`** (falling back to
`pubDate`), so an image can never claim to be fresher than its article. Static
pages use the month the generator ran.

---

## Spec fields (`scripts/og-specs.mjs`)

`POST_SPECS` has one entry per blog directory. The key is the directory name,
which is also the URL slug.

| Field | Required | Rules |
| --- | --- | --- |
| `keyword` | yes | 2–10 chars, uppercase. The one word a reader recognises at 300 px wide. Avoid two posts sharing a keyword if both can appear in one grid. |
| `lines` | yes | Exactly 2 strings. Each should stay ≤ ~25 characters at 60 px (≤ ~620 px wide). This is a short label, not the SEO title. |
| `category` | yes | Uppercase pill label, ≤ 16 chars. Usually the first tag. |
| `kicker` | yes | Mono line above the headline, ≤ ~34 chars reads best. |
| `keywordTarget` | no | Target pixel width for the keyword (default 400). Lower it for very wide letters if the word feels cramped. |
| `keywordOpacity` | no | Stroke opacity, default `0.34`. |

Good keywords: `RAG`, `MCP`, `AWS`, `N8N`, `SQL`, `GEN AI`, `DONNER`, `ROADMAP`.
Bad keywords: `PERSONALIZATION` (forces the font tiny), `AI ROAD` (two words),
`INTEGR` (looks truncated).

`PAGE_SPECS` uses the same shape for static pages, keyed by output filename
(`og-home`, `og-blog`, …). Page specs never emit a `-600` variant.

---

## Editing an existing article

| Change | Action |
| --- | --- |
| Title, focus keyword, category, kicker | Update its `POST_SPECS` entry, then `npm run og -- --only <slug>` |
| `updatedAt` | Regenerate: `npm run og -- --only <slug>` (footer date follows it) |
| Body only | Nothing — the image does not depend on body text |
| Slug / directory rename | Rename the `POST_SPECS` key, regenerate, move the frontmatter `image:` path, delete the old `.jpg` + `-600.jpg` |

Because the image is committed, a stale card is only possible if you forget to
regenerate after changing `updatedAt`. `npm run og:check` catches missing files,
not stale dates.

---

## Static pages

Page images use the same design but a shorter, page-appropriate keyword, and are
wired through the `image` prop of `Layout.astro`.

| File | Page | Wired in |
| --- | --- | --- |
| `og-home.jpg` | `/` | `src/pages/index.astro` |
| `og-blog.jpg` | `/blog/` | `src/pages/blog/index.astro` |
| `og-udemy-coupon-code.jpg` | `/udemy-coupon-code/` | `src/pages/udemy-coupon-code/[...page].astro` |
| `og-udemy-coupons-today.jpg` | `/udemy-coupons-today/` | `src/pages/udemy-coupons-today/index.astro` |
| `og-udemy-coupons-guide.jpg` | `/udemy-coupons-guide/` | `src/pages/udemy-coupons-guide.astro` |
| `og-how-to-redeem.jpg` | `/how-to-redeem-coupon/` | `src/pages/how-to-redeem-coupon.astro` |
| `og-how-we-test.jpg` | `/how-we-test-and-verify-udemy-coupons/` | `src/pages/how-we-test-and-verify-udemy-coupons.astro` |
| `og-vouchers-certification.jpg` | `/udemy-certification-vouchers/` | `src/pages/udemy-certification-vouchers/index.astro` |
| `og-vouchers-aws.jpg` | `/udemy-aws-exam-vouchers/` | `src/pages/udemy-aws-exam-vouchers/index.astro` |
| `og-vouchers-comptia.jpg` | `/udemy-comptia-exam-vouchers/` | `src/pages/udemy-comptia-exam-vouchers/index.astro` |
| `og-vouchers-microsoft.jpg` | `/udemy-microsoft-exam-vouchers/` | `src/pages/udemy-microsoft-exam-vouchers/index.astro` |
| `og-default.jpg` | fallback for any page without its own image | `src/layouts/Layout.astro` |

Adding a page image:

1. Add an entry to `PAGE_SPECS`.
2. `npm run og:pages -- --only og-my-page`.
3. Pass `image="/assets/images/og-my-page.jpg" imageWidth={1200} imageHeight={630}`
   to that page's `<Layout>`.

Pages that set their own `ogImage` variable (how-to, how-we-test, coupons guide)
keep it as an absolute URL for JSON-LD and a root-relative path for the hero;
update both to the new `og-*` file.

---

## Auto-derived fallback

Posts with no `POST_SPECS` entry are rendered from frontmatter:

- `keyword` — first known acronym in the title (`RAG`, `MCP`, `AWS`, …), else the
  longest non-stopword, uppercased and capped at 10 chars
- `lines` — the title with the year, parentheticals, `| site` suffix and
  question prefixes removed, split into two balanced lines
- `category` — first tag, uppercased, capped at 16 chars
- `kicker` — `LIVE COURSE DATA · <year>` or `VERIFIED COURSE DATA`

This exists so a new article is never left without a card. It is a safety net,
not the intended path: always add a real spec entry before publishing.

---

## Requirements

- Node 24 and `npm ci`.
- `sharp` — declared in `devDependencies` and installed by `npm ci`.
- Brand fonts installed locally:
  - Space Grotesk **Bold**
  - IBM Plex Mono **Regular** and **SemiBold**

On a fresh machine, copy the TTFs into `~/.fonts/` and run `fc-cache -f`. Without
them, sharp silently falls back to a system sans/mono and the layout drifts.

The generator rasterises text through sharp, so the fit measurements come from
the same renderer that produces the JPEG.

---

## Checklist before committing

```bash
npm run og:check          # every expected file exists and is 1200×630
npm run build             # ~45 s, catches missing frontmatter images
```

Then spot-check one article in the build output:

```bash
grep -o 'property="og:image" content="[^"]*"' dist/blog/<slug>/index.html
```

It should end with `/assets/images/<slug>.jpg`, and both `<slug>.jpg` and
`<slug>-600.jpg` should exist in `public/assets/images/`.

---

## What not to do

- Don't hand-upload or resize images for blog posts — regenerate.
- Don't point two posts at the same image file; the card is part of the post.
- Don't delete `<slug>-600.jpg`; `/blog` uses it through `srcset`.
- Don't add a new `POST_SPECS` key for a directory that does not exist; the
  generator iterates directories, not spec keys.
- Don't edit `public/assets/images/og-*.jpg` directly; edit `PAGE_SPECS` and
  regenerate.

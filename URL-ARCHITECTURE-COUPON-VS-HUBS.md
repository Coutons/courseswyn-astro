# URL Architecture: Coupon Detail vs Category Hubs (GitHub Pages)

## Goal
Keep a **clean semantic boundary** between:

- **Transactional entity**: individual coupon course detail pages
- **Topical hub**: category/theme pages used for topical authority

This matters because search engines treat URL folders as topical groupings.

## Current Hosting Constraint
This site is hosted on **GitHub Pages**.

- GitHub Pages is **static**
- It does **not** support true server-side **301/302 redirects**

So any URL migration must use:

- `rel=canonical` to the new URL
- `meta refresh` and/or client-side JS redirect for UX
- `noindex, follow` on legacy/stub pages to avoid indexing duplicate/legacy URLs

## Target URL Model (Decision)
### ✅ Transactional pages stay under `/coupon/`
Examples:

- `/coupon/complete-python-bootcamp/`
- `/coupon/react-2026-zero-to-hero/`
- `/coupon/django-mastery/`

These are “coupon entities” and are the correct content type for the `/coupon/` folder.

### ✅ Topical hubs live at root-level (not under `/coupon/`)
Examples:

- `/python-udemy-coupons/`
- `/web-development-udemy-coupons/`
- `/data-science-udemy-coupons/`

These are informational/topical hubs.

### ❌ Avoid hubs under `/coupon/`
Examples (legacy):

- `/coupon/python-courses/`
- `/coupon/web-development-courses/`
- `/coupon/data-analytics-courses/`

These create semantic mixing: Google can interpret everything under `/coupon/` as a single transactional cluster.

## Implementation Summary (What Changed)
### 1) Stop generating category/subcategory hubs in `/coupon/[slug]`
File:

- `src/pages/coupon/[slug].astro`

Change:

- Removed generation of:
  - `categoryPaths`
  - `subCategoryPaths`

So `/coupon/<something>-courses/` is no longer generated for every category/subcategory.

### 2) Keep only a small set of legacy aliases as redirect stubs
Still in:

- `src/pages/coupon/[slug].astro`

A small list of legacy aliases is kept *only* to prevent existing URLs from 404.

Current alias list (only those with a real hub target are emitted):

- `/coupon/python-courses/` -> `/python-udemy-coupons/`
- `/coupon/web-development-courses/` -> `/web-development-udemy-coupons/`
- `/coupon/data-analytics-courses/` -> `/data-science-udemy-coupons/`

### 3) Redirect stub page behavior
For `type === "category"` inside `src/pages/coupon/[slug].astro`, the page is now a minimal stub:

- **`robots`** set to: `noindex, follow`
- **canonical** points to the hub URL
- UX redirect:
  - `<meta http-equiv="refresh" content="0;url=...">`
  - JS `window.location.replace(...)` (reads the canonical link)
- Provides a fallback CTA button to the hub.

### 4) Allow per-page robots control
File:

- `src/layouts/MainLayout.astro`

Change:

- Added optional prop `robots` so redirect stub pages can set `noindex, follow` without changing global defaults.

## Why This Is the Best Fit for GitHub Pages
- Preserves clean semantic grouping:
  - `/coupon/` = transactional coupon entities
  - root-level hub routes = topical authority
- Avoids creating hundreds of “category pages” inside `/coupon/`
- Works without server redirects

## Notes / Future Hardening
- Ensure internal links point directly to hub URLs (root-level), not to legacy stubs.
- If in the future the site moves to Netlify/Vercel, replace redirect stubs with true **301 redirects**.

## Validation
- `npm run lint` (`astro check`) passes cleanly after these changes.

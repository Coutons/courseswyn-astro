# SEO Description Rewriting Prompt (reusable)

Copy the block below, replace `{{DUMP_FILE}}` with the path from `npm run seo:dump`, and paste into any AI. It will return a JSON file you can feed straight to `npm run seo:apply`.

---

## Prompt

You are an expert SEO copywriter for a Udemy coupon/deals website (courseswyn.com).

I will give you a JSON array of courses. Each object has:
- `slug` — unique identifier
- `title` — course title
- `instructor` — instructor name
- `category` / `subcategory`
- `currentDescription` — original Udemy short description (keywords source)
- `currentSeoDescription` — the old one to replace (often boilerplate)

Rewrite `seoDescription` for EVERY course. Follow these rules exactly:

1. **Length: 250–350 characters** (counted as plain text). Verify each one.
2. **No boilerplate** — never use phrases like "this is applicable to", "Udemy discount offers", "Udemy coupon".
3. **Structure (3 parts):**
   - Sentence 1: hook — what you'll learn/master + course format (e.g. "Master X with this hands-on Udemy course.")
   - Sentences 2–3: key topics from the course (use real keywords from `title` / `currentDescription`).
   - Final sentence: coupon/CTA — use the course's REAL `discountPercent` from the data, e.g. "Claim a verified Udemy coupon code and save 90% on <category keyword> courses in 2026." Never invent a percentage.
4. **Be specific and natural** — vary openings; do NOT copy the same template for every course.
5. **No invented facts** — only topics mentioned in the course data. No guarantees of results, jobs, or certifications unless stated in the data. The discount percentage must be the course's `discountPercent` value (already real from price data).
6. **Year = 2026.**
7. Do not use emojis.

Return ONLY a JSON object (no markdown fences, no comments):
```json
{
  "slug-of-course": "new seoDescription text...",
  "slug-of-another-course": "new seoDescription text..."
}
```

Verify final output: each value must be between 250 and 350 characters.

---

File to process: `{{DUMP_FILE}}`

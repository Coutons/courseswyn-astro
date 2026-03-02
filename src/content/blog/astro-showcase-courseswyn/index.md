---
title: "CoursesWyn in the Official Astro Showcase: How We Built a High-Performance Udemy Coupon Site with Astro"
description: "How CoursesWyn was featured in the Official Astro Showcase (February 2026) as a real-world example of building a fast, content-driven site with Astro's zero-JS architecture. Performance results, lessons learned, and our full implementation guide."
pubDate: 2026-03-01T00:00:00.000Z
updatedAt: 2026-03-01T00:00:00.000Z
author: "Andrew Derek"
image: ../../../assets/images/courseswyn-entry-astro-showcase.jpg
category: "Technology"
tags: ["astro", "web-performance", "astro-showcase", "content-sites", "islands-architecture", "udemy-coupons", "static-site-generator"]
---

## CoursesWyn Is Now in the Official Astro Showcase — Here's the Full Story

**Published: March 2026** | Lighthouse scores from [PageSpeed Insights](https://pagespeed.web.dev/) | Core Web Vitals from [Google Search Console](https://search.google.com/search-console) | Astro Showcase: [astro.build/showcase](https://astro.build/showcase/)

CoursesWyn was featured in the [Astro "What's New" blog for February 2026](https://astro.build/blog/whats-new-february-2026/) — a monthly roundup published by the official Astro team that spotlights sites built with the framework. This post is our honest account of *why* we chose Astro, *how* we built it, and what the actual performance numbers looked like before and after.

We're writing this because when we were evaluating frameworks, we couldn't find enough real case studies from small content sites. Most examples were from large engineering teams. CoursesWyn is maintained by a small team, and we hope our experience helps developers in a similar position.

---

## What CoursesWyn Does (and Why Performance Matters So Much)

CoursesWyn aggregates free and discounted Udemy coupon codes. Courses are updated daily, we serve a large share of traffic from mobile users in Southeast Asia and South Asia, and our value proposition is simple: **people should be able to find a coupon code and click through to Udemy in under two seconds on any connection.**

That single constraint shaped every technical decision we made.

Our previous setup — a JavaScript-heavy framework we won't name — worked fine for developers on fast connections. For users on Indonesian 3G or budget Android devices, it was borderline unusable. The numbers confirmed what we already felt:

| Metric | Before Astro |
|---|---|
| Largest Contentful Paint (LCP) | 3.2 seconds |
| Total page weight | 2.8 MB |
| Mobile bounce rate | ~68% |
| Lighthouse Performance score | 61/100 |

---

## Why We Chose Astro

We evaluated three options: staying with our current framework, migrating to a different JS-first meta-framework, or trying Astro. The decision came down to one insight:

**Most of our pages don't need JavaScript at all.**

A course listing page is just: a title, instructor name, category, rating, and a coupon code. There are no real-time data requirements, no user accounts, no complex UI state. The "interactivity" we needed was limited to a copy button and a search bar. 

Astro's [Islands Architecture](https://docs.astro.build/en/concepts/islands/) let us be precise about this: ship static HTML for everything by default, and only hydrate the specific components that genuinely need client-side JavaScript. That's the opposite of what JS-first frameworks do, and for our use case, it was the right call.

We also found [Astro's documentation](https://docs.astro.build/) genuinely excellent, and the [Discord community](https://astro.build/chat) helped us solve two blockers during migration within hours.

---

## Our Astro Implementation

### Static Generation for Course Pages

Every course page is pre-rendered at build time using `getStaticPaths()` and Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/). This means zero server computation on each request and instant delivery from the CDN edge.

```astro
---
// src/pages/courses/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const courses = await getCollection('courses');
  return courses.map(course => ({
    params: { slug: course.slug },
    props: { course }
  }));
}

const { course } = Astro.props;
---

<html lang="en">
  <head>
    <title>{course.data.title} — Free Coupon | CoursesWyn</title>
    <meta name="description" content={course.data.description} />
  </head>
  <body>
    <CourseDetail course={course} />
    <!-- CouponCopy only hydrates when user clicks -->
    <CouponCopy client:idle coupon={course.data.coupon} />
  </body>
</html>
```

### Content Collections for Daily Coupon Updates

We use Astro's Content Collections with a Zod schema to validate each daily import and catch errors before they reach production.

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const courses = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    instructor: z.string(),
    category: z.string(),
    rating: z.number().min(0).max(5),
    coupon: z.string().optional(),
    expiresAt: z.date().optional(),
    isFree: z.boolean().default(false),
  }),
});

export const collections = { courses };
```

This schema validation has caught several malformed coupon entries before they published. It's one of the underrated benefits of Content Collections.

### Islands for the Two Interactive Components

We have exactly two components that need JavaScript:

1. **Search bar** — loads on interaction (`client:idle`) so it doesn't block initial render
2. **Coupon copy button** — activates on click (`client:visible`)

Everything else is static HTML. That's it.

```astro
---
import SearchBar from '../components/SearchBar.jsx';
import CouponCopy from '../components/CouponCopy.jsx';
---

<!-- Loads JS only when user starts interacting -->
<SearchBar client:idle />

<!-- Loads JS only when button enters viewport -->
<CouponCopy client:visible coupon={couponCode} />
```

### Image Optimization

We use Astro's built-in `<Image />` component which automatically generates WebP variants and sets correct `width`/`height` attributes to prevent layout shift. For course thumbnails sourced from Udemy's CDN, we use the `inferSize` option.

---

## Performance Results After Migration

These numbers are from Google Search Console and PageSpeed Insights, measured over 28 days post-launch.

| Metric | Before Astro | After Astro | Change |
|---|---|---|---|
| LCP (mobile, p75) | 3.2s | 0.8s | **−75%** |
| Total page weight | 2.8 MB | 0.3 MB | **−89%** |
| Cumulative Layout Shift | 0.18 | 0.02 | **−89%** |
| Total Blocking Time | 840ms | 0ms | **−100%** |
| Lighthouse Score (mobile) | 61 | 98 | **+61 pts** |
| Mobile bounce rate | ~68% | ~26% | **−62%** |

The LCP improvement was the most immediately visible business impact. The bounce rate drop followed within the first week of the new site going live.

---

## What Astro Got Right (and One Honest Limitation)

### What worked really well

**Zero-JS by default is the right mental model.** Other frameworks make you opt *out* of JavaScript. Astro makes you opt *in*. For content sites, this forces you to think deliberately about every interactive component. We shipped less JavaScript because we were more intentional about when JavaScript was actually needed.

**The build output is clean and predictable.** The HTML Astro generates is exactly what you'd write by hand if you had infinite patience. No mystery hydration wrappers, no client-side routing overhead.

**Content Collections with Zod validation is a genuinely great DX.** We've caught more data errors at build time in the past two months than we did in a year with our old setup.

**The `client:*` directives are intuitive.** `client:load`, `client:idle`, `client:visible` — these map directly to real performance strategies. You don't need to understand React hydration internals to use them correctly.

### One honest limitation

**Incremental builds are not yet first-class.** With 100+ course pages rebuilt daily, our full build takes about 45 seconds on Vercel. This is fine for our current scale, but teams with thousands of pages will want to evaluate whether this works for their deployment cadence. Astro has been improving this — check the [roadmap](https://github.com/withastro/astro) for the latest.

---

## How We Got Featured in the Astro Showcase

Getting into the [Astro Showcase](https://astro.build/showcase/) is simpler than it sounds. There's a submission form at [astro.build/showcase/submit](https://astro.build/showcase/submit/) — you submit your URL and a short description, the Astro team reviews it, and if your site represents an interesting use of the framework, it may appear in the monthly roundup.

We submitted CoursesWyn because we thought the combination of daily content updates + static generation + emerging-market mobile performance was a less-common use case worth documenting. The Astro team agreed, and CoursesWyn appeared in the [February 2026 "What's New" post](https://astro.build/blog/whats-new-february-2026/) under the Site Showcase section.

There's no secret formula. Build something real, make it fast, submit it.

**Practical tips if you want to submit your own site:**

- Make sure your site is live and stable before submitting
- The title tag on your site's homepage becomes your showcase entry title — make it descriptive
- Sites that demonstrate interesting or less-common Astro use cases (not just another portfolio) seem to get picked up more often
- Being featured in the monthly "What's New" post (as opposed to just the main showcase page) appears to happen organically based on timing and how interesting the use case is to the editorial team

---

## Is Astro Right for Your Content Site?

Based on our experience, Astro is a strong choice if:

- Most of your pages are **content-first** (articles, product listings, documentation, landing pages)
- You serve users on **mobile or slower connections** where JavaScript parse time is a real cost
- You want **excellent SEO** out of the box with clean, pre-rendered HTML
- You only need JavaScript for **discrete, isolated interactions** rather than complex app-wide state

It may not be the best fit if:

- Your site is heavily **app-like** with complex client-side state across many components (a project management tool, a real-time dashboard)
- You need **real-time data** on most pages without full page rebuilds
- Your team is deeply invested in a specific framework ecosystem and doesn't want to learn Astro's component model

For CoursesWyn, the fit was almost perfect. Our pages are fundamentally documents — just documents that get updated daily and have a couple of interactive widgets.

---

## Getting Started with Astro

If you want to try Astro for a content site, the official resources are genuinely good:

- **Quickstart:** `npm create astro@latest` — the interactive CLI will scaffold your project
- **Tutorial:** [docs.astro.build/en/tutorial](https://docs.astro.build/en/tutorial/0-introduction/) — the official tutorial builds a full blog from scratch
- **Content Collections guide:** [docs.astro.build/en/guides/content-collections](https://docs.astro.build/en/guides/content-collections/)
- **Islands Architecture explainer:** [docs.astro.build/en/concepts/islands](https://docs.astro.build/en/concepts/islands/)
- **Community Discord:** [astro.build/chat](https://astro.build/chat) — very active, questions usually answered same day

The [Astro Showcase](https://astro.build/showcase/) itself is also worth browsing just to see the range of sites people are building with it.

---

## Conclusion

CoursesWyn's feature in the Astro February 2026 Showcase was a small but meaningful validation. More importantly, the migration solved a real problem: our users in Indonesia, India, and the Philippines can now actually use our site on the connections they have.

Astro's zero-JS-by-default model isn't a silver bullet, but for content sites where performance directly affects whether people can use your product at all, it's the right tool.

If you're building something similar — a coupon aggregator, a documentation site, a product catalog, a blog — Astro is worth a serious evaluation.

---

*CoursesWyn was featured in the [Astro What's New — February 2026](https://astro.build/blog/whats-new-february-2026/) post under Site Showcase. You can view the live site at [courseswyn.com](https://courseswyn.com) and submit your own Astro site at [astro.build/showcase/submit](https://astro.build/showcase/submit/).*

**Tags:** #AstroJS #AstroShowcase #WebPerformance #ContentSites #IslandsArchitecture #StaticSiteGenerator #UdemyCoupons

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://courseswyn.com/blog/astro-showcase-feature/#article",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://courseswyn.com/blog/astro-showcase-feature/"
      },
      "headline": "CoursesWyn in the Official Astro Showcase: How We Built a High-Performance Udemy Coupon Site with Astro",
      "description": "How CoursesWyn was featured in the Official Astro Showcase (February 2026) and what we learned building a fast, content-driven site with Astro's zero-JS architecture.",
      "image": "https://courseswyn.com/assets/images/courseswyn-entry-astro-showcase.jpg",
      "datePublished": "2026-03-01T00:00:00.000Z",
      "dateModified": "2026-03-01T00:00:00.000Z",
      "author": {
        "@type": "Person",
        "name": "Andrew Derek"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CoursesWyn",
        "logo": {
          "@type": "ImageObject",
          "url": "https://courseswyn.com/assets/images/courseswyn-logo.png"
        }
      },
      "mentions": {
        "@type": "WebPage",
        "name": "What's New in Astro - February 2026",
        "url": "https://astro.build/blog/whats-new-february-2026/"
      },
      "articleSection": "Technology",
      "keywords": "astro, astro-showcase, web-performance, islands-architecture, content-sites, static-site-generator, udemy-coupons"
    }
  ]
}
</script>
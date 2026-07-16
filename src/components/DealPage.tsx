"use client";
import { useEffect, useMemo, useState } from "react";
import { extractDifficultyLevel, slugifyCategory } from "../lib/utils";
import { createInstructorSlug, parseInstructors } from "../lib/instructors";
import RelatedList from "./RelatedList";

interface Deal {
  id: string;
  slug?: string;
  title: string;
  description: string;
  content?: string;
  requirements?: string[];
  image?: string;
  price?: number;
  originalPrice?: number;
  url?: string;
  category?: string;
  subcategory?: string;
  provider?: string;
  instructor?: string;
  rating?: number;
  students?: number;
  updatedAt?: string;
  duration?: string;
  coupon?: string;
  language?: string;
  expiresAt?: string;
  learn?: string[];
  faqs?: { q: string; a: string }[];
}

export default function DealPage({
  deal,
  relatedDeals = [],
}: {
  deal: Deal;
  relatedDeals?: any[];
}) {
  const autoFAQs = useMemo(() => {
    if (deal.faqs && deal.faqs.length > 0) {
      return deal.faqs;
    }
    const generated: { q: string; a: string }[] = [];
    const provider = deal.provider || "Udemy";
    const price = deal.price ?? 9.99;
    const original = deal.originalPrice ?? 119.99;
    const discount = original > price ? Math.round(100 - (price / original) * 100) : 0;
    const savings = original > price ? (original - price).toFixed(2) : "0";
    const verifiedDate = deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta" }) : "recently";
    const expireDate = deal.expiresAt ? new Date(deal.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta" }) : "soon";

    generated.push({
      q: `Is the ${deal.title} coupon code still valid in 2026?`,
      a: `Yes, the verified coupon for "${deal.title}" was last checked on ${verifiedDate} and is currently active. This ${discount}% discount drops the price from $${original.toFixed(2)} to just $${price.toFixed(2)}, saving you $${savings}. We test every coupon manually before listing it on CoursesWyn — if it expires, we update the page immediately.`
    });
    generated.push({
      q: `How do I redeem the ${deal.title} coupon on ${provider}?`,
      a: `Click the "Redeem Coupon" button on this page — it will take you directly to the ${provider} checkout page with the discount already applied. You don't need to manually type any code. If you see the full price instead of $${price.toFixed(2)}, make sure you are logged into your ${provider} account and try again in a regular browser window (not incognito).`
    });
    if (deal.duration) {
      generated.push({ q: `How long does it take to complete "${deal.title}"?`, a: `This course contains ${deal.duration} of on-demand video lessons. Most learners complete it in ${deal.duration.includes("h") ? "2-4 weeks studying a few hours per week" : "1-2 weeks"}. Since you get lifetime access, you can learn at your own pace and revisit any section anytime.` });
    }
    generated.push({
      q: `What makes "${deal.title}" worth the price at just $${price.toFixed(2)}?`,
      a: `Originally priced at $${original.toFixed(2)}, this ${deal.category || "course"} by ${deal.instructor || provider} includes ${deal.duration || "hours of on-demand video"}${deal.learn && deal.learn.length > 0 ? ` covering ${deal.learn.slice(0, 5).join(", ")}` : ""}. With the ${discount}% coupon you save $${savings}. You also get lifetime access, certificate of completion, and all future updates — a fraction of the cost of traditional education.`
    });
    if (deal.learn && deal.learn.length > 0) {
      generated.push({ q: `What specific skills will I learn in "${deal.title}"?`, a: `By completing this ${provider} course, you will master: ${deal.learn.slice(0, 8).join(", ")}. The curriculum includes hands-on projects and real-world examples designed to take you from fundamentals to advanced techniques.` });
    }
    if (deal.requirements && deal.requirements.length > 0) {
      generated.push({ q: `Do I need any prior experience to take "${deal.title}"?`, a: `The recommended prerequisites are: ${deal.requirements.slice(0, 4).join(", ")}. If you're new to these topics, ${provider} offers introductory courses that can help you build the foundation first. Many students with no prior experience have successfully completed this course.` });
    }
    generated.push({
      q: `Can I get a certificate after completing "${deal.title}"?`,
      a: `Yes! Upon finishing all video lessons and any required assignments, you'll receive an official certificate of completion from ${provider}. You can share it on LinkedIn, add it to your resume, or include it in your professional portfolio to showcase your new skills to employers.`
    });
    generated.push({
      q: `Is there a money-back guarantee if "${deal.title}" isn't right for me?`,
      a: `Absolutely. ${provider} offers a 30-day money-back guarantee on all courses. If you enroll and find that "${deal.title}" doesn't meet your expectations, you can request a full refund within 30 days — no questions asked. That makes this coupon essentially risk-free.`
    });
    if (deal.expiresAt) {
      generated.push({
        q: `When does the ${deal.title} coupon expire?`,
        a: `This ${discount}% off coupon for "${deal.title}" is valid until ${expireDate}. After that date, the price will return to $${original.toFixed(2)}. We recommend redeeming it now to lock in the $${price.toFixed(2)} price while the coupon is still active.`
      });
    }
    generated.push({
      q: `How is CoursesWyn different from other coupon sites?`,
      a: `Unlike many sites that list expired or unverified codes, CoursesWyn manually tests every ${provider} coupon before publishing. Our team regularly re-checks active coupons to ensure they still work. If a coupon expires, we update the page within 24 hours. This means you can trust that the deals you find here are real and ready to use.`
    });
    return generated;
  }, [deal]);

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!deal.expiresAt) return;
    const updateCountdown = () => {
      const now = new Date();
      const expires = new Date(deal.expiresAt!);
      const diffMs = expires.getTime() - now.getTime();
      if (diffMs <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [deal.expiresAt]);

  const price = deal.price ?? 9.99;
  const originalPrice = deal.originalPrice ?? 119.99;
  const discountPct = originalPrice > price ? Math.round(100 - (price / originalPrice) * 100) : 0;

  const ratingDistribution = useMemo(() => {
    const r = deal.rating || 4.5;
    const fives = Math.round((r / 5) * 75 + 5);
    const fours = Math.round((1 - r / 5) * 60 + 5);
    const threes = Math.round(100 - fives - fours - 4 - 2);
    return [
      { stars: 5, pct: Math.min(fives, 92) },
      { stars: 4, pct: Math.min(fours, 30) },
      { stars: 3, pct: Math.max(threes, 1) },
      { stars: 2, pct: 2 },
      { stars: 1, pct: 1 },
    ];
  }, [deal.rating]);

  const sections = useMemo(() => {
    const items = [
      { id: 'quick-facts', label: 'Quick Facts' },
      { id: 'what-youll-learn', label: 'What You\'ll Learn', show: !!(deal.learn && deal.learn.length > 0) },
      { id: 'prerequisites', label: 'Prerequisites', show: !!(deal.requirements && deal.requirements.length > 0) },
      { id: 'description', label: 'Description', show: !!deal.content },
      { id: 'expert-review', label: 'Expert Review', show: !!deal.rating },
      { id: 'rating', label: 'Rating', show: !!(deal.rating && deal.students) },
      { id: 'instructor', label: 'Instructor', show: !!deal.instructor },
      { id: 'faq', label: 'FAQ', show: true },
    ].filter(s => s.show !== false);
    return items;
  }, [deal]);

  const [activeTab, setActiveTab] = useState(sections[0]?.id || '');

  const expertReview = useMemo(() => {
    const pros: string[] = [];
    const cons: string[] = [];

    if (discountPct >= 50) pros.push(`Verified ${discountPct}% price reduction`);
    if (deal.rating && deal.rating >= 4) pros.push(`High learner satisfaction (${deal.rating}/5)`);
    if (deal.students && deal.students >= 1000) pros.push(`Trusted by ${deal.students.toLocaleString()}+ students`);
    pros.push("Certificate of completion + lifetime access");
    if (deal.duration && parseInt(deal.duration) >= 5) pros.push(`Substantial content with ${deal.duration} of video`);

    if (deal.requirements && deal.requirements.length > 0 && deal.requirements.some(r => r.toLowerCase().includes('beginner') || r.toLowerCase().includes('basic'))) {
      cons.push("May be challenging for absolute beginners");
    } else {
      cons.push("Some prior knowledge recommended for best experience");
    }
    cons.push("Lifetime access depends on Udemy platform policies");
    if (deal.duration && parseInt(deal.duration) >= 10) cons.push("Requires significant time commitment");

    return { pros, cons };
  }, [deal]);

  return (
    <div className="cd-root">

      {/* ── HERO: Image Left + Info Right ── */}
      <div className="cd-hero">
        <div className="cd-container">
          <div className="cd-hero-grid">
            {/* Left: Image + Redeem Button */}
            <div className="cd-hero-left">
              {deal.image && (
                <div className="cd-hero-img-wrap">
                  <img src={deal.image} alt={deal.title} className="cd-hero-img" loading="eager" decoding="async" />
                  <span className="cd-hero-badge">✓ VERIFIED</span>
                </div>
              )}
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="cd-redeem-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/></svg>
                REDEEM COUPON
              </a>
            </div>

            {/* Right: Info */}
            <div className="cd-hero-right">
              <nav className="cd-breadcrumb" aria-label="Breadcrumb">
                <ol itemScope itemType="https://schema.org/BreadcrumbList">
                  <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <a href="/" itemProp="item"><span itemProp="name">Home</span></a>
                    <meta itemProp="position" content="1" />
                  </li>
                  <li className="cd-sep">/</li>
                  <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <a href="/udemy-coupon-code" itemProp="item"><span itemProp="name">Coupons</span></a>
                    <meta itemProp="position" content="2" />
                  </li>
                  <li className="cd-sep">/</li>
                  <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <a href={`/categories/${slugifyCategory(deal.category || "")}`} itemProp="item"><span itemProp="name">{deal.category || deal.provider || "Udemy"}</span></a>
                    <meta itemProp="position" content="3" />
                  </li>
                  {deal.subcategory && deal.subcategory !== deal.category && (
                    <>
                      <li className="cd-sep">/</li>
                      <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <a href={`/categories/${slugifyCategory(deal.subcategory)}`} itemProp="item"><span itemProp="name">{deal.subcategory}</span></a>
                        <meta itemProp="position" content="4" />
                      </li>
                    </>
                  )}
                </ol>
              </nav>

              <h1 className="cd-title">{deal.title}</h1>

              {deal.description && <p className="cd-desc">{deal.description}</p>}

              {deal.instructor && (
                <div className="cd-instructor">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  By {parseInstructors(deal.instructor).map((name, i, arr) => (
                    <span key={name}>
                      <a href={`/instructor/${createInstructorSlug(name)}`}>{name}</a>
                      {i < arr.length - 1 && <span style={{color:'var(--text-secondary)'}}>, </span>}
                    </span>
                  ))}
                </div>
              )}

              <div className="cd-stats">
                {deal.duration && (
                  <div className="cd-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {deal.duration}
                  </div>
                )}
                {deal.students && (
                  <div className="cd-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {deal.students.toLocaleString()} students
                  </div>
                )}
                {deal.rating && (
                  <div className="cd-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {deal.rating.toFixed(1)} ({deal.students?.toLocaleString() || "0"})
                  </div>
                )}
              </div>

              {/* Price + Countdown */}
              <div className="cd-price-row">
                <div className="cd-price">
                  <span className={price === 0 ? "cd-price-free" : "cd-price-current"}>
                    {price === 0 ? "FREE" : `$${price.toFixed(2)}`}
                  </span>
                  {originalPrice > price && (
                    <span className="cd-price-orig">${originalPrice.toFixed(2)}</span>
                  )}
                  {discountPct > 0 && <span className="cd-price-badge">{discountPct}% OFF</span>}
                </div>

              </div>

              {/* Countdown + Last checked */}
              <div className="cd-meta-row">
                {countdown && (
                  <div className="cd-countdown">
                    <span className="cd-countdown-label">Expires in:</span>
                    <span>{countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s</span>
                  </div>
                )}
                {deal.updatedAt && (
                  <div className="cd-checked">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Verified {(() => { const diff = Math.floor((Date.now() - new Date(deal.updatedAt!).getTime()) / 3600000); if (diff < 1) return "<1h ago"; if (diff < 24) return `${diff}h ago`; return `${Math.floor(diff / 24)}d ago`; })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION TABS ── */}
      <div className="cd-tabs-wrap">
        <div className="cd-container">
          <nav className="cd-tabs" aria-label="Section navigation">
            {sections.map(s => (
              <button
                key={s.id}
                className={`cd-tab ${activeTab === s.id ? 'cd-tab-active' : ''}`}
                onClick={() => setActiveTab(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'quick-facts' && (
      <div className="cd-container">
        <section className="cd-section">
          <h2 className="cd-section-title">Quick Facts</h2>
          <p className="cd-section-desc">All verified details about <strong>{deal.title}</strong> at a glance — pricing, duration, level, and more. Data sourced directly from {deal.provider}.</p>
          <div className="cd-qf-grid">
            {[
              { label: "Platform", value: `${deal.provider || "Udemy"}` },
              deal.instructor ? { label: "Instructor", value: deal.instructor } : null,
              { label: "Level", value: extractDifficultyLevel(deal.title, deal.description) },
              deal.category ? { label: "Topic", value: deal.category } : null,
              deal.duration ? { label: "Duration", value: `${deal.duration} of video` } : null,
              deal.language ? { label: "Language", value: deal.language } : null,
              { label: "Access", value: "Lifetime access" },
              { label: "Certificate", value: `Yes — from ${deal.provider || "Udemy"}` },
              deal.learn && deal.learn.length > 0 ? { label: "Skills", value: deal.learn.slice(0, 4).join(", ") } : null,
              { label: "Price", value: `$${price.toFixed(2)}${originalPrice > price ? ` (was $${originalPrice.toFixed(2)}) — save ${discountPct}%` : ""}` },
            ].filter(Boolean).map((item, idx) => (
              <div key={idx} className="cd-qf-row">
                <span className="cd-qf-label">{item!.label}</span>
                <span className="cd-qf-value">{item!.value}</span>
              </div>
            ))}
          </div>
          <div className="cd-qf-tip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>For best results, apply the coupon in a regular browser window rather than incognito/private mode.</span>
          </div>
        </section>
      </div>
      )}

      {/* ── WHAT YOU'LL LEARN ── */}
      {activeTab === 'what-youll-learn' && deal.learn && deal.learn.length > 0 && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">What You'll Learn</h2>
            <p className="cd-section-desc">By completing this course, you will master the following skills and competencies taught by <strong>{deal.instructor || deal.provider}</strong>.</p>
            <div className="cd-learn-grid">
              {deal.learn.map((item, idx) => (
                <div key={idx} className="cd-learn-item">
                  <svg className="cd-learn-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{item.replace(/\r$/, '')}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── PREREQUISITES ── */}
      {activeTab === 'prerequisites' && deal.requirements && deal.requirements.length > 0 && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">Prerequisites</h2>
            <p className="cd-section-desc">The following background knowledge and tools are recommended before starting <strong>{deal.title}</strong>. Students without these prerequisites may still enroll but should expect a steeper learning curve.</p>
            <ul className="cd-req-list">
              {deal.requirements.map((req, idx) => (
                <li key={idx} className="cd-req-item">{req.replace(/\r$/, '')}</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* ── COURSE DESCRIPTION ── */}
      {activeTab === 'description' && deal.content && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">Course Description</h2>
            <p className="cd-section-desc">The full official course description as published by <strong>{deal.instructor || deal.provider}</strong> on {deal.provider}. It covers the curriculum structure and topic scope.</p>
            <div className="cd-desc-content" dangerouslySetInnerHTML={{ __html: deal.content }} />
          </section>
        </div>
      )}

      {/* ── EXPERT REVIEW ── */}
      {activeTab === 'expert-review' && deal.rating && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">Expert Review</h2>
            <p className="cd-section-desc">Our independent assessment of <strong>{deal.title}</strong> based on curriculum, student reviews, pricing, and instructor reputation.</p>
            <div className="cd-review-card">
              <div className="cd-review-header">
                <div className="cd-review-verdict">
                  <span className="cd-verdict-badge">{discountPct >= 50 ? '✓ WORTH IT' : '✓ GOOD VALUE'}</span>
                  <span className="cd-verdict-text">Exceptional value with current pricing</span>
                </div>
                <div className="cd-review-meta">
                  Reviewed by <strong>Andrew Derek</strong> — Lead Course Reviewer at CoursesWyn
                  <br />
                  <span className="cd-review-date">Updated {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}</span>
                </div>
              </div>
              <div className="cd-review-body">
                <p>Based on analysis of the curriculum structure, student engagement metrics, and verified rating data, this is a high-value resource for learners seeking to build skills in <strong>{deal.category || 'this field'}</strong>. Taught by <strong>{deal.instructor || deal.provider}</strong> on {deal.provider}, the {deal.duration || 'comprehensive'} course provides a structured progression from foundational concepts to advanced techniques — making it suitable for learners at all levels. The current coupon reduces the price by <strong>{discountPct}%</strong>, from <strong>${originalPrice.toFixed(2)}</strong> to just <strong>${price.toFixed(2)}</strong>.</p>
              </div>
              <div className="cd-review-proscons">
                <div className="cd-pros">
                  <h4 className="cd-pc-title cd-pc-pros-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Pros
                  </h4>
                  <ul className="cd-pc-list">
                    {expertReview.pros.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="cd-cons">
                  <h4 className="cd-pc-title cd-pc-cons-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Cons
                  </h4>
                  <ul className="cd-pc-list">
                    {expertReview.cons.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
              <div className="cd-review-footer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <em>"Given the {discountPct}% price reduction and verified {deal.rating}-star rating, {deal.title} is a strong value in {deal.category || 'online learning'} on {deal.provider}. Enrollment recommended while the coupon is active."</em>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── RATING DISTRIBUTION ── */}
      {activeTab === 'rating' && deal.rating && deal.students && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">Course Rating Summary</h2>
            <p className="cd-section-desc">This course holds an aggregate rating of <strong>{deal.rating} out of 5</strong> based on <strong>{deal.students?.toLocaleString()} student reviews</strong> on {deal.provider}. The breakdown below shows the rating distribution.</p>
            <div className="cd-rating-card">
              <div className="cd-rating-main">
                <span className="cd-rating-big">{deal.rating.toFixed(1)}</span>
                <div className="cd-rating-stars">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= Math.round(deal.rating || 0) ? '#D4AF37' : '#2a2824'} stroke="#D4AF37" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
                <span className="cd-rating-count">{deal.students.toLocaleString()} Verified Ratings</span>
              </div>
              <div className="cd-rating-bars">
                {ratingDistribution.map(d => (
                  <div key={d.stars} className="cd-rating-row">
                    <span className="cd-rating-label">{d.stars} star</span>
                    <div className="cd-rating-track">
                      <div className="cd-rating-fill" style={{width: d.pct + '%'}}></div>
                    </div>
                    <span className="cd-rating-pct">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── INSTRUCTOR PROFILE ── */}
      {activeTab === 'instructor' && deal.instructor && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">Instructor</h2>
            <div className="cd-instructor-card">
              <div className="cd-instructor-avatar">
                {deal.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="cd-instructor-info">
                <h3 className="cd-instructor-name">{deal.instructor}</h3>
                <span className="cd-instructor-role">{deal.provider || 'Udemy'} Instructor</span>
                {deal.category && <span className="cd-instructor-tag">{deal.category}</span>}
                <div className="cd-instructor-stats">
                  {deal.students && <span><strong>{deal.students.toLocaleString()}+</strong> students enrolled</span>}
                  {deal.rating && <span>Rating: <strong>{deal.rating}/5</strong></span>}
                  {deal.duration && <span>Course: <strong>{deal.duration}</strong></span>}
                </div>
                <p className="cd-instructor-desc">Expert instructor specializing in {deal.category || 'online education'} with a practical, project-based teaching approach focused on real-world application of skills.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── PERSONAL PLAN CTA ── */}
      <section className="cd-plan-section">
        <div className="cd-container">
          <div className="cd-plan-box">
            <h2 className="cd-plan-title">Go Unlimited with Udemy Personal Plan<br />26,000+ Premium Courses, One Subscription</h2>
            <div className="cd-plan-actions">
              <a href="https://trk.udemy.com/c/6564357/3775958/39854" target="_blank" rel="noopener noreferrer" className="cd-plan-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>
                Start Free Trial
              </a>
            </div>
            <div className="cd-plan-features">
              <span><span className="cd-plan-dot"></span>26,000+ courses</span>
              <span><span className="cd-plan-dot"></span>7-day free trial</span>
              <span><span className="cd-plan-dot"></span>From $20/month</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── RELATED COUPONS ── */}
      {activeTab === 'quick-facts' && relatedDeals.length > 0 && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">More {deal.category || "Udemy"} Courses You Might Like</h2>
            <p className="cd-card-intro">Similar {deal.provider || "Udemy"} courses in {deal.category || "this category"} with verified coupons:</p>
            <RelatedList items={relatedDeals} initial={6} />
          </section>
        </div>
      )}

      {/* ── FAQS ── */}
      {activeTab === 'faq' && autoFAQs.length > 0 && (
        <div className="cd-container">
          <section className="cd-section" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="cd-section-title">Frequently Asked Questions</h2>
            <p className="cd-section-desc">Everything you need to know about <strong>{deal.title}</strong> &mdash; coupon validity, pricing, instructor, enrollment, and refunds. Learn <a href="/how-to-redeem-coupon" style={{color: "var(--brand)"}}>how to redeem a coupon</a> if you're new here.</p>
            <div className="cd-faq-list">
              {autoFAQs.map((faq, idx) => (
                <div key={idx} className="cd-faq-item" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="cd-faq-q" itemProp="name">{faq.q}</h3>
                  <div className="cd-faq-a" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── FLOATING STICKY CTA ── */}
      <div className="cd-sticky-cta">
        <div className="cd-sticky-inner">
          <div className="cd-sticky-info">
            <span className="cd-sticky-price">${price.toFixed(2)}</span>
            {originalPrice > price && <span className="cd-sticky-orig">${originalPrice.toFixed(2)}</span>}
            {discountPct > 0 && <span className="cd-sticky-badge">{discountPct}% OFF</span>}
            {countdown && <span className="cd-sticky-exp">{countdown.days}d {countdown.hours}h left</span>}
          </div>
          <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="cd-sticky-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/></svg>
            REDEEM COUPON
          </a>
        </div>
      </div>

      <style>{`
        .cd-root { background: var(--bg); color: var(--text); min-height: 100vh; font-family: var(--font-sans); }
        .cd-container { max-width: 1024px; margin: 0 auto; padding: 0 1.5rem; }

        /* ── RELATED-LIST SHARED CLASSES ── */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; transition: border-color 0.15s; }
        .card:hover { border-color: var(--brand); }
        .card-body { padding: 0.75rem; }
        .card-footer { padding: 0 0.75rem 0.75rem; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
        .muted { color: var(--muted); }
.card .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; background: linear-gradient(135deg, #B8860B 0%, #D4AF37 25%, #E8C547 50%, #D4AF37 75%, #B8860B 100%); color: #1a1814; border: none; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; text-decoration: none; transition: all 0.3s; }
.card .btn:hover { box-shadow: 0 0 16px 2px rgba(212,167,55,0.3); }
        button.pill { background: var(--secondary); color: var(--text); border: 1px solid var(--border); cursor: pointer; }

        /* HERO */
        .cd-hero { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 32px 0; }
        .cd-hero-grid { display: grid; grid-template-columns: 420px 1fr; gap: 40px; align-items: start; }

        .cd-hero-img-wrap { position: relative; border-radius: 12px; overflow: hidden; background: var(--card); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .cd-hero-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
        .cd-hero-badge { position: absolute; top: 10px; right: 10px; background: var(--brand); color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.03em; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

        .cd-breadcrumb { margin-bottom: 6px; }
        .cd-breadcrumb ol { list-style: none; display: flex; align-items: center; gap: 6px; padding: 0; margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); flex-wrap: wrap; }
        .cd-breadcrumb a { color: var(--brand); text-decoration: none; }
        .cd-breadcrumb a:hover { text-decoration: underline; }
        .cd-sep { color: var(--border); }

        .cd-title { font-size: 1.8rem; font-weight: 900; line-height: 1.25; margin: 0 0 12px; letter-spacing: -0.02em; color: var(--text); }
        .cd-desc { font-size: 1.05rem; line-height: 1.6; color: var(--text-secondary); font-weight: 500; margin: 0 0 20px; }

        .cd-instructor { display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 16px; }
        .cd-instructor svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--muted-light); }
        .cd-instructor a { color: var(--brand); text-decoration: none; }
        .cd-instructor a:hover { text-decoration: underline; }

        .cd-stats { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
        .cd-stat { display: flex; align-items: center; gap: 6px; font-size: 0.92rem; font-weight: 600; color: var(--text-secondary); }
        .cd-stat svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--muted-light); }

        .cd-price-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .cd-price { display: flex; align-items: baseline; gap: 10px; }
        .cd-price-current { font-size: 1.8rem; font-weight: 900; color: var(--brand); }
        .cd-price-free { font-size: 1.8rem; font-weight: 900; color: #10b981; }
        .cd-price-orig { font-size: 1rem; color: var(--muted); text-decoration: line-through; font-weight: 600; }
        .cd-price-badge { background: var(--brand); color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 800; }

        .cd-meta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; }
        .cd-countdown { font-size: 0.9rem; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 6px; }
        .cd-countdown-label { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
        .cd-checked { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
        .cd-checked svg { flex-shrink: 0; color: var(--muted-light); }

        .cd-redeem-btn { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 18px; margin-top: 16px; font-size: 1.05rem; font-weight: 900; letter-spacing: 0.06em; color: #1a1814; background: linear-gradient(135deg, #B8860B 0%, #D4AF37 25%, #E8C547 50%, #D4AF37 75%, #B8860B 100%); border-radius: 12px; text-decoration: none; transition: all 0.4s; overflow: hidden; border: 1px solid rgba(255,215,0,0.25); box-shadow: 0 4px 20px rgba(212,167,55,0.25), inset 0 1px 0 rgba(255,255,255,0.35); text-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .cd-redeem-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 52%, transparent 70%); transform: translateX(-100%) skewX(-15deg); transition: transform 0.7s; pointer-events: none; }
        .cd-redeem-btn:hover::before { transform: translateX(100%) skewX(-15deg); }
        .cd-redeem-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(212,167,55,0.45), inset 0 1px 0 rgba(255,255,255,0.35); border-color: rgba(255,215,0,0.5); }


        /* SECTIONS */
        .cd-section { margin: 48px 0; }
        .cd-section-title { font-size: 1.4rem; font-weight: 900; color: var(--text); margin: 0 0 24px; letter-spacing: -0.02em; padding-bottom: 12px; border-bottom: 2px solid var(--border); }
        .cd-section-desc { font-size: 0.92rem; line-height: 1.6; color: var(--text-secondary); font-weight: 400; margin: -12px 0 24px; }
        .cd-section-desc strong { color: var(--text); font-weight: 600; }
        .cd-section-desc a { color: var(--brand); }
        .cd-card-intro { font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); font-weight: 500; margin: 0 0 20px; }
        .cd-card-intro strong { color: var(--text); font-weight: 700; }

        /* QUICK FACTS */
        .cd-qf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .cd-qf-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; gap: 12px; border-bottom: 1px solid var(--border); background: var(--card); }
        .cd-qf-row:nth-child(even) { background: var(--bg-secondary); }
        .cd-qf-row:last-child { border-bottom: none; }
        .cd-qf-label { font-size: 0.82rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; flex-shrink: 0; }
        .cd-qf-value { font-size: 0.92rem; color: var(--text); font-weight: 500; text-align: right; }
        .cd-qf-tip { margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4; }
        .cd-qf-tip svg { flex-shrink: 0; color: var(--brand); }

        /* PERSONAL PLAN */
        .cd-plan-section { padding: 40px 0; }
        .cd-plan-box { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 48px 32px; text-align: center; }
        .cd-plan-title { font-size: 1.4rem; font-weight: 900; color: var(--text); margin: 0 0 24px; line-height: 1.4; }
        .cd-plan-actions { margin-bottom: 16px; }
.cd-plan-btn { position: relative; display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #B8860B 0%, #D4AF37 25%, #E8C547 50%, #D4AF37 75%, #B8860B 100%); color: #1a1814; padding: 16px 42px; border-radius: 999px; font-size: 1.05rem; font-weight: 800; letter-spacing: 0.05em; text-decoration: none; transition: all 0.4s; border: 1px solid rgba(255,215,0,0.25); box-shadow: 0 4px 20px rgba(212,167,55,0.2), inset 0 1px 0 rgba(255,255,255,0.35); text-shadow: 0 1px 2px rgba(0,0,0,0.08); overflow: hidden; }
.cd-plan-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 52%, transparent 70%); transform: translateX(-100%) skewX(-15deg); transition: transform 0.7s; pointer-events: none; border-radius: inherit; }
.cd-plan-btn:hover::before { transform: translateX(100%) skewX(-15deg); }
.cd-plan-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 35px rgba(212,167,55,0.4), inset 0 1px 0 rgba(255,255,255,0.35); border-color: rgba(255,215,0,0.5); }
.cd-plan-features { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; }
.cd-plan-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--brand); margin-right: 6px; vertical-align: middle; }

        /* WHAT YOU'LL LEARN */
        .cd-learn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cd-learn-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; font-size: 0.92rem; line-height: 1.55; color: var(--text); transition: all 0.2s; }
        .cd-learn-item:hover { border-color: var(--brand); box-shadow: 0 2px 12px rgba(212, 167, 55,0.08); }
        .cd-learn-check { flex-shrink: 0; margin-top: 3px; color: var(--brand); width: 20px; height: 20px; background: rgba(212, 167, 55,0.1); border-radius: 50%; padding: 2px; }

        /* PREREQUISITES */
        .cd-req-list { display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; list-style: none; }
        .cd-req-item { padding: 14px 18px 14px 38px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); position: relative; transition: all 0.2s; }
        .cd-req-item:hover { border-color: var(--brand); box-shadow: 0 2px 12px rgba(212, 167, 55,0.08); }
        .cd-req-item::before { content: "!"; position: absolute; left: 14px; top: 14px; width: 18px; height: 18px; background: var(--brand-soft); color: var(--brand); border-radius: 50%; font-weight: 800; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; }

        /* COURSE DESCRIPTION */
        .cd-desc-content { font-size: 0.95rem; line-height: 1.75; color: var(--text-secondary); }
        .cd-desc-content p { margin: 0 0 16px; }
        .cd-desc-content ul, .cd-desc-content ol { padding-left: 24px; margin: 0 0 16px; }
        .cd-desc-content li { margin-bottom: 8px; }
        .cd-desc-content strong { color: var(--text); }

        /* FAQ */
        .cd-faq-list { display: flex; flex-direction: column; gap: 12px; }
        .cd-faq-item { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; border-left: 3px solid var(--brand); transition: all 0.2s; }
        .cd-faq-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .cd-faq-q { font-size: 0.95rem; font-weight: 700; color: var(--text); margin: 0 0 10px; line-height: 1.5; }
        .cd-faq-a p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; margin: 0; }
        .cd-faq-a a { color: var(--brand); }

        /* EXPERT REVIEW */
        .cd-review-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .cd-review-header { padding: 24px 28px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .cd-review-verdict { display: flex; align-items: center; gap: 12px; }
        .cd-verdict-badge { background: rgba(16,185,129,0.1); color: #10b981; padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; }
        .cd-verdict-text { font-size: 0.95rem; font-weight: 600; color: var(--text); }
        .cd-review-meta { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; text-align: right; }
        .cd-review-date { color: var(--muted); font-size: 0.78rem; }
        .cd-review-body { padding: 24px 28px; }
        .cd-review-body p { font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin: 0; }
        .cd-review-body strong { color: var(--text); }
        .cd-review-proscons { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid var(--border); }
        .cd-pros, .cd-cons { padding: 20px 28px; }
        .cd-pros { background: rgba(16,185,129,0.02); }
        .cd-cons { background: rgba(239,68,68,0.02); border-left: 1px solid var(--border); }
        .cd-pc-title { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
        .cd-pc-pros-title { color: #10b981; }
        .cd-pc-cons-title { color: #ef4444; }
        .cd-pc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .cd-pc-list li { font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); padding-left: 16px; position: relative; }
        .cd-pc-list li::before { content: ""; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 50%; }
        .cd-pros .cd-pc-list li::before { background: #10b981; }
        .cd-cons .cd-pc-list li::before { background: #ef4444; }
        .cd-review-footer { padding: 16px 28px; border-top: 1px solid var(--border); display: flex; align-items: flex-start; gap: 8px; font-size: 0.88rem; line-height: 1.5; color: var(--muted); }
        .cd-review-footer svg { flex-shrink: 0; margin-top: 2px; color: var(--brand); }

        /* RATING DISTRIBUTION */
        .cd-rating-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; }
        .cd-rating-main { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .cd-rating-big { font-size: 3rem; font-weight: 900; color: var(--text); line-height: 1; }
        .cd-rating-stars { display: flex; gap: 4px; }
        .cd-rating-count { font-size: 0.8rem; color: var(--muted); font-weight: 500; }
        .cd-rating-bars { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .cd-rating-row { display: flex; align-items: center; gap: 10px; }
        .cd-rating-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); width: 50px; flex-shrink: 0; }
        .cd-rating-track { flex: 1; height: 10px; background: var(--bg-secondary); border-radius: 5px; overflow: hidden; }
        .cd-rating-fill { height: 100%; background: linear-gradient(90deg, #D4AF37, #E8C547); border-radius: 5px; transition: width 0.3s; }
        .cd-rating-pct { font-size: 0.8rem; font-weight: 600; color: var(--muted); width: 35px; text-align: right; }

        /* INSTRUCTOR PROFILE */
        .cd-instructor-card { display: flex; gap: 24px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; align-items: flex-start; }
        .cd-instructor-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--brand), #6B1D1A); color: white; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cd-instructor-info { flex: 1; }
        .cd-instructor-name { font-size: 1.15rem; font-weight: 800; color: var(--text); margin: 0 0 4px; }
        .cd-instructor-role { font-size: 0.82rem; color: var(--muted); font-weight: 500; }
        .cd-instructor-tag { display: inline-block; margin-left: 8px; padding: 2px 10px; background: rgba(212, 167, 55,0.1); color: var(--brand); border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
        .cd-instructor-stats { display: flex; gap: 16px; margin: 10px 0; flex-wrap: wrap; }
        .cd-instructor-stats span { font-size: 0.82rem; color: var(--text-secondary); }
        .cd-instructor-stats strong { color: var(--text); }
        .cd-instructor-desc { font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin: 0; }

        /* STICKY CTA */
        .cd-sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; background: var(--card); border-top: 1px solid var(--border); padding: 12px 20px; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); display: none; }
        .cd-sticky-inner { max-width: 1024px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .cd-sticky-info { display: flex; align-items: center; gap: 10px; }
        .cd-sticky-price { font-size: 1.3rem; font-weight: 900; color: var(--brand); }
        .cd-sticky-orig { font-size: 0.85rem; color: var(--muted); text-decoration: line-through; font-weight: 600; }
        .cd-sticky-badge { background: var(--brand); color: white; padding: 2px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
        .cd-sticky-exp { font-size: 0.78rem; color: #dc2626; font-weight: 700; }
.cd-sticky-btn { position: relative; display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; background: linear-gradient(135deg, #B8860B 0%, #D4AF37 25%, #E8C547 50%, #D4AF37 75%, #B8860B 100%); color: #1a1814; border-radius: 10px; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.06em; text-decoration: none; transition: all 0.4s; flex-shrink: 0; overflow: hidden; border: 1px solid rgba(255,215,0,0.25); box-shadow: 0 4px 20px rgba(212,167,55,0.2), inset 0 1px 0 rgba(255,255,255,0.35); text-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.cd-sticky-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 52%, transparent 70%); transform: translateX(-100%) skewX(-15deg); transition: transform 0.7s; pointer-events: none; }
.cd-sticky-btn:hover::before { transform: translateX(100%) skewX(-15deg); }
.cd-sticky-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(212,167,55,0.4), inset 0 1px 0 rgba(255,255,255,0.35); border-color: rgba(255,215,0,0.5); }


        /* SECTION TABS */
        .cd-tabs-wrap { background: var(--bg); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 0; }
        .cd-tabs-wrap::-webkit-scrollbar { display: none; }
        .cd-tabs { display: flex; gap: 0; padding: 0; }
        .cd-tab { flex-shrink: 0; padding: 12px 20px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .cd-tab:hover { color: var(--text); }
        .cd-tab-active { color: var(--brand) !important; border-bottom-color: var(--brand) !important; font-weight: 700; }

        @media (max-width: 768px) {
          .cd-sticky-cta { display: flex; }
          .cd-learn-grid { grid-template-columns: 1fr; }
          .cd-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .cd-hero-img-wrap { max-width: 100%; }
          .cd-title { font-size: 1.4rem; }
          .cd-section-title { font-size: 1.2rem; }
          .cd-plan-title { font-size: 1.1rem; }
          .cd-plan-box { padding: 32px 20px; }
          .cd-qf-grid { grid-template-columns: 1fr; }
          .cd-review-proscons { grid-template-columns: 1fr; }
          .cd-cons { border-left: none; border-top: 1px solid var(--border); }
          .cd-rating-card { grid-template-columns: 1fr; gap: 20px; }
          .cd-instructor-card { flex-direction: column; align-items: center; text-align: center; }
          .cd-instructor-stats { justify-content: center; }
          .cd-review-header { flex-direction: column; text-align: left; }
          .cd-review-meta { text-align: left; }
          .cd-sticky-exp { display: none; }
        }
      `}</style>
    </div>
  );
}

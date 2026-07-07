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

  const enhancedStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}#course`,
        name: deal.title,
        description: deal.description || `${deal.title} - Learn from expert instructors with verified coupons`,
        url: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}`,
        image: deal.image || `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/logo.svg`,
        provider: { "@type": "Organization", name: deal.provider || "Udemy", url: deal.provider === "Udemy" ? "https://www.udemy.com" : typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com" },
        instructor: deal.instructor ? { "@type": "Person", name: deal.instructor, jobTitle: "Course Instructor", affiliation: { "@type": "Organization", name: deal.provider || "Udemy" } } : undefined,
        offers: [
          { "@type": "Offer", price: deal.price || 0, priceCurrency: "USD", availability: "https://schema.org/InStock", validThrough: deal.expiresAt || undefined, url: deal.url || `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}`, seller: { "@type": "Organization", name: deal.provider || "Udemy" } },
          deal.coupon ? { "@type": "Offer", name: `${deal.title} - Coupon Deal`, price: Math.max(0, (deal.price || 0) - ((deal.originalPrice || 0) - (deal.price || 0))), priceCurrency: "USD", availability: "https://schema.org/LimitedAvailability", validThrough: deal.expiresAt || undefined, url: deal.url || `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}`, description: `Use coupon code ${deal.coupon} for discount on ${deal.title}`, seller: { "@type": "Organization", name: deal.provider || "Udemy" } } : null,
        ].filter(Boolean),
        aggregateRating: deal.rating ? { "@type": "AggregateRating", ratingValue: deal.rating, ratingCount: deal.students || 1, bestRating: 5, worstRating: 1 } : undefined,
        timeRequired: deal.duration ? `PT${deal.duration.replace(/[^\d]/g, "")}H` : undefined,
        inLanguage: deal.language || "en",
        teaches: deal.learn ? deal.learn.join(", ") : undefined,
        educationalLevel: "Beginner to Advanced",
        educationalUse: "Professional Development",
        datePublished: deal.updatedAt || new Date().toISOString(),
        dateModified: deal.updatedAt || new Date().toISOString(),
        expires: deal.expiresAt || undefined,
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", instructor: deal.instructor ? { "@type": "Person", name: deal.instructor } : undefined },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com" },
          { "@type": "ListItem", position: 2, name: "Coupons", item: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/udemy-coupon-code` },
          deal.category ? { "@type": "ListItem", position: 3, name: deal.category, item: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/categories/${slugifyCategory(deal.category)}` } : null,
          { "@type": "ListItem", position: 4, name: deal.title, item: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}` },
        ].filter(Boolean),
      },
      {
        "@type": "FAQPage",
        "@id": `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}#faq`,
        mainEntity: autoFAQs.slice(0, 5).map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
      },
      {
        "@type": "WebPage",
        "@id": `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}#webpage`,
        url: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/coupon/${deal.slug}`,
        name: `${deal.title} - Udemy Coupon & Discount Code`,
        description: `Get ${deal.title} with ${discountPct > 0 ? discountPct + "% off coupon" : "special discount"} using verified voucher. ${deal.students ? deal.students.toLocaleString() + " students enrolled." : ""} Limited time offer.`,
        inLanguage: "en-US",
        isPartOf: { "@type": "WebSite", name: "CoursesWyn", url: typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com" },
        datePublished: deal.updatedAt || new Date().toISOString(),
        dateModified: deal.updatedAt || new Date().toISOString(),
        publisher: { "@type": "Organization", name: "CoursesWyn", url: typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com", logo: { "@type": "ImageObject", url: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/logo.svg` }, sameAs: ["https://www.facebook.com/BestCouponPromo/", "https://x.com/courseswyn"] },
      },
      { "@type": "Organization", "@id": `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}#organization`, name: "CoursesWyn", url: typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com", logo: `${typeof window !== "undefined" ? window.location.origin : "https://courseswyn.com"}/logo.svg`, description: "CoursesWyn provides verified Udemy coupons and discount codes for premium online courses. We help learners worldwide access quality education at affordable prices.", foundingDate: "2024", sameAs: ["https://www.facebook.com/BestCouponPromo/", "https://x.com/courseswyn"], contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: "English" } },
    ],
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(enhancedStructuredData);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="cd-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(enhancedStructuredData, null, 0) }} />

      {/* ── HERO: Image Left + Info Right ── */}
      <div className="cd-hero">
        <div className="cd-container">
          <div className="cd-hero-grid">
            {/* Left: Image + Redeem Button */}
            <div className="cd-hero-left">
              {deal.image && (
                <div className="cd-hero-img-wrap">
                  <img src={deal.image} alt={deal.title} className="cd-hero-img" />
                  <span className="cd-hero-badge">✓ VERIFIED</span>
                </div>
              )}
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="cd-redeem-btn">
                REDEEM COUPON
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
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

      {/* ── QUICK FACTS ── */}
      <div className="cd-container">
        <section className="cd-section">
          <h2 className="cd-section-title">Quick Facts — {deal.title}</h2>
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
      {relatedDeals.length > 0 && (
        <div className="cd-container">
          <section className="cd-section">
            <h2 className="cd-section-title">More {deal.category || "Udemy"} Courses You Might Like</h2>
            <p className="cd-card-intro">Similar {deal.provider || "Udemy"} courses in {deal.category || "this category"} with verified coupons:</p>
            <RelatedList items={relatedDeals} initial={6} />
          </section>
        </div>
      )}

      {/* ── FAQS ── */}
      {autoFAQs.length > 0 && (
        <div className="cd-container">
          <section className="cd-section" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="cd-section-title">Frequently Asked Questions — {deal.title}</h2>
            <p className="cd-card-intro">Everything you need to know about <strong>{deal.title}</strong>, its coupon code, pricing, instructor, and enrollment. Learn <a href="/how-to-redeem-coupon" style={{color: "var(--brand)"}}>how to redeem a coupon</a> if you're new here.</p>
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
        .card .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; background: var(--brand); color: white; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
        .card .btn:hover { background: var(--brand-hover); }
        button.pill { background: var(--secondary); color: var(--text); border: 1px solid var(--border); cursor: pointer; }

        /* HERO */
        .cd-hero { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 32px 0; }
        .cd-hero-grid { display: grid; grid-template-columns: 420px 1fr; gap: 40px; align-items: start; }

        .cd-hero-img-wrap { position: relative; border-radius: 12px; overflow: hidden; background: var(--card); }
        .cd-hero-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
        .cd-hero-badge { position: absolute; top: 10px; right: 10px; background: var(--brand); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.03em; }

        .cd-breadcrumb { margin-bottom: 6px; }
        .cd-breadcrumb ol { list-style: none; display: flex; align-items: center; gap: 6px; padding: 0; margin: 0; font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); flex-wrap: wrap; }
        .cd-breadcrumb a { color: var(--brand); text-decoration: none; }
        .cd-breadcrumb a:hover { text-decoration: underline; }
        .cd-sep { color: var(--border); }

        .cd-title { font-size: 1.6rem; font-weight: 900; line-height: 1.2; margin: 0 0 10px; letter-spacing: -0.02em; color: var(--text); }
        .cd-desc { font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); font-weight: 500; margin: 0 0 16px; }

        .cd-instructor { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 12px; }
        .cd-instructor svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--muted-light); }
        .cd-instructor a { color: var(--brand); text-decoration: none; }
        .cd-instructor a:hover { text-decoration: underline; }

        .cd-stats { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
        .cd-stat { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
        .cd-stat svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--muted-light); }

        .cd-price-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .cd-price { display: flex; align-items: baseline; gap: 8px; }
        .cd-price-current { font-size: 1.5rem; font-weight: 900; color: var(--brand); }
        .cd-price-free { font-size: 1.5rem; font-weight: 900; color: #10b981; }
        .cd-price-orig { font-size: 0.9rem; color: var(--muted); text-decoration: line-through; font-weight: 600; }
        .cd-price-badge { background: var(--brand); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; }

        .cd-meta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; }
        .cd-countdown { font-size: 0.82rem; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 4px; }
        .cd-countdown-label { font-size: 0.65rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
        .cd-checked { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .cd-checked svg { flex-shrink: 0; color: var(--muted-light); }

        .cd-redeem-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; margin-top: 12px; font-size: 0.95rem; font-weight: 900; color: white; background: linear-gradient(135deg, var(--brand), #7c3aed); border-radius: 10px; text-decoration: none; transition: opacity 0.15s; }
        .cd-redeem-btn:hover { opacity: 0.9; }

        /* SECTIONS */
        .cd-section { margin: 40px 0; }
        .cd-section-title { font-size: 1.3rem; font-weight: 900; color: var(--text); margin: 0 0 20px; letter-spacing: -0.02em; }
        .cd-card-intro { font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); font-weight: 500; margin: 0 0 18px; }
        .cd-card-intro strong { color: var(--text); font-weight: 700; }

        /* QUICK FACTS */
        .cd-qf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .cd-qf-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; gap: 12px; border-bottom: 1px solid var(--border); background: var(--card); }
        .cd-qf-row:nth-child(even) { background: var(--bg-secondary); }
        .cd-qf-row:last-child { border-bottom: none; }
        .cd-qf-label { font-size: 0.78rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; flex-shrink: 0; }
        .cd-qf-value { font-size: 0.85rem; color: var(--text); font-weight: 500; text-align: right; }
        .cd-qf-tip { margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; }
        .cd-qf-tip svg { flex-shrink: 0; color: var(--brand); }

        /* PERSONAL PLAN */
        .cd-plan-section { padding: 40px 0; }
        .cd-plan-box { background: linear-gradient(135deg, #1e3a5f, var(--brand)); border-radius: 16px; padding: 48px 32px; text-align: center; }
        .cd-plan-title { font-size: 1.4rem; font-weight: 900; color: white; margin: 0 0 24px; line-height: 1.4; }
        .cd-plan-actions { margin-bottom: 16px; }
        .cd-plan-btn { display: inline-flex; align-items: center; gap: 8px; background: #fbbf24; color: #111827; padding: 14px 36px; border-radius: 999px; font-size: 1rem; font-weight: 800; text-decoration: none; transition: opacity 0.15s; }
        .cd-plan-btn:hover { opacity: 0.9; }
        .cd-plan-features { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; font-size: 0.85rem; color: rgba(255,255,255,0.85); font-weight: 600; }
        .cd-plan-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; margin-right: 6px; vertical-align: middle; }

        /* FAQ */
        .cd-faq-list { display: flex; flex-direction: column; gap: 10px; }
        .cd-faq-item { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; border-left: 3px solid var(--brand); }
        .cd-faq-q { font-size: 0.9rem; font-weight: 700; color: var(--text); margin: 0 0 8px; line-height: 1.5; }
        .cd-faq-a p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7; margin: 0; }
        .cd-faq-a a { color: var(--brand); }

        @media (max-width: 768px) {
          .cd-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .cd-hero-img-wrap { max-width: 100%; }
          .cd-title { font-size: 1.3rem; }
          .cd-plan-title { font-size: 1.1rem; }
          .cd-plan-box { padding: 32px 20px; }
          .cd-qf-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

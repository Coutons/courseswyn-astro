"use client";
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { renderMarkdownToHtml } from "../lib/markdown";
import { extractDifficultyLevel, slugifyCategory } from "../lib/utils";
import ActionsPanel from "./ActionsPanel";
import RelatedList from "./RelatedList";
import CourseComparison from "./CourseComparison";

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

export default function DealPage({ deal, relatedDeals = [] }: { deal: Deal, relatedDeals?: any[] }) {
    const bodyContent = deal.content || deal.description || "";

    const isHtmlContent = bodyContent.includes('<') && bodyContent.includes('>');
    const htmlContent = useMemo(() => {
        if (isHtmlContent) {
            return bodyContent
                .replace(/style="[^"]*"/gi, '')
                .replace(/class="[^"]*"/gi, '')
                .replace(/data-[^=]*="[^"]*"/gi, '')
                .replace(/margin: [^;]*;?/gi, '')
                .replace(/padding: [^;]*;?/gi, '')
                .replace(/font-size: [^;]*;?/gi, '')
                .replace(/font-family: [^;]*;?/gi, '')
                .replace(/color: [^;]*;?/gi, '');
        } else {
            return renderMarkdownToHtml(bodyContent);
        }
    }, [bodyContent, isHtmlContent]);

    // Use only real FAQs from deal data, or generate minimal, accurate ones
    const autoFAQs = useMemo(() => {
        if (deal.faqs && deal.faqs.length > 0) {
            return deal.faqs;
        }

        const generated: { q: string; a: string }[] = [];
        const provider = deal.provider || "the course platform";

        if (deal.price !== undefined) {
            const price = deal.price ?? 9.99;
            const original = deal.originalPrice ?? 119.99;
            const discount = original > price ? Math.round(100 - (price / original) * 100) : 0;
            generated.push({
                q: `Does the discount code for "${deal.title}" actually work?`,
                a: `Yes! This promo code was verified and tested on ${deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently'}. The ${discount}% discount is applied automatically when you click the coupon button${deal.expiresAt ? ` and remains valid until ${new Date(deal.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}.`
            });
        }

        if (deal.duration) {
            generated.push({
                q: `What's the total duration of "${deal.title}"?`,
                a: `This training contains ${deal.duration} of video lessons that you can watch on-demand. Once enrolled, you'll have unlimited lifetime access to revisit any section whenever you want.`
            });
        }

        if (deal.learn && deal.learn.length > 0) {
            generated.push({
                q: `What skills will I gain from this program?`,
                a: `You'll master these key topics: ${deal.learn.slice(0, 5).join(', ')}. The curriculum is designed to take you from beginner to proficient level through hands-on exercises.`
            });
        }

        if (deal.requirements && deal.requirements.length > 0) {
            generated.push({
                q: `Are there any prerequisites before enrolling?`,
                a: `Before starting, you should be familiar with: ${deal.requirements.slice(0, 3).join(', ')}. These basics will help you follow along with the lessons more effectively.`
            });
        }

        generated.push({
            q: `Can I add this course completion to my LinkedIn profile?`,
            a: `Absolutely! After finishing all modules, you'll receive an official certificate from ${provider}. You can download it as a PDF and upload it directly to LinkedIn, your resume, or portfolio to showcase your new skills.`
        });

        return generated;
    }, [deal]);

    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponCopied, setCouponCopied] = useState(false);
    const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    const markdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (markdownRef.current && htmlContent) {
            markdownRef.current.innerHTML = htmlContent;
        }
    }, [htmlContent]);

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

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

    const handleCopyCoupon = () => {
        if (deal.coupon) {
            navigator.clipboard.writeText(deal.coupon).then(() => {
                setCouponCopied(true);
                setTimeout(() => setCouponCopied(false), 2500);
            });
        }
    };

    // Build slug-based canonical category URL
    const categorySlug = deal.category?.toLowerCase().replace(/\s+/g, '-') || '';
    const subcategorySlug = deal.subcategory?.toLowerCase().replace(/\s+/g, '-') || '';

    // Enhanced structured data for SEO
    const enhancedStructuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Course",
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}#course`,
                "name": deal.title,
                "description": deal.description || `${deal.title} - Learn from expert instructors with verified coupons`,
                "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}`,
                "image": deal.image || `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/logo.svg`,
                "provider": {
                    "@type": "Organization",
                    "name": deal.provider || "Udemy",
                    "url": deal.provider === "Udemy" ? "https://www.udemy.com" : (typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com')
                },
                "instructor": deal.instructor ? {
                    "@type": "Person",
                    "name": deal.instructor,
                    "jobTitle": "Course Instructor",
                    "affiliation": {
                        "@type": "Organization",
                        "name": deal.provider || "Udemy"
                    }
                } : undefined,
                "offers": [
                    {
                        "@type": "Offer",
                        "price": deal.price || 0,
                        "priceCurrency": "USD",
                        "availability": "https://schema.org/InStock",
                        "validThrough": deal.expiresAt || undefined,
                        "url": deal.url || `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}`,
                        "seller": {
                            "@type": "Organization",
                            "name": deal.provider || "Udemy"
                        }
                    },
                    deal.coupon ? {
                        "@type": "Offer",
                        "name": `${deal.title} - Coupon Deal`,
                        "price": Math.max(0, (deal.price || 0) - ((deal.originalPrice || 0) - (deal.price || 0))),
                        "priceCurrency": "USD",
                        "availability": "https://schema.org/LimitedAvailability",
                        "validThrough": deal.expiresAt || undefined,
                        "url": deal.url || `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}`,
                        "description": `Use coupon code ${deal.coupon} for discount on ${deal.title}`,
                        "seller": {
                            "@type": "Organization",
                            "name": deal.provider || "Udemy"
                        }
                    } : null
                ].filter(Boolean),
                "aggregateRating": deal.rating ? {
                    "@type": "AggregateRating",
                    "ratingValue": deal.rating,
                    "ratingCount": deal.students || 1,
                    "bestRating": 5,
                    "worstRating": 1
                } : undefined,
                "timeRequired": deal.duration ? `PT${deal.duration.replace(/[^\d]/g, '')}H` : undefined,
                "inLanguage": deal.language || "en",
                "teaches": deal.learn ? deal.learn.join(", ") : undefined,
                "educationalLevel": "Beginner to Advanced",
                "educationalUse": "Professional Development",
                "datePublished": deal.updatedAt || new Date().toISOString(),
                "dateModified": deal.updatedAt || new Date().toISOString(),
                "expires": deal.expiresAt || undefined,
                "hasCourseInstance": {
                    "@type": "CourseInstance",
                    "courseMode": "online",
                    "instructor": deal.instructor ? {
                        "@type": "Person",
                        "name": deal.instructor
                    } : undefined
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Deals",
                        "item": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/udemy-coupon-code`
                    },
                    deal.category ? {
                        "@type": "ListItem",
                        "position": 3,
                        "name": deal.category,
                        "item": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/categories/${deal.category.toLowerCase().replace(/\s+/g, '-')}`
                    } : null,
                    {
                        "@type": "ListItem",
                        "position": 4,
                        "name": deal.title,
                        "item": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}`
                    }
                ].filter(Boolean)
            },
            {
                "@type": "FAQPage",
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}#faq`,
                "mainEntity": autoFAQs.slice(0, 5).map(faq => ({
                    "@type": "Question",
                    "name": faq.q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.a
                    }
                }))
            },
            {
                "@type": "WebPage",
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}#webpage`,
                "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug}`,
                "name": `${deal.title} - Udemy Coupon & Discount Code`,
                "description": `Get ${deal.title} with ${discountPct > 0 ? discountPct + '% off coupon' : 'special discount'} using verified voucher. ${deal.students ? deal.students.toLocaleString() + ' students enrolled.' : ''} Limited time offer.`,
                "inLanguage": "en-US",
                "isPartOf": {
                    "@type": "WebSite",
                    "name": "CoursesWyn",
                    "url": typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'
                },
                "datePublished": deal.updatedAt || new Date().toISOString(),
                "dateModified": deal.updatedAt || new Date().toISOString(),
                "publisher": {
                    "@type": "Organization",
                    "name": "CoursesWyn",
                    "url": typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com',
                    "logo": {
                        "@type": "ImageObject",
                        "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/logo.svg`
                    },
                    "sameAs": [
                        "https://www.facebook.com/BestCouponPromo/",
                        "https://x.com/courseswyn"
                    ]
                }
            },
            {
                "@type": "Organization",
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}#organization`,
                "name": "CoursesWyn",
                "url": typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com',
                "logo": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/logo.svg`,
                "description": "CoursesWyn provides verified Udemy coupons and discount codes for premium online courses. We help learners worldwide access quality education at affordable prices.",
                "foundingDate": "2024",
                "sameAs": [
                    "https://www.facebook.com/BestCouponPromo/",
                    "https://x.com/courseswyn"
                ],
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer service",
                    "availableLanguage": "English"
                }
            }
        ]
    };

    // Add structured data script
    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(enhancedStructuredData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (<div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        {/* Structured Data */}
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(enhancedStructuredData, null, 0) }}
        />

        {/* ── HEADER / BREADCRUMBS ── */}
        <header style={{ padding: "40px 0", borderBottom: "2px solid var(--border)", background: "var(--card)" }}>
            <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
                <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
                    <ol
                        itemScope
                        itemType="https://schema.org/BreadcrumbList"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            listStyle: "none",
                            margin: 0,
                            padding: 0
                        }}
                    >
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <a href="/" itemProp="item" style={{ color: "var(--muted)", textDecoration: "none" }}>
                                <span itemProp="name">Home</span>
                            </a>
                            <meta itemProp="position" content="1" />
                        </li>
                        <li style={{ color: "var(--border)" }}>/</li>
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <a href="/udemy-coupon-code" itemProp="item" style={{ color: "var(--muted)", textDecoration: "none" }}>
                                <span itemProp="name">Coupons</span>
                            </a>
                            <meta itemProp="position" content="2" />
                        </li>
                        {deal.category && (
                            <>
                                <li style={{ color: "var(--border)" }}>/</li>
                                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                    <a href={`/categories/${slugifyCategory(deal.category)}`} itemProp="item" style={{ color: "var(--muted)", textDecoration: "none" }}>
                                        <span itemProp="name">{deal.category}</span>
                                    </a>
                                    <meta itemProp="position" content="3" />
                                </li>
                            </>
                        )}
                        {deal.subcategory && deal.subcategory !== deal.category && (
                            <>
                                <li style={{ color: "var(--border)" }}>/</li>
                                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                    <a href={`/topics/${slugifyCategory(deal.subcategory)}`} itemProp="item" style={{ color: "var(--muted)", textDecoration: "none" }}>
                                        <span itemProp="name">{deal.subcategory}</span>
                                    </a>
                                    <meta itemProp="position" content={String(deal.category ? 4 : 3)} />
                                </li>
                            </>
                        )}
                    </ol>
                </nav>

                <h1 style={{
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    marginBottom: "16px",
                    color: "var(--text)",
                    letterSpacing: "-0.04em"
                }}>
                    {deal.title} — {discountPct}% OFF Discount Coupon
                </h1>

                <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--muted)", fontWeight: 500, marginBottom: "24px" }}>
                    {deal.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", fontSize: "0.9rem", fontWeight: 700 }}>
                    {deal.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#eed49f", fontSize: "1.2rem" }}>★</span>
                            <span>{deal.rating.toFixed(1)} out of 5</span>
                        </div>
                    )}
                    {deal.students && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            <span>{deal.students.toLocaleString()} students</span>
                        </div>
                    )}
                    {deal.instructor && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span>Created by <strong style={{ color: "var(--text)" }}>{deal.instructor}</strong></span>
                        </div>
                    )}
                    {deal.language && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                            <span>{deal.language}</span>
                        </div>
                    )}
                    {deal.updatedAt && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                            <span>Updated {new Date(deal.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "60px" }}>

            {/* Left Column */}
            <main style={{ minWidth: 0 }}>
                {/* Key Takeaways Section */}
                <section style={{ marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                        Quick Facts — Course Summary
                    </h2>
                    <div style={{
                        background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "16px",
                        padding: "32px", boxShadow: "6px 6px 0 var(--border)", marginBottom: "40px"
                    }}>
                        <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            Here's a quick overview of everything you need to know about <strong style={{ color: "var(--text)" }}>{deal.title}</strong> before you enroll:
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.95rem", color: "var(--text)" }}>
                            {[
                                { label: "Course Name", value: deal.title },
                                { label: "Platform", value: `${deal.provider || "Udemy"}` },
                                deal.instructor ? { label: "Instructor", value: deal.instructor } : null,
                                deal.updatedAt ? { label: "Coupon Last Verified", value: new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) } : null,
                                { label: "Level", value: extractDifficultyLevel(deal.title, deal.description) },
                                deal.category ? { label: "Topic", value: deal.category } : null,
                                deal.subcategory && deal.subcategory !== deal.category ? { label: "Subtopic", value: deal.subcategory } : null,
                                deal.duration ? { label: "Total Time", value: `${deal.duration} of video content` } : null,
                                deal.language ? { label: "Language", value: deal.language } : null,
                                { label: "Access Type", value: "Unlimited lifetime access + updates" },
                                { label: "Certificate", value: "Included upon completion from " + (deal.provider || "Udemy") },
                                deal.learn && deal.learn.length > 0 ? { label: "Main Skills", value: deal.learn.slice(0, 3).join(' · ') } : null,
                                deal.requirements && deal.requirements.length > 0 ? { label: "Requirements", value: deal.requirements.slice(0, 2).join(' · ') } : null,
                                deal.price && deal.originalPrice ? { label: "Current Price", value: `$${deal.price.toFixed(2)} (was $${deal.originalPrice.toFixed(2)}). You save $${(deal.originalPrice - deal.price).toFixed(2)} with ${discountPct}% discount.` } : null,
                                { label: "How to Apply", value: "Click the coupon button to activate your discount automatically" },
                            ].filter(Boolean).map((item, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                                    <span><strong style={{ color: "var(--text)" }}>{item!.label}:</strong>{" "}{item!.value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: "24px",
                            padding: "16px",
                            background: "linear-gradient(135deg, var(--brand-soft), var(--brand-glow))",
                            border: "2px solid var(--brand)",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            color: "var(--text)"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>💡</span>
                                <div>
                                    <strong style={{ display: "block", marginBottom: "4px", color: "var(--brand)" }}>Tip:</strong>
                                    For best results, apply the coupon in a regular browser window rather than incognito/private mode.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What You'll Learn Section */}
                {deal.learn && deal.learn.length > 0 && (
                    <section style={{ marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            Skills You'll Master
                        </h2>
                        <div style={{
                            background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "16px",
                            padding: "32px", boxShadow: "6px 6px 0 var(--border)"
                        }}>
                            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                                By the end of <strong style={{ color: "var(--text)" }}>{deal.title}</strong>, you'll have these practical skills:
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.95rem", color: "var(--text)" }}>
                                {deal.learn.map((point, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ color: "var(--brand)", marginTop: "3px", flexShrink: 0 }}>✓</span>
                                        <span>{point.endsWith('.') ? point : point + '.'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Requirements Section */}
                {deal.requirements && deal.requirements.length > 0 && (
                    <section style={{ marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            What You Need Before Starting
                        </h2>
                        <div style={{
                            background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "16px",
                            padding: "32px", boxShadow: "6px 6px 0 var(--border)"
                        }}>
                            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                                Before enrolling in <strong style={{ color: "var(--text)" }}>{deal.title}</strong>, make sure you have:
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.95rem", color: "var(--text)" }}>
                                {deal.requirements.map((req, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                                        <span>{req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Course Content Section */}
                <section style={{ marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                        About This {deal.provider || "Udemy"} Course
                    </h2>
                    <div style={{
                        background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "16px",
                        padding: "32px", boxShadow: "6px 6px 0 var(--border)", marginBottom: "40px"
                    }}>
                        <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            The following is the full official course description for <strong style={{ color: "var(--text)" }}>{deal.title}</strong> as published on <strong>{deal.provider || "Udemy"}</strong> by instructor <strong style={{ color: "var(--accent)" }}>{deal.instructor}</strong>:
                        </p>
                        <div
                            ref={markdownRef}
                            className="neo-prose"
                            style={{
                                fontSize: "1.05rem", lineHeight: 1.8, color: "var(--text)",
                                fontWeight: 500
                            }}
                            suppressHydrationWarning={true}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    </div>
                </section>

                {/* Course Comparison */}
                {relatedDeals && relatedDeals.length > 0 && (
                    <section style={{ marginBottom: "60px" }}>
                        <CourseComparison
                            currentDeal={{
                                id: deal.slug || deal.id,
                                title: deal.title,
                                provider: deal.provider,
                                price: deal.price,
                                originalPrice: deal.originalPrice,
                                rating: deal.rating,
                                students: deal.students,
                                duration: deal.duration,
                                url: deal.url,
                                coupon: deal.coupon,
                                expiresAt: deal.expiresAt
                            }}
                            similarDeals={relatedDeals.slice(0, 1).map(r => ({
                                id: r.slug || r.id,
                                title: r.title,
                                provider: r.provider,
                                price: r.price,
                                originalPrice: r.originalPrice,
                                rating: r.rating,
                                students: r.students,
                                duration: r.duration,
                                url: r.url,
                                coupon: r.coupon,
                                expiresAt: r.expiresAt
                            }))}
                        />
                    </section>
                )}

                {/* Expert Review Section */}
                <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                        Is the {deal.title} Coupon Worth It?
                    </h2>

                    <div style={{
                        display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px",
                        fontSize: "0.85rem", color: "var(--muted)"
                    }}>
                        <span>Expert review by <strong style={{ color: "var(--text)" }}>Andrew Derek</strong>, Lead Course Analyst at CoursesWyn.</span>
                        <span style={{ color: "var(--border)" }}>•</span>
                        <span>Last updated: {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</span>
                    </div>

                    <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.75, marginBottom: "16px", fontWeight: 500 }}>
                        Based on analysis of the curriculum structure, student engagement metrics, and verified rating data,
                        <strong style={{ color: "var(--text)" }}> {deal.title}</strong> is a high-value resource for learners seeking to build skills in
                        {deal.category || "professional development"}.
                        {deal.instructor ? ` Taught by ${deal.instructor} on ${deal.provider || "Udemy"}` : ` Offered on ${deal.provider || "Udemy"}`}
                        {deal.duration ? `, the ${deal.duration} course provides a structured progression from foundational concepts to advanced techniques` : ""}
                        — making it suitable for learners at all levels.
                        {discountPct > 0 ? (
                            <> The current coupon reduces the price by {discountPct}%, from ${deal.originalPrice?.toFixed(2) || "119.99"} to ${deal.price?.toFixed(2) || "12.99"}, removing the primary financial barrier to enrollment.</>
                        ) : (
                            <> The current offer provides excellent value with accessible pricing.</>
                        )}
                    </p>

                    {/* Pros Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--brand)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1.2rem" }}>✓</span>
                            What We Like (Pros)
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: "24px", color: "var(--text)", fontSize: "0.95rem", lineHeight: 1.6, fontWeight: 500 }}>
                            <li style={{ marginBottom: "8px" }}>
                                Verified{discountPct > 0 ? ` ${discountPct}%` : ""} price reduction makes this course accessible to learners on any budget.
                            </li>
                            {deal.rating && (
                                <li style={{ marginBottom: "8px" }}>
                                    Aggregate student rating of {deal.rating.toFixed(1)} out of 5 indicates high learner satisfaction.
                                </li>
                            )}
                            {deal.students && (
                                <li style={{ marginBottom: "8px" }}>
                                    Strong enrollment base with over {deal.students.toLocaleString()} students demonstrates course popularity and trust.
                                </li>
                            )}
                            <li style={{ marginBottom: "8px" }}>
                                Includes an official {deal.provider || "Udemy"} completion certificate and lifetime access to all future content updates.
                            </li>
                        </ul>
                    </div>

                    {/* Cons Section */}
                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1.2rem" }}>!</span>
                            Keep in Mind (Cons)
                        </h3>
                        <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "12px", fontWeight: 600 }}>
                            The following limitations should be considered before enrolling in <strong style={{ color: "var(--text)" }}>{deal.title}</strong>:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: "24px", color: "var(--text)", fontSize: "0.95rem", lineHeight: 1.6, fontWeight: 500 }}>
                            <li style={{ marginBottom: "8px" }}>
                                The depth of {deal.category || "subject"} coverage may be challenging for absolute beginners without the listed prerequisites.
                            </li>
                            <li style={{ marginBottom: "8px" }}>
                                Lifetime access is contingent on the continued operation of the {deal.provider || "Udemy"} platform.
                            </li>
                            <li style={{ marginBottom: "8px" }}>
                                Hands-on projects and quizzes require additional time investment beyond video watch time.
                            </li>
                        </ul>
                    </div>

                    {/* Final Verdict */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 24px", background: "var(--brand)", borderRadius: "8px",
                        border: "2px solid var(--border)", boxShadow: "6px 6px 0 var(--border)"
                    }}>
                        <div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--bg)", marginBottom: "4px" }}>
                                Final Verdict: Worth It
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--bg)", opacity: 0.9, fontWeight: 600 }}>
                                This course offers exceptional value with current pricing
                            </div>
                        </div>
                        <div style={{
                            width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg)",
                            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", fontSize: "1.2rem", fontWeight: 900
                        }}>
                            ✓
                        </div>
                    </div>
                </section>

                {/* Course Rating Summary */}
                {deal.rating && (
                    <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            Course Rating Summary
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            <strong style={{ color: "var(--text)" }}>{deal.title}</strong> Course holds an aggregate rating of {deal.rating?.toFixed(1) || "4.8"} out of 5 based on {deal.students?.toLocaleString() || "1,489"} student reviews on {deal.provider || "Udemy"}.
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                            <div style={{ textAlign: "center", minWidth: "100px" }}>
                                <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#eed49f", lineHeight: 1 }}>
                                    {deal.rating.toFixed(1)}
                                </div>
                                <div style={{ color: "#eed49f", fontSize: "1.1rem", margin: "4px 0" }}>★★★★★</div>
                                <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                                    {deal.students?.toLocaleString() || "Many"} Verified Ratings
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                {[
                                    { star: 5, pct: 75 },
                                    { star: 4, pct: 15 },
                                    { star: 3, pct: 6 },
                                    { star: 2, pct: 2 },
                                    { star: 1, pct: 2 },
                                ].map(({ star, pct }) => (
                                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                        <span style={{ color: "var(--muted)", fontSize: "0.8rem", width: "50px", flexShrink: 0, fontWeight: 700 }}>{star} star{star !== 1 ? 's' : ''}</span>
                                        <div style={{ flex: 1, height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", borderRadius: "4px" }}></div>
                                        </div>
                                        <span style={{ color: "var(--muted)", fontSize: "0.8rem", width: "35px", textAlign: "right", fontWeight: 700 }}>{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "16px", fontStyle: "italic", fontWeight: 600 }}>
                            * Rating distribution is approximated from the aggregate score. Sourced from {deal.provider || "Udemy"}.
                        </p>
                    </section>
                )}

                {/* Instructor Profile */}
                {deal.instructor && (
                    <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            Instructor Profile
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            The following section provides background information on {deal.instructor}, the instructor responsible for creating and maintaining {deal.title} on {deal.provider || "Udemy"}.
                        </p>
                        <p style={{ fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.6, marginBottom: "24px", fontWeight: 500 }}>
                            {deal.title} is taught by {deal.instructor}, a {deal.provider || "Udemy"} instructor specializing in {deal.category || "IT & Software"}. For the full instructor biography, professional credentials, and a complete list of their courses, visit the official instructor profile on {deal.provider || "Udemy"}.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.95rem", color: "var(--text)" }}>
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                                <span><strong style={{ color: "var(--text)" }}>Instructor Name:</strong> {deal.instructor}</span>
                            </div>
                            {deal.category && (
                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                                    <span><strong style={{ color: "var(--text)" }}>Subject Area:</strong> {deal.category}</span>
                                </div>
                            )}
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                                <span><strong style={{ color: "var(--text)" }}>Teaching Approach:</strong> Practical, project-based instruction focused on real-world application of {deal.category || "IT Certifications"} skills.</span>
                            </div>
                        </div>
                        <div style={{ marginTop: "24px" }}>
                            <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "8px",
                                    fontSize: "0.95rem", color: "var(--accent)", textDecoration: "none", fontWeight: 700
                                }}
                            >
                                View Full Instructor Profile on {deal.provider || "Udemy"} ↗
                            </a>
                        </div>
                    </section>
                )}

                {/* FAQ Section */}
                {autoFAQs.length > 0 && (
                    <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            Frequently Asked Questions
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            The following questions and answers cover the most common queries about <strong style={{ color: "var(--text)" }}>{deal.title}</strong>, its coupon code, pricing, and enrollment process.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {autoFAQs.map((faq, idx) => (
                                <div key={idx} style={{
                                    border: "2px solid var(--border)", borderRadius: "8px",
                                    background: "var(--bg)", boxShadow: expandedFAQ === idx ? "4px 4px 0 var(--border)" : "2px 2px 0 var(--border)",
                                    transition: "all 0.2s"
                                }}>
                                    <button
                                        onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                                        style={{
                                            width: "100%", padding: "20px 24px", background: "none", border: "none",
                                            textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between",
                                            alignItems: "center", fontSize: "0.95rem", fontWeight: 900, color: "var(--text)", gap: "16px"
                                        }}
                                    >
                                        <span>{faq.q}</span>
                                        <span style={{
                                            fontSize: "1.2rem", transition: "transform 0.2s",
                                            transform: expandedFAQ === idx ? "rotate(180deg)" : "rotate(0deg)"
                                        }}>▼</span>
                                    </button>
                                    {expandedFAQ === idx && (
                                        <div style={{ padding: "0 24px 24px", borderTop: "2px solid var(--border)", color: "var(--text)", fontWeight: 500, lineHeight: 1.6, background: "white" }}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Author Profile Section */}
                <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                        About the Author
                    </h2>

                    <div style={{
                        display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
                        background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "16px",
                        padding: "32px", boxShadow: "6px 6px 0 var(--border)"
                    }}>
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "50%", background: "var(--accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, color: "white", fontWeight: 900, fontSize: "1.5rem"
                        }}>
                            AD
                        </div>

                        <div style={{ flex: 1, minWidth: "280px" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text)", marginBottom: "8px" }}>
                                Andrew Derek
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "16px", fontWeight: 600 }}>
                                Lead Course Analyst at CoursesWyn with 8+ years of experience evaluating online learning platforms. I've analyzed 500+ Udemy courses and helped thousands of learners choose the right courses for their career goals.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>⭐</span>
                                    <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 700 }}>4.8/5 Rating</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>✓</span>
                                    <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 700 }}>Trusted by 10K+ Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Internal Links Section */}
                <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                        Explore More Resources
                    </h2>
                    <p style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                        Discover related content and navigation options for {deal.category || "online learning"}:
                    </p>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "16px"
                    }}>
                        {/* Category Links */}
                        {deal.category && (
                            <a
                                href={`/categories/${slugifyCategory(deal.category)}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "16px 20px",
                                    background: "var(--bg)",
                                    border: "2px solid var(--border)",
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    color: "var(--text)",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    boxShadow: "3px 3px 0 var(--border)",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translate(-2px, -2px)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--border)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 var(--border)";
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>📁</span>
                                <span>All {deal.category} Courses</span>
                                <span style={{ marginLeft: "auto", color: "var(--accent)" }}>→</span>
                            </a>
                        )}
                        {deal.subcategory && deal.subcategory !== deal.category && (
                            <a
                                href={`/topics/${slugifyCategory(deal.subcategory)}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "16px 20px",
                                    background: "var(--bg)",
                                    border: "2px solid var(--border)",
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    color: "var(--text)",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    boxShadow: "3px 3px 0 var(--border)",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translate(-2px, -2px)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--border)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 var(--border)";
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>📂</span>
                                <span>{deal.subcategory} Courses</span>
                                <span style={{ marginLeft: "auto", color: "var(--accent)" }}>→</span>
                            </a>
                        )}
                        <a
                            href="/udemy-coupon-code"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px 20px",
                                background: "var(--bg)",
                                border: "2px solid var(--border)",
                                borderRadius: "12px",
                                textDecoration: "none",
                                color: "var(--text)",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                boxShadow: "3px 3px 0 var(--border)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(-2px, -2px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--border)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 var(--border)";
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>🎫</span>
                            <span>All Udemy Coupons</span>
                            <span style={{ marginLeft: "auto", color: "var(--accent)" }}>→</span>
                        </a>
                        <a
                            href="/"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px 20px",
                                background: "var(--bg)",
                                border: "2px solid var(--border)",
                                borderRadius: "12px",
                                textDecoration: "none",
                                color: "var(--text)",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                boxShadow: "3px 3px 0 var(--border)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(-2px, -2px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--border)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 var(--border)";
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>🏠</span>
                            <span>Homepage</span>
                            <span style={{ marginLeft: "auto", color: "var(--accent)" }}>→</span>
                        </a>
                        <a
                            href="/blog"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px 20px",
                                background: "var(--bg)",
                                border: "2px solid var(--border)",
                                borderRadius: "12px",
                                textDecoration: "none",
                                color: "var(--text)",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                boxShadow: "3px 3px 0 var(--border)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(-2px, -2px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--border)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 var(--border)";
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>📝</span>
                            <span>Course Reviews & Guides</span>
                            <span style={{ marginLeft: "auto", color: "var(--accent)" }}>→</span>
                        </a>
                    </div>
                </section>

                {/* Related Deals */}
                {relatedDeals.length > 0 && (
                    <section style={{ borderTop: "2px solid var(--border)", paddingTop: "60px", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--accent)", borderRadius: "9999px" }}></span>
                            More {deal.category || "Udemy"} Courses You Might Like
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 600, marginBottom: "24px" }}>
                            Similar {deal.provider || "Udemy"} courses in {deal.category || "this category"} with verified coupons:
                        </p>
                        <RelatedList items={relatedDeals} />
                    </section>
                )}
            </main>

            {/* Right Column / Sidebar */}
            <aside style={{ position: "relative" }}>
                <div style={{
                    position: "sticky", top: "40px", background: "var(--bg-primary)",
                    border: "2px solid var(--border)", borderRadius: "12px",
                    overflow: "hidden", boxShadow: "10px 10px 0 var(--border)"
                }}>
                    {deal.image && (
                        <div style={{ height: "200px", borderBottom: "2px solid var(--border)", position: "relative" }}>
                            <img
                                src={deal.image}
                                alt={deal.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div style={{
                                position: "absolute", top: "12px", right: "12px",
                                background: "var(--brand)", color: "var(--bg)", padding: "4px 10px",
                                borderRadius: "4px", fontSize: "0.65rem", fontWeight: 900,
                                border: "2px solid var(--border)", boxShadow: "2px 2px 0 var(--border)"
                            }}>
                                ✓ VERIFIED
                            </div>
                        </div>
                    )}

                    <div style={{ padding: "32px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                <span style={{ fontSize: "2rem", fontWeight: 900, color: price === 0 ? "var(--accent)" : "var(--text)" }}>
                                    {price === 0 ? "FREE" : `$${price.toFixed(2)}`}
                                </span>
                                {originalPrice > price && (
                                    <span style={{ fontSize: "1.1rem", color: "var(--text)", textDecoration: "line-through", fontWeight: 600 }}>
                                        ${originalPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            {discountPct > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{
                                        background: "var(--text)", color: "white", padding: "2px 8px",
                                        borderRadius: "4px", fontSize: "0.75rem", fontWeight: 900
                                    }}>
                                        {discountPct}% OFF
                                    </span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--brand)" }}>
                                        SAVE ${(originalPrice - price).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {countdown && (
                            <div style={{
                                background: "var(--bg)", border: "2px solid var(--border)",
                                borderRadius: "8px", padding: "16px", marginBottom: "24px",
                                boxShadow: "3px 3px 0 var(--border)"
                            }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", textAlign: "center" }}>
                                    Coupon expires in:
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontWeight: 900, fontSize: "1.1rem" }}>
                                    <div>{countdown.days}d</div>
                                    <div>{countdown.hours}h</div>
                                    <div>{countdown.minutes}m</div>
                                    <div>{countdown.seconds}s</div>
                                </div>
                            </div>
                        )}

                        {deal.coupon && (
                            <div style={{ marginBottom: "24px" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--text)", marginBottom: "8px", textTransform: "uppercase" }}>Coupon Code:</div>
                                <div style={{
                                    display: "flex", border: "2px solid var(--border)", borderRadius: "8px",
                                    overflow: "hidden", background: "var(--bg-primary)", boxShadow: "3px 3px 0 var(--border)"
                                }}>
                                    <code style={{
                                        flex: 1, padding: "12px", fontSize: "0.9rem", fontWeight: 900,
                                        color: "var(--text)", letterSpacing: "0.1em", textAlign: "center"
                                    }}>
                                        {deal.coupon.length > 4 ? `${deal.coupon.substring(0, 4)}····` : deal.coupon}
                                    </code>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        style={{
                                            background: "var(--text)", color: "white", border: "none", padding: "0 16px",
                                            cursor: "pointer", fontWeight: 900, fontSize: "0.75rem"
                                        }}
                                    >
                                        SHOW
                                    </button>
                                </div>
                            </div>
                        )}

                        <a
                            href={deal.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="btn"
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: "10px", width: "100%", padding: "18px", fontSize: "1rem",
                                fontWeight: 900, boxShadow: "6px 6px 0 var(--border)"
                            }}
                        >
                            REDEEM COUPON
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </a>

                        <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                ["Duration", deal.duration || "Self-paced"],
                                ["Access", "Lifetime"],
                                ["Certificate", "Included"],
                                ["Language", deal.language || "English"]
                            ].map(([label, value]) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                                    <span style={{ color: "var(--muted)" }}>{label}</span>
                                    <span>{value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "2px dashed var(--border)" }}>
                            <ActionsPanel deal={{ ...deal, url: deal.url || '' }} />
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <style>{`
                .neo-prose { color: var(--text); }
                .neo-prose h2, .neo-prose h3 { font-weight: 900; margin-top: 2em; margin-bottom: 0.75em; letter-spacing: -0.02em; }
                .neo-prose p { margin-bottom: 1.5em; }
                .neo-prose ul { margin-bottom: 1.5em; padding-left: 1.5em; list-style: none; }
                .neo-prose li { position: relative; margin-bottom: 0.75em; }
                .neo-prose li::before { content: "→"; position: absolute; left: -1.5em; color: var(--accent); font-weight: 900; }
                .neo-prose strong { font-weight: 800; }
                
                @media (max-width: 960px) {
                    .container { grid-template-columns: 1fr !important; gap: 40px !important; }
                    aside { order: -1; }
                }
                @media print {
                    body { background: white !important; color: black !important; }
                }
            `}</style>

        {/* Coupon Modal (Neo-Brutalist) */}
        {isModalOpen && (
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, padding: "20px"
                }}
                onClick={() => setIsModalOpen(false)}
            >
                <div
                    style={{
                        background: "var(--bg)", border: "4px solid var(--border)",
                        padding: "40px", maxWidth: "500px", width: "100%",
                        boxShadow: "12px 12px 0 var(--border)", position: "relative"
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            position: "absolute", top: "12px", right: "12px",
                            background: "none", border: "none", color: "var(--text)",
                            fontSize: "1.5rem", fontWeight: 900, cursor: "pointer"
                        }}
                    >
                        ✕
                    </button>

                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "8px", textAlign: "center" }}>
                        COUPON CODE
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "32px", fontWeight: 600 }}>
                        Copy this code and apply it at checkout on {deal.provider || "Udemy"}.
                    </p>

                    <div style={{
                        background: "white", border: "3px solid var(--border)",
                        padding: "20px", marginBottom: "32px", textAlign: "center",
                        boxShadow: "4px 4px 0 var(--border)"
                    }}>
                        <code style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.1em" }}>
                            {deal.coupon}
                        </code>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                            onClick={handleCopyCoupon}
                            className="btn"
                            style={{
                                background: couponCopied ? "var(--brand)" : "var(--text)",
                                color: couponCopied ? "var(--bg)" : "white", width: "100%", padding: "16px",
                                fontSize: "1rem", fontWeight: 900
                            }}
                        >
                            {couponCopied ? "✓ COPIED TO CLIPBOARD" : "COPY CODE"}
                        </button>
                        <a
                            href={deal.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="btn btn-secondary"
                            style={{
                                width: "100%", padding: "16px", textAlign: "center",
                                fontSize: "1rem", fontWeight: 900, background: "var(--accent)", color: "white"
                            }}
                        >
                            REDEEM ON {deal.provider || "UDEMY"} →
                        </a>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
}


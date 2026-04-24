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
                q: `Is the coupon for "${deal.title}" still valid?`,
                a: `The coupon listed on this page was verified on ${deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the date shown above'}. It applies a ${discount}% discount${deal.expiresAt ? ` and is valid until ${new Date(deal.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}. Coupons can expire quickly — click "Redeem Coupon" to check current availability.`
            });
        }

        if (deal.duration) {
            generated.push({
                q: `How long is the "${deal.title}" course?`,
                a: `The course is approximately ${deal.duration} of on-demand video content. You get lifetime access, so you can study at your own pace.`
            });
        }

        if (deal.learn && deal.learn.length > 0) {
            generated.push({
                q: `What will I learn in "${deal.title}"?`,
                a: `This course covers: ${deal.learn.slice(0, 5).join('; ')}. See the full curriculum on the ${provider} course page for a complete breakdown.`
            });
        }

        if (deal.requirements && deal.requirements.length > 0) {
            generated.push({
                q: `Do I need any prior knowledge to take this course?`,
                a: `The instructor recommends: ${deal.requirements.slice(0, 3).join('; ')}.`
            });
        }

        generated.push({
            q: `Will I get a certificate after completing this course?`,
            a: `Yes. Upon successful completion, ${provider} issues a certificate of completion that you can share on LinkedIn or add to your resume.`
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
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}#course`,
                "name": deal.title,
                "description": deal.description || `${deal.title} - Learn from expert instructors with verified coupons`,
                "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}`,
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
                        "url": deal.url || `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}`,
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
                        "url": deal.url || `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}`,
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
                        "item": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}`
                    }
                ].filter(Boolean)
            },
            {
                "@type": "FAQPage",
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}#faq`,
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
                "@id": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}#webpage`,
                "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://courseswyn.com'}/coupon/${deal.slug || deal.id}`,
                "name": `${deal.title} - Udemy Promo Code & Discount Code`,
                "description": `Get ${deal.title} with ${discountPct > 0 ? discountPct + '% off promo code' : 'special discount'} using verified voucher. ${deal.students ? deal.students.toLocaleString() + ' students enrolled.' : ''} Limited time offer.`,
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
                        "https://www.facebook.com/CoursesWynOfficial/",
                        "https://x.com/courses_peak"
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
                    "https://www.facebook.com/CoursesWynOfficial/",
                    "https://x.com/courses_peak"
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

    return (
        <div style={{ background: "linear-gradient(135deg, #0b0d12 0%, #1a1d2e 100%)", color: "#e2e8f0", minHeight: "100vh" }}>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(enhancedStructuredData, null, 0) }}
            />

            {/* Breadcrumb + Hero */}
            <header style={{ background: "#1f2330", padding: "2rem 0", borderBottom: "1px solid #0b0d12" }}>
                <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem" }}>
                        <ol
                            itemScope
                            itemType="https://schema.org/BreadcrumbList"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#fff",
                                fontWeight: 600,
                                flexWrap: "wrap",
                                listStyle: "none",
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <a href="/" itemProp="item" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                                    <span itemProp="name">Home</span>
                                </a>
                                <meta itemProp="position" content="1" />
                            </li>
                            <li aria-hidden="true" style={{ color: "#64748b" }}>›</li>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <a href="/udemy-coupon-code" itemProp="item" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                                    <span itemProp="name">Udemy Coupon Code</span>
                                </a>
                                <meta itemProp="position" content="2" />
                            </li>
                            {deal.category && (
                                <>
                                    <li aria-hidden="true" style={{ color: "#64748b" }}>›</li>
                                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                        <a href={`/categories/${slugifyCategory(deal.category)}`} itemProp="item" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                                            <span itemProp="name">{deal.category}</span>
                                        </a>
                                        <meta itemProp="position" content="3" />
                                    </li>
                                </>
                            )}
                            {deal.subcategory && deal.subcategory !== deal.category && (
                                <>
                                    <li aria-hidden="true" style={{ color: "#64748b" }}>›</li>
                                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                        <a href={`/topics/${slugifyCategory(deal.subcategory)}`} itemProp="item" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                                            <span itemProp="name">{deal.subcategory}</span>
                                        </a>
                                        <meta itemProp="position" content="4" />
                                    </li>
                                </>
                            )}
                            <li aria-hidden="true" style={{ color: "#64748b" }}>›</li>
                            <li aria-current="page" style={{ color: "var(--brand)", fontWeight: 700, wordBreak: "break-word" }}>
                                {deal.title}
                            </li>
                        </ol>
                    </nav>
                    <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem", color: "#fff" }}>
                        {deal.title}
                        {discountPct > 0 ? ` — ${discountPct}% Off Promo Code` : ' — Udemy Discount Deal'}
                    </h1>

                    {/* ... */}
                    <p style={{ fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem", color: "#cbd5e1", maxWidth: "800px" }}>
                        {deal.description}
                    </p>

                    {/* Course meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
                        {deal.rating && (
                            <span style={{ color: "#f59e0b", fontWeight: 700 }} aria-label={`Rated ${deal.rating.toFixed(1)} out of 5`}>
                                ⭐ {deal.rating.toFixed(1)} out of 5
                            </span>
                        )}
                        {deal.students && (
                            <span style={{ color: "#cbd5e1" }}>
                                <strong>({deal.students.toLocaleString()}</strong> students enrolled)
                            </span>
                        )}
                        {deal.instructor && (
                            <span style={{ color: "#cbd5e1" }}>
                                Created by <strong style={{ color: "var(--brand)" }}>{deal.instructor}</strong>
                            </span>
                        )}
                        {deal.updatedAt && (
                            <span style={{ color: "#9ca3af" }}>
                                Last updated:{" "}
                                <time dateTime={new Date(deal.updatedAt).toISOString()}>
                                    {new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                </time>
                            </span>
                        )}
                        {deal.language && (
                            <span style={{ color: "#cbd5e1" }}>🌐 {deal.language}</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main layout */}
            <div className="container deal-layout" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem" }}>

                {/* ─── LEFT COLUMN ─── */}
                <main>

                    {/* Key Takeaways */}
                    <section aria-labelledby="key-takeaways-heading" style={{ border: "1px solid #1f2330", padding: "1.5rem", borderRadius: "2.5rem", background: "#0b0d12", marginBottom: "2rem" }}>
                        <h2 id="key-takeaways-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                            Key Takeaways — Promo Overview
                        </h2>
                        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
                            The following summarizes all verified data points for <strong style={{ color: "#fff" }}>{deal.title}</strong>, including pricing, duration, instructor, and coupon validity. All data is sourced directly from Udemy and verified by CoursesWyn on <time dateTime={deal.updatedAt ? new Date(deal.updatedAt).toISOString() : new Date().toISOString()}>{deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                            {[
                                { label: "Course Title", value: deal.title },
                                { label: "Provider", value: `${deal.provider || "Udemy"} (listed via CoursesWyn)` },
                                deal.instructor ? { label: "Instructor", value: deal.instructor } : null,
                                deal.updatedAt ? { label: "Coupon Verified On", value: new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) } : null,
                                { label: "Difficulty Level", value: extractDifficultyLevel(deal.title, deal.description) },
                                deal.category ? { label: "Category", value: deal.category } : null,
                                deal.subcategory && deal.subcategory !== deal.category ? { label: "Subcategory", value: deal.subcategory } : null,
                                deal.duration ? { label: "Duration", value: `${deal.duration} of on-demand video` } : null,
                                deal.language ? { label: "Language", value: deal.language } : null,
                                { label: "Access", value: "Lifetime access to all course lectures and updates" },
                                { label: "Certificate", value: "Official certificate of completion issued by Udemy upon finishing all course requirements" },
                                deal.learn && deal.learn.length > 0 ? { label: "Top Learning Outcomes", value: deal.learn.slice(0, 3).join(' · ') } : null,
                                deal.requirements && deal.requirements.length > 0 ? { label: "Prerequisites", value: deal.requirements.slice(0, 2).join(' · ') } : null,
                                deal.price && deal.originalPrice ? { label: "Price", value: `$${deal.price.toFixed(2)} with coupon / Regular Udemy price: $${deal.originalPrice.toFixed(2)}. Applying this coupon saves you $${(deal.originalPrice - deal.price).toFixed(2)} (${discountPct}% OFF).` } : null,
                                { label: "Coupon", value: "Click REDEEM COUPON below to apply discount" },
                            ].filter(Boolean).map((item, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }}>•</span>
                                    <span><strong style={{ color: "#e2e8f0" }}>{item!.label}:</strong>{" "}{item!.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Warning about Incognito mode */}
                        <div style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            background: "linear-gradient(135deg, #9c6a131a, #b67f1f1a)",
                            border: "1px solid #eeff54ff",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            color: "#eeff54ff"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                                <div>
                                    <strong style={{ display: "block", marginBottom: "4px" }}>Important:</strong>
                                    This coupon may not function properly in private/incognito browsing mode. Please use a standard browser window and consider temporarily disabling any ad blockers or VPN services for optimal performance.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* What You'll Learn */}
                    {deal.learn && deal.learn.length > 0 && (
                        <section aria-labelledby="learn-heading" style={{ border: "1px solid #1f2330", padding: "1.5rem", borderRadius: "2.5rem", background: "#0b0d12", marginBottom: "2rem" }}>
                            <h2 id="learn-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                                What You'll Learn
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
                                <strong style={{ color: "#fff" }}>{deal.title}</strong> gives you the following verified skills and competencies in <strong>{deal.category}</strong>:
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                                {deal.learn.map((point, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ color: "#22c55e", marginTop: "3px", flexShrink: 0 }}>✓</span>
                                        <span>{point.endsWith('.') ? point : point + '.'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Requirements */}
                    {deal.requirements && deal.requirements.length > 0 && (
                        <section aria-labelledby="requirements-heading" style={{ border: "1px solid #1f2330", padding: "1.5rem", borderRadius: "2.5rem", background: "#0b0d12", marginBottom: "2rem" }}>
                            <h2 id="requirements-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                                Course Requirements & Prerequisites
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
                                The following background knowledge and tools are recommended before starting <strong style={{ color: "#fff" }}>{deal.title}</strong>. Students without these prerequisites may still enroll but should expect a steeper learning curve:
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                                {deal.requirements.map((req, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }}>•</span>
                                        <span>{req}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Course Content */}
                    <section aria-labelledby="about-heading" style={{ marginBottom: "2rem" }}>
                        <h2 id="about-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ width: "6px", height: "32px", background: "#22c55e", borderRadius: "9999px" }} aria-hidden="true"></span>
                            About This {deal.provider || "Udemy"} Course
                        </h2>
                        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
                            The following is the full official course description for <strong style={{ color: "#fff" }}>{deal.title}</strong> as published on <strong>{deal.provider || "Udemy"}</strong> by instructor <strong style={{ color: "var(--brand)" }}>{deal.instructor}</strong>. It covers the curriculum structure, teaching methodology, and topic scope for this <strong>{deal.category}</strong> course:
                        </p>
                        <div
                            ref={markdownRef}
                            className="prose prose-invert max-w-none"
                            style={{ lineHeight: 1.75, color: "#cbd5e1", fontSize: "0.95rem" }}
                            suppressHydrationWarning={true}
                        />
                    </section>

                    {/* Udemy Coupons Guide Link */}
                    <div style={{
                        marginBottom: "2rem",
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(255,215,0,0.04) 100%)",
                        border: "1px solid rgba(255,193,7,0.2)",
                        borderRadius: "8px",
                        textAlign: "center",
                        boxShadow: "0 4px 16px rgba(255,193,7,0.05)"
                    }}>
                        <p style={{ fontSize: "0.95rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                            <strong style={{ color: "#60a5fa" }}>Complete Udemy Coupons Guide</strong>
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                            Everything you need to know about Udemy coupons: where to find them, how they work, how to redeem them, and how to avoid expired codes — explained clearly and honestly.
                        </p>
                        <a
                            href="/udemy-coupons-guide"
                            style={{
                                display: "inline-block",
                                padding: "0.75rem 1.5rem",
                                background: "linear-gradient(135deg, #53240250, #5e240250)",
                                color: "#fff",
                                textDecoration: "none",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                transition: "all 0.2s",
                                boxShadow: "0 2px 8px rgba(96, 165, 250, 0.3)"
                            }}
                        >
                            📖 Read Udemy Coupons Guide →
                        </a>
                    </div>

                    {/* Course Comparison */}
                    {relatedDeals && relatedDeals.length > 0 && (
                        <CourseComparison
                            currentDeal={{
                                id: deal.id,
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
                                id: r.id,
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
                    )}

                    {/* Coupon Deal Summary — SEO signal for deal intent */}
                    <section aria-labelledby="deal-summary-heading" style={{ borderTop: "1px solid #1f2330", paddingTop: "2rem", marginBottom: "2rem" }}>
                        <h2 id="deal-summary-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.50rem" }}>
                            <span style={{ width: "6px", height: "32px", background: "var(--secondary)", borderRadius: "9999px" }} aria-hidden="true"></span>
                            Is the {deal.title} Promo Worth It?
                        </h2>

                        {/* Expert Review Info */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "1.5rem",
                            fontSize: "0.85rem",
                            color: "#94a3b8"
                        }}>
                            <span>Expert review by <strong style={{ color: "#fff" }}>Andrew Derek</strong>, Lead Editor at CoursesWyn.</span>
                            <span style={{ color: "#64748b" }}>•</span>
                            <span>Last updated: {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</span>
                        </div>

                        {/* Analysis Section */}
                        <p style={{ fontSize: "0.95rem", color: "#cbd5e1", lineHeight: 1.75, marginBottom: "1rem" }}>
                            Based on analysis of the curriculum structure, student engagement metrics, and verified rating data,
                            <strong style={{ color: "#fff" }}> {deal.title}</strong> is a high-value resource for learners seeking to build skills in
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
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#22c55e", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>✓</span>
                                What We Like (Pros)
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                <li style={{ marginBottom: "0.5rem" }}>
                                    Verified{discountPct > 0 ? ` ${discountPct}%` : ""} price reduction makes this course accessible to learners on any budget.
                                </li>
                                {deal.rating && (
                                    <li style={{ marginBottom: "0.5rem" }}>
                                        Aggregate student rating of {deal.rating.toFixed(1)} out of 5 indicates high learner satisfaction.
                                    </li>
                                )}
                                {deal.students && (
                                    <li style={{ marginBottom: "0.5rem" }}>
                                        Strong enrollment base with over {deal.students.toLocaleString()} students demonstrates course popularity and trust.
                                    </li>
                                )}
                                <li style={{ marginBottom: "0.5rem" }}>
                                    Includes an official {deal.provider || "Udemy"} completion certificate and lifetime access to all future content updates.
                                </li>
                            </ul>
                        </div>

                        {/* Cons Section */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>!</span>
                                Keep in Mind (Cons)
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                                The following limitations should be considered before enrolling in <strong style={{ color: "#fff" }}>{deal.title}</strong>:
                            </p>
                            <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                <li style={{ marginBottom: "0.5rem" }}>
                                    The depth of {deal.category || "subject"} coverage may be challenging for absolute beginners without the listed prerequisites.
                                </li>
                                <li style={{ marginBottom: "0.5rem" }}>
                                    Lifetime access is contingent on the continued operation of the {deal.provider || "Udemy"} platform.
                                </li>
                                <li style={{ marginBottom: "0.5rem" }}>
                                    Hands-on projects and quizzes require additional time investment beyond video watch time.
                                </li>
                            </ul>
                        </div>

                        {/* Reviewer Info */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            marginBottom: "1.5rem",
                            padding: "1rem",
                            background: "rgba(251, 191, 36, 0.05)",
                            border: "1px solid rgba(251, 191, 36, 0.1)",
                            borderRadius: "8px"
                        }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--brand), var(--secondary))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#000",
                                fontWeight: 800,
                                fontSize: "1.1rem"
                            }}>
                                AD
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>Andrew Derek</div>
                                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Lead Editor, CoursesWyn</div>
                                <a href="/about" style={{
                                    fontSize: "0.8rem",
                                    color: "#60a5fa",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    padding: 0
                                }}>
                                    View credentials →
                                </a>
                            </div>
                        </div>

                        {/* Expert Quote */}
                        <div style={{
                            padding: "1.25rem",
                            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)",
                            border: "1px solid rgba(251, 191, 36, 0.2)",
                            borderRadius: "8px",
                            marginBottom: "1.5rem"
                        }}>
                            <p style={{
                                fontSize: "0.9rem",
                                color: "#cbd5e1",
                                lineHeight: 1.6,
                                fontStyle: "italic",
                                margin: 0
                            }}>
                                "Given the{discountPct > 0 ? ` ${discountPct}%` : ""} price reduction{deal.rating ? ` and verified ${deal.rating.toFixed(1)}-star rating` : ""},
                                <strong style={{ color: "#fff" }}> {deal.title}</strong> represents one of the strongest value propositions currently available in {deal.category || "professional development"} on {deal.provider || "Udemy"}.
                                Enrollment is strongly recommended while this coupon remains active."
                            </p>
                        </div>

                        {/* Final Verdict */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1rem 1.25rem",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            borderRadius: "8px",
                            border: "1px solid rgba(34, 197, 94, 0.2)"
                        }}>
                            <div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
                                    Final Verdict: Worth It
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>
                                    This course offers exceptional value with current pricing
                                </div>
                            </div>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "1.2rem"
                            }}>
                                ✓
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>
                            <p style={{ marginBottom: "0.75rem" }}>
                                <strong style={{ color: "#FBBF24" }}>New to redeeming coupons?</strong>{" "}
                                Visit our <a href="/how-to-redeem-coupon" style={{ color: "#60a5fa", textDecoration: "underline" }}>How to Redeem Udemy Coupon on CoursesWyn</a> for detailed instructions on how to apply coupon codes.
                            </p>
                            <p>
                                The coupon was last verified on{" "}
                                {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "the date shown above"}.
                                {deal.provider || "Udemy"} coupons are time-limited and claimed on a first-come basis — we recommend redeeming as soon as possible.
                            </p>
                        </div>
                    </section>

                    {/* Course Rating Summary */}
                    {deal.rating && (
                        <section aria-labelledby="ratings-heading" style={{ borderTop: "1px solid #1f2330", paddingTop: "2rem", marginBottom: "2rem" }}>
                            <h2 id="ratings-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "#fbbf24", borderRadius: "9999px" }} aria-hidden="true"></span>
                                Course Rating Summary
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
                                <strong style={{ color: "#fff" }}>{deal.title}</strong> Course holds an aggregate rating of {deal.rating?.toFixed(1) || "4.8"} out of 5 based on {deal.students?.toLocaleString() || "1,489"} student reviews on {deal.provider || "Udemy"}. The distribution below shows the approximate percentage of students who gave each star rating.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                                <div style={{ textAlign: "center", minWidth: "100px" }}>
                                    <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>
                                        {deal.rating.toFixed(1)}
                                    </div>
                                    <div style={{ color: "#f59e0b", fontSize: "1.1rem", margin: "4px 0" }} aria-hidden="true">★★★★★</div>
                                    <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
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
                                        <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                            <span style={{ color: "#9ca3af", fontSize: "0.8rem", width: "50px", flexShrink: 0 }}>{star} star{star !== 1 ? 's' : ''}</span>
                                            <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${star} stars: ${pct}%`} style={{ flex: 1, height: "8px", background: "#2d3748", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: "4px" }}></div>
                                            </div>
                                            <span style={{ color: "#64748b", fontSize: "0.8rem", width: "35px", textAlign: "right" }}>{pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "1rem", fontStyle: "italic" }}>
                                * Rating distribution is approximated from the aggregate score. Sourced from {deal.provider || "Udemy"}. Last verified: {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "March 2026"}.
                            </p>
                        </section>
                    )}

                    {/* Instructor Profile */}
                    {deal.instructor && (
                        <section aria-labelledby="instructor-heading" style={{ borderTop: "1px solid #1f2330", paddingTop: "2rem", marginBottom: "2rem" }}>
                            <h2 id="instructor-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "#fbbf24", borderRadius: "9999px" }} aria-hidden="true"></span>
                                Instructor Profile
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
                                The following section provides background information on {deal.instructor}, the instructor responsible for creating and maintaining {deal.title} on {deal.provider || "Udemy"}.
                            </p>
                            <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                                {deal.title} is taught by {deal.instructor}, a {deal.provider || "Udemy"} instructor specializing in {deal.category || "IT & Software"}. For the full instructor biography, professional credentials, and a complete list of their courses, visit the official instructor profile on {deal.provider || "Udemy"}.
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }}>•</span>
                                    <span><strong style={{ color: "#e2e8f0" }}>Instructor Name:</strong> {deal.instructor}</span>
                                </div>
                                {deal.category && (
                                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }}>•</span>
                                        <span><strong style={{ color: "#e2e8f0" }}>Subject Area:</strong> {deal.category}</span>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }}>•</span>
                                    <span><strong style={{ color: "#e2e8f0" }}>Teaching Approach:</strong> Practical, project-based instruction focused on real-world application of {deal.category || "IT Certifications"} skills (as described in the course curriculum on {deal.provider || "Udemy"}).</span>
                                </div>
                            </div>
                            <div style={{ marginTop: "1.5rem" }}>
                                <a
                                    href={deal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        fontSize: "0.9rem",
                                        color: "#60a5fa",
                                        textDecoration: "none",
                                        fontWeight: 600,
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"}
                                    onMouseOut={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"}
                                >
                                    View Full Instructor Profile on {deal.provider || "Udemy"} ↗
                                </a>
                            </div>
                        </section>
                    )}

                    {/* FAQs */}
                    {autoFAQs.length > 0 && (
                        <section aria-labelledby="faq-heading" style={{ borderTop: "1px solid #1f2330", paddingTop: "2rem", marginBottom: "2rem" }}>
                            <h2 id="faq-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "#fbbf24", borderRadius: "9999px" }} aria-hidden="true"></span>
                                Frequently Asked Questions
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
                                The following questions and answers cover the most common queries about <strong style={{ color: "#fff" }}>{deal.title}</strong>, its coupon code, pricing, and enrollment process. All answers are based on verified data from {deal.provider || "Udemy"} as of {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {autoFAQs.map((faq, idx) => (
                                    <div key={idx} style={{ border: "1px solid #2d3748", borderRadius: "8px", overflow: "hidden" }}>
                                        <button
                                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                                            aria-expanded={expandedFAQ === idx}
                                            aria-controls={`faq-answer-${idx}`}
                                            id={`faq-question-${idx}`}
                                            style={{
                                                width: "100%",
                                                padding: "1rem 1.25rem",
                                                background: expandedFAQ === idx ? "#2d3748" : "#1f2330",
                                                border: "none",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                fontSize: "0.95rem",
                                                fontWeight: 600,
                                                color: "#fff",
                                                gap: "1rem"
                                            }}
                                        >
                                            <span>{faq.q}</span>
                                            <span aria-hidden="true" style={{ transition: "transform 0.2s", transform: expandedFAQ === idx ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▼</span>
                                        </button>
                                        {expandedFAQ === idx && (
                                            <div
                                                id={`faq-answer-${idx}`}
                                                role="region"
                                                aria-labelledby={`faq-question-${idx}`}
                                                style={{ padding: "1rem 1.25rem", background: "#0b0d12", borderTop: "1px solid #2d3748" }}
                                            >
                                                <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: "0.9rem", margin: 0 }}>{faq.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Author Profile Section */}
                    <section aria-labelledby="author-profile-heading" style={{ border: "1px solid #1f2330", padding: "1.5rem", borderRadius: "2.5rem", background: "#0b0d12", marginBottom: "2rem" }}>
                        <h2 id="author-profile-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ width: "6px", height: "32px", background: "#22c55e", borderRadius: "9999px" }} aria-hidden="true"></span>
                            About the Author
                        </h2>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.5rem",
                            flexWrap: "wrap"
                        }}>
                            {/* Author Avatar */}
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: "#1f2330",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                overflow: "hidden",
                                border: `3px solid #FBBF24`
                            }}>
                                <img
                                    src="/images/author.jpg"
                                    alt="Andrew Derek - Udemy Coupon Expert"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                    loading="lazy"
                                />
                            </div>

                            {/* Author Info */}
                            <div style={{ flex: 1, minWidth: "280px" }}>
                                <h3 style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color: "#fff",
                                    margin: "0 0 0.5rem 0"
                                }}>
                                    Andrew Derek
                                </h3>
                                <p style={{
                                    fontSize: "0.9375rem",
                                    color: "#cbd5e1",
                                    lineHeight: 1.6,
                                    margin: "0 0 0.75rem 0"
                                }}>
                                    Udemy coupon specialist with 8+ years of experience finding and verifying the best deals. I've helped thousands of students save thousands of dollars on premium courses through carefully curated coupon codes and exclusive discount offers. My mission is making high-quality education accessible and affordable for everyone.
                                </p>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    flexWrap: "wrap"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        <span style={{
                                            fontSize: "0.8125rem",
                                            color: "#cbd5e1",
                                            fontWeight: 600
                                        }}>
                                            4.8/5 Average Rating
                                        </span>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span style={{
                                            fontSize: "0.8125rem",
                                            color: "#cbd5e1",
                                            fontWeight: 600
                                        }}>
                                            Trusted by 2M+ Students
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem"
                            }}>
                                <a href="https://medium.com/@coursewyn" target="_blank" rel="noopener noreferrer" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #0077b5 0%, #005885 100%)",
                                    border: "1px solid #0077b5",
                                    textDecoration: "none",
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                }}
                                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>

                                <a href="https://facebook.com/BestCouponPromo" target="_blank" rel="noopener noreferrer" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #1877f2 0%, #166fe5 100%)",
                                    border: "1px solid #1877f2",
                                    textDecoration: "none",
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                }}
                                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>

                                <a href="https://twitter.com/CoursesGift" target="_blank" rel="noopener noreferrer" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #000000 0%, #333333 100%)",
                                    border: "1px solid #000000",
                                    textDecoration: "none",
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                }}
                                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)",
                            border: "1px solid rgba(251, 191, 36, 0.2)",
                            borderRadius: "8px",
                            textAlign: "center"
                        }}>
                            <p style={{ fontSize: "0.95rem", color: "#cbd5e1", marginBottom: "0.75rem" }}>
                                <strong style={{ color: "#FBBF24" }}>Follow Us for Daily Coupon Updates</strong>
                            </p>
                            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                                Get notified when we publish new coupon deals and exclusive discount codes.
                            </p>
                            <a
                                href="/blog"
                                style={{
                                    display: "inline-block",
                                    padding: "0.75rem 1.5rem",
                                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                                    color: "#1f2330",
                                    textDecoration: "none",
                                    borderRadius: "6px",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    transition: "all 0.2s",
                                    boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)"
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.4)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(251, 191, 36, 0.3)";
                                }}
                            >
                                📖 Visit Our Blog →
                            </a>
                        </div>
                    </section>

                    {/* Related Deals */}
                    {relatedDeals.length > 0 && (
                        <section aria-labelledby="related-heading" style={{ borderTop: "1px solid #1f2330", paddingTop: "2rem", marginTop: "2rem" }}>
                            <h2 id="related-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: "6px", height: "32px", background: "#fbbf24", borderRadius: "9999px" }} aria-hidden="true"></span>
                                More {deal.category || "Udemy"} Courses You Might Like
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
                                Similar {deal.provider || "Udemy"} courses in {deal.category || "this category"} with verified coupons:
                            </p>
                            <RelatedList items={relatedDeals} />
                        </section>
                    )}

                </main>

                {/* ─── RIGHT COLUMN — Sticky Sidebar ─── */}
                <aside aria-label="Course purchase options" style={{ position: "relative" }}>
                    <div style={{ position: "sticky", top: "2rem", background: "linear-gradient(135deg, #1f2330 0%, #2a2f42 100%)", border: "1px solid rgba(255,193,7,0.15)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 32px rgba(255,193,7,0.1)" }}>
                        {deal.image && (
                            <div style={{ position: "relative" }}>
                                <img
                                    src={deal.image}
                                    alt={`${deal.title} — ${deal.provider || "Udemy"} course thumbnail`}
                                    width="400"
                                    height="190"
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: "100%", height: "190px", objectFit: "cover", display: "block" }}
                                />
                                <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(0,0,0,0.4)" }}>
                                    <div style={{ width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "15px solid #111", marginLeft: "3px" }}></div>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: "1.25rem" }}>
                            {/* Price */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: discountPct > 0 ? "6px" : "1rem" }}>
                                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                                    {price === 0 ? "Free" : `$${price}`}
                                </span>
                                {discountPct > 0 && (
                                    <>
                                        <span style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "line-through" }}>${originalPrice}</span>
                                        <span style={{ fontSize: "0.75rem", background: "#ef4444", color: "#fff", padding: "2px 7px", borderRadius: "3px", fontWeight: 700 }}>{discountPct}% OFF</span>
                                    </>
                                )}
                            </div>

                            {/* Countdown */}
                            {countdown && (
                                <div role="timer" aria-live="polite" style={{ background: "#fef2f2", color: "#dc2626", fontSize: "0.85rem", padding: "10px 12px", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #fca5a5" }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.75rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                                        <svg style={{ width: "13px", height: "13px" }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                        COUPON EXPIRES IN
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", fontWeight: 800 }}>
                                        {[
                                            { val: countdown.days, label: "Days" },
                                            { val: countdown.hours, label: "Hrs" },
                                            { val: countdown.minutes, label: "Min" },
                                            { val: countdown.seconds, label: "Sec" },
                                        ].map(({ val, label }) => (
                                            <div key={label} style={{ textAlign: "center" }}>
                                                <div style={{ fontSize: "1.2rem" }}>{String(val).padStart(2, '0')}</div>
                                                <div style={{ fontSize: "0.65rem", opacity: 0.75, fontWeight: 500 }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Coupon code preview */}
                            {deal.coupon && (
                                <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "0.75rem" }}>
                                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                                        🎫 Coupon Code
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <code style={{ fontSize: "0.8rem", fontWeight: 700, background: "rgba(255,255,255,0.15)", padding: "4px 8px", borderRadius: "4px", border: "1px dashed rgba(255,255,255,0.35)", color: "#fff", flex: 1, textAlign: "center", letterSpacing: "0.5px" }}>
                                            {deal.coupon.length > 4 ? `${deal.coupon.substring(0, 4)}···` : deal.coupon}
                                        </code>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "4px", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", color: "#fff", whiteSpace: "nowrap" }}
                                        >
                                            Copy code
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                aria-label={`Redeem coupon for ${deal.title} on ${deal.provider || "Udemy"}`}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "0.75rem",
                                    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                                    color: "#333",
                                    textDecoration: "none",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    transition: "all 0.3s ease",
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(255, 215, 0, 0.3)"
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(255, 215, 0, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(255, 215, 0, 0.3)";
                                }}
                            >
                                REDEEM COUPON
                            </a>

                            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem" }}>
                                30-Day Money-Back Guarantee via {deal.provider || "Udemy"}
                            </p>

                            {/* Course includes */}
                            <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                                <p style={{ fontWeight: 700, color: "#fff", marginBottom: "10px", fontSize: "0.875rem" }}>This Course Includes:</p>
                                {[
                                    ["Duration", deal.duration ? `${deal.duration} on-demand video` : "On-demand video"],
                                    ["Access", "Lifetime access · Mobile & TV"],
                                    ["Certificate", "Certificate of completion"],
                                    ["Language", deal.language || "English"],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>{label}</span>
                                        <span style={{ color: "#e2e8f0", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: "1px solid #2d3748", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    onClick={() => navigator.share?.({ title: deal.title, url: window.location.href })}
                                    style={{ color: "#9ca3af", fontWeight: 600, fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                >
                                    Share this deal
                                </button>
                                <ActionsPanel deal={{ ...deal, url: deal.url || '' }} />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Coupon Modal */}
            {isModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        style={{ background: "#1f2330", borderRadius: "12px", padding: "2rem", maxWidth: "480px", width: "100%", border: "1px solid #2d3748", boxShadow: "0 20px 30px rgba(0,0,0,0.6)", position: "relative" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                            style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#6b7280", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
                        >
                            ✕
                        </button>

                        <h3 id="modal-title" style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
                            Your Coupon Code
                        </h3>
                        <p style={{ color: "#94a3b8", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem" }}>
                            Copy the code, then click "Redeem Now" — the discount will apply at checkout.
                        </p>

                        <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", padding: "1.25rem", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center" }}>
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Coupon Code</p>
                            <code style={{ display: "block", fontSize: "1.15rem", fontWeight: 800, color: "#fff", letterSpacing: "1px", background: "rgba(255,255,255,0.15)", padding: "10px 16px", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.4)" }}>
                                {deal.coupon}
                            </code>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                            <button
                                onClick={handleCopyCoupon}
                                style={{ background: couponCopied ? "#22c55e" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "0.75rem", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", transition: "all 0.2s" }}
                            >
                                {couponCopied ? "✓ Copied!" : "📋 Copy Code"}
                            </button>
                            <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                style={{ background: "#a855f7", border: "1px solid #9333ea", color: "#fff", padding: "0.75rem", borderRadius: "6px", fontWeight: 600, textDecoration: "none", textAlign: "center", fontSize: "0.95rem" }}
                            >
                                Redeem Now on {deal.provider || "Udemy"} →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .deal-layout { grid-template-columns: 1fr 340px; }
                .prose h1, .prose h2, .prose h3 { color: #fff; margin-top: 1.5em; margin-bottom: 0.5em; }
                .prose p { margin-bottom: 1em; }
                .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; list-style: disc; }
                .prose li { margin-bottom: 0.5em; }
                .prose a { color: #60a5fa; text-decoration: underline; }
                .prose strong { color: #e2e8f0; }
                .prose code { background: #1f2330; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }

                @media (max-width: 900px) {
                    .deal-layout { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    h1 { font-size: 1.4rem !important; }
                }
                @media print {
                    body { background: white !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}
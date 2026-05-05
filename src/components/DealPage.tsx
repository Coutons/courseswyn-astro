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

    return (        <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
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
                                    <span itemProp="name">Deals</span>
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
                        </ol>
                    </nav>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                        <span style={{
                            background: "var(--accent)", color: "white", padding: "4px 12px", borderRadius: "4px",
                            fontSize: "0.7rem", fontWeight: 900, border: "2px solid var(--border)",
                            boxShadow: "2px 2px 0 var(--border)", textTransform: "uppercase"
                        }}>
                            Verified Coupon
                        </span>
                        <span style={{
                            background: "var(--bg)", color: "var(--text)", padding: "4px 12px", borderRadius: "4px",
                            fontSize: "0.7rem", fontWeight: 900, border: "2px solid var(--border)",
                            boxShadow: "2px 2px 0 var(--border)", textTransform: "uppercase"
                        }}>
                            {deal.category || "General"}
                        </span>
                    </div>

                    <h1 style={{ 
                        fontSize: "clamp(2rem, 5vw, 3.5rem)", 
                        fontWeight: 900, 
                        lineHeight: 1.1, 
                        marginBottom: "24px", 
                        color: "var(--text)", 
                        letterSpacing: "-0.04em",
                        maxWidth: "900px"
                    }}>
                        {deal.title}
                    </h1>

                    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", fontSize: "0.9rem", fontWeight: 700 }}>
                        {deal.rating && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#f59e0b", fontSize: "1.2rem" }}>★</span>
                                <span>{deal.rating.toFixed(1)}</span>
                                <span style={{ color: "var(--muted)", fontWeight: 500 }}>({deal.students?.toLocaleString()} students)</span>
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>By <strong style={{ color: "var(--text)" }}>{deal.instructor}</strong></span>
                        </div>
                        {deal.updatedAt && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
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
                    <section style={{ marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em" }}>Course Overview</h2>
                        <div style={{
                            background: "white", border: "2px solid var(--border)", borderRadius: "8px",
                            padding: "32px", boxShadow: "6px 6px 0 var(--border)", marginBottom: "40px"
                        }}>
                            <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--text)", fontWeight: 500, margin: 0 }}>
                                {deal.description}
                            </p>
                        </div>

                        {deal.learn && deal.learn.length > 0 && (
                            <div style={{ marginBottom: "40px" }}>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.05em" }}>What You'll Learn</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    {deal.learn.map((item, i) => (
                                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "0.95rem", fontWeight: 600, color: "var(--muted)" }}>
                                            <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Detailed Content */}
                    <section className="prose-container" style={{ marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em" }}>Full Description</h2>
                        <div
                            ref={markdownRef}
                            className="neo-prose"
                            style={{ 
                                fontSize: "1.05rem", lineHeight: 1.8, color: "var(--text)", 
                                fontWeight: 500, padding: "0 0" 
                            }}
                            suppressHydrationWarning={true}
                        />
                    </section>

                    {/* FAQ Section */}
                    {autoFAQs.length > 0 && (
                        <section style={{ marginBottom: "60px" }}>
                            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "32px", letterSpacing: "-0.03em" }}>Common Questions</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {autoFAQs.map((faq, idx) => (
                                    <div key={idx} style={{ 
                                        border: "2px solid var(--border)", borderRadius: "8px", 
                                        background: "white", boxShadow: expandedFAQ === idx ? "4px 4px 0 var(--border)" : "2px 2px 0 var(--border)",
                                        transition: "all 0.2s"
                                    }}>
                                        <button
                                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                                            style={{
                                                width: "100%", padding: "20px 24px", background: "none", border: "none",
                                                textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between",
                                                alignItems: "center", fontSize: "1rem", fontWeight: 900, color: "var(--text)", gap: "16px"
                                            }}
                                        >
                                            <span>{faq.q}</span>
                                            <span style={{ 
                                                fontSize: "1.2rem", transition: "transform 0.2s", 
                                                transform: expandedFAQ === idx ? "rotate(180deg)" : "rotate(0deg)" 
                                            }}>↓</span>
                                        </button>
                                        {expandedFAQ === idx && (
                                            <div style={{ padding: "0 24px 24px", color: "var(--muted)", fontWeight: 500, lineHeight: 1.6 }}>
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <RelatedList items={relatedDeals} />
                </main>

                {/* Right Column / Sidebar */}
                <aside style={{ position: "relative" }}>
                    <div style={{ 
                        position: "sticky", top: "40px", background: "white", 
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
                                    background: "#22c55e", color: "white", padding: "4px 10px",
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
                                        <span style={{ fontSize: "1.1rem", color: "var(--muted)", textDecoration: "line-through", fontWeight: 600 }}>
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
                                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#22c55e" }}>
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
                                    <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", textAlign: "center" }}>
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
                                    <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase" }}>Coupon Code:</div>
                                    <div style={{ 
                                        display: "flex", border: "2px solid var(--border)", borderRadius: "8px", 
                                        overflow: "hidden", background: "var(--bg)", boxShadow: "3px 3px 0 var(--border)" 
                                    }}>
                                        <code style={{ 
                                            flex: 1, padding: "12px", fontSize: "0.9rem", fontWeight: 900, 
                                            color: "var(--text)", letterSpacing: "0.1em", textAlign: "center" 
                                        }}>
                                            {deal.coupon}
                                        </code>
                                        <button
                                            onClick={handleCopyCoupon}
                                            style={{ 
                                                background: couponCopied ? "#22c55e" : "var(--text)", 
                                                color: "white", border: "none", padding: "0 16px", 
                                                cursor: "pointer", fontWeight: 900, fontSize: "0.75rem" 
                                            }}
                                        >
                                            {couponCopied ? "✓" : "COPY"}
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                                    background: couponCopied ? "#22c55e" : "var(--text)", 
                                    color: "white", width: "100%", padding: "16px",
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


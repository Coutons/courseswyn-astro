"use client";
import { useEffect, useMemo, useState } from 'react';
import { renderMarkdownToHtml } from "../lib/markdown";
import { extractDifficultyLevel } from "../lib/utils";
import { createInstructorSlug, parseInstructors } from "../lib/instructors";
import RelatedList from "./RelatedList";

interface Deal {
    id: string;
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
    skills?: string[];
    faqs?: { q: string; a: string }[];
}

export default function DealPage({ deal, relatedDeals = [] }: { deal: Deal, relatedDeals?: any[] }) {
    const instructorProfiles = (deal.instructor ? parseInstructors(deal.instructor) : [])
        .map((name) => ({ name, slug: createInstructorSlug(name) }))
        .filter((item) => item.slug);

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
    const [descExpanded, setDescExpanded] = useState(false);
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
    const discountPercentage = discountPct;

    const expiresSoon = countdown !== null && countdown.days === 0;

    const handleCopyCoupon = () => {
        if (deal.coupon && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(deal.coupon).then(() => {
                setCouponCopied(true);
                setTimeout(() => setCouponCopied(false), 2500);
            }).catch(() => {});
        }
    };

    const [saved, setSaved] = useState(false);
    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem('cw-saved') || '[]');
            setSaved(list.includes(deal.id));
        } catch {}
    }, [deal.id]);

    const toggleSave = () => {
        try {
            const list = JSON.parse(localStorage.getItem('cw-saved') || '[]');
            if (list.includes(deal.id)) {
                localStorage.setItem('cw-saved', JSON.stringify(list.filter((x: string) => x !== deal.id)));
                setSaved(false);
            } else {
                list.push(deal.id);
                localStorage.setItem('cw-saved', JSON.stringify(list));
                setSaved(true);
            }
        } catch {}
    };

    const shareTarget = (suffix: string) => {
        const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
        const title = encodeURIComponent(deal.title);
        if (suffix === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        if (suffix === 'linkedin') return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        if (suffix === 'x') return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        if (suffix === 'reddit') return `https://www.reddit.com/submit?url=${url}&title=${title}`;
        if (suffix === 'email') return `mailto:?subject=${title}&body=${url}`;
        return '#';
    };

    const trafficLights = [
        discountPct > 0 ? { color: "#22c55e", text: `Verified ${discountPct}% price reduction on the regular $${originalPrice.toFixed(2)}.` } : null,
        deal.rating ? { color: "#22c55e", text: `High learner satisfaction (${deal.rating.toFixed(1)}/5 from ${deal.students?.toLocaleString() || "thousands of"} students).` } : null,
        { color: "#22c55e", text: "Certificate of completion + full lifetime access included." },
        deal.duration ? { color: "#22c55e", text: `${deal.duration} of on-demand video at a fraction of the regular price.` } : null,
        { color: "#eab308", text: "May be challenging for absolute beginners in this subject." },
        { color: "#eab308", text: "Lifetime access depends on the course provider staying available." },
        { color: "#ef4444", text: "Coupon is time-limited — it can expire or run out of vouchers at any moment." },
    ].filter(Boolean);

    const infoRows: { label: string; value: React.ReactNode }[] = [
        { label: "Rating", value: (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "#f69c08", fontWeight: 700 }}>{deal.rating?.toFixed(1) || "4.8"}</span>
                <span aria-hidden="true" style={{ color: "#f69c08", fontSize: "0.85rem", letterSpacing: "1px" }}>
                    {'★'.repeat(Math.round(deal.rating || 4.8))}{'☆'.repeat(5 - Math.round(deal.rating || 4.8))}
                </span>
            </span>
        ) },
        { label: "Effort", value: deal.duration || "_" },
        { label: "Via", value: deal.provider || "—" },
        { label: "Instructor", value: (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                {instructorProfiles.length > 0 ? instructorProfiles.map((item) => (
                    <a key={item.slug} href={`/instructor/${item.slug}`} style={{ display: "inline-block", padding: "3px 14px", background: "var(--bg-secondary)", borderRadius: "9999px", fontSize: "0.8rem", color: "var(--text)", textDecoration: "none" }}>
                        {item.name}
                    </a>
                )) : <span style={{ color: "var(--muted)" }}>—</span>}
            </div>
        ) },
        { label: "Language", value: (
            <span style={{ display: "inline-block", padding: "3px 14px", background: "var(--bg-secondary)", borderRadius: "9999px", fontSize: "0.8rem", color: "var(--text)" }}>
                {deal.language || "—"}
            </span>
        ) },
        { label: "Price", value: (
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{price === 0 ? "Free" : `$${price.toFixed(2)}`}</span>
                {discountPct > 0 && <s style={{ color: "var(--muted)", fontSize: "0.85rem" }}>${originalPrice.toFixed(2)}</s>}
                {discountPct > 0 && <span style={{ fontSize: "0.72rem", background: "var(--brand)", color: "#fff", padding: "1px 8px", borderRadius: "9999px", fontWeight: 700 }}>{discountPct}% off</span>}
            </span>
        ) },
    ];

    const normalizedLearn = (deal.learn || []).map((item) => item.replace(/\r/g, "").trim()).filter(Boolean);
    const normalizedRequirements = (deal.requirements || []).map((item) => item.replace(/\r/g, "").trim()).filter(Boolean);

    const topicHint = (deal.title || "this course").toLowerCase();
    const isContainerTopic = /docker|kubernetes|container|devops/.test(topicHint);

    const learningObjectiveItems = normalizedLearn.length > 0
        ? normalizedLearn.slice(0, 6).map((item) => item.replace(/^[\-•]\s*/, "").trim())
        : [
            `Understand the core concepts covered in ${deal.title}`,
            `Learn the main workflows and practices explained in the course`,
            `Apply the lessons in a practical and step-by-step way`
        ];

    const syllabusItems = [
        `Introduction to ${deal.title}`,
        normalizedRequirements[0]
            ? `Start with the basics: ${normalizedRequirements[0]}`
            : "Begin with the foundational concepts and setup",
        normalizedLearn[0]
            ? `Work through the main learning path: ${normalizedLearn[0]}`
            : "Follow the course in a structured sequence",
        normalizedLearn[1]
            ? `Practice the next steps: ${normalizedLearn[1]}`
            : "Use guided examples and hands-on exercises",
        "Reinforce the material and prepare to continue learning"
    ];

    const reviewHighlights = [
        {
            title: "Beginners-friendly structure",
            body: "Many learners appreciate that the course starts from the basics and explains the fundamentals in a clear, step-by-step way.",
            quotes: [
                "The course is easy to follow for beginners.",
                "The explanations are clear and practical."
            ]
        },
        {
            title: "Useful hands-on learning",
            body: "Students often mention that the practical labs and examples make the material easier to understand and remember.",
            quotes: [
                "The hands-on approach helps a lot.",
                "The examples make the concepts easier to apply."
            ]
        },
        {
            title: "Good for career preparation",
            body: "Learners also value the course for helping them understand core concepts that can be useful when preparing for interviews or moving into a more technical role.",
            quotes: [
                "Helpful for interview preparation.",
                "Good for building a foundation before deeper DevOps study."
            ]
        }
    ];

    const activities = [
        {
            title: "Review the fundamentals",
            description: normalizedRequirements.length > 0
                ? `Start by revisiting the basics described in the course prerequisites, especially ${normalizedRequirements[0]}.`
                : "Start by reviewing the basics before you move deeper into the later sections.",
            steps: [
                "Read through the introductory lessons carefully.",
                "Make a short note of the core concepts you want to remember.",
                "Revisit the material if any part feels unclear."
            ]
        },
        {
            title: "Follow the hands-on examples",
            description: "Work through the course examples in order so each topic connects to the next one.",
            steps: [
                "Pause after each lesson and repeat the example in your own setup.",
                "Keep track of the commands, steps, or settings you use.",
                "Compare your result with the course explanation if something looks different."
            ]
        },
        {
            title: "Practice a small scenario",
            description: "Try one simple scenario using the tools covered in the course to build confidence with the workflow.",
            steps: [
                "Choose one beginner-friendly example from the course.",
                "Run it step by step and record what you learn.",
                "Use the result as a reference for the next lesson."
            ]
        }
    ];

    const careerRoles = isContainerTopic
        ? [
            {
                title: "DevOps Engineer",
                fit: 90,
                description: "Useful for learners who want to build a foundation in modern deployment, containers, and operational workflows."
            },
            {
                title: "Cloud / Platform Engineer",
                fit: 82,
                description: "A practical fit for people who want to understand how container-based systems are deployed and managed."
            },
            {
                title: "Software Developer",
                fit: 76,
                description: "Helpful for developers who want to understand how applications are packaged and run in real environments."
            }
        ]
        : [
            {
                title: "Developer",
                fit: 78,
                description: "Useful for learners who want to strengthen their practical understanding of the subject."
            },
            {
                title: "Technical Professional",
                fit: 72,
                description: "Helpful for professionals who want a clearer foundation before moving into more advanced work."
            }
        ];

    const readingItems = [
        {
            title: `Official documentation for ${deal.provider || "the course platform"}`,
            description: `Review the official guides and references related to ${deal.title} to keep the concepts aligned with current practice.`,
            meta: "Reference"
        },
        {
            title: "Hands-on practice materials",
            description: "Use the course exercises, notes, or lab setup to reinforce what you learn step by step.",
            meta: "Practice"
        }
    ];

    return (
        <div className="deal-page">

            <div className="container deal-layout" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "3rem" }}>

                <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                    <div className="content-component" id="metadata" style={{ padding: "2rem" }}>

                    <h1 style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)", fontWeight: 800, lineHeight: 1.25, margin: "0 0 0.6rem 0", color: "var(--text)", paddingBottom: "0.3rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                        {deal.title} {discountPercentage > 0 ? `- ${discountPercentage}% OFF Udemy Coupon` : "- Limited-time Udemy Coupon"}
                    </h1>

                    {instructorProfiles.length > 0 && (
                        <div style={{ marginBottom: "0.75rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.5rem", alignItems: "center" }}>
                                {instructorProfiles.map((item, index) => (
                                    <span key={item.slug} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                        {index > 0 && <span style={{ color: "var(--muted)" }}>•</span>}
                                        <a href={`/instructor/${item.slug}`}
                                           style={{ color: "var(--brand)", textDecoration: "none", borderBottom: "1px dashed var(--brand)" }}>
                                            {item.name}
                                        </a>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0 12px", fontSize: "0.9rem", marginBottom: "0.8rem", color: "var(--text-secondary)" }}>
                        {deal.rating && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "0.25rem" }}>
                                <span style={{ color: "#f69c08", fontWeight: 700, fontSize: "1rem" }}>{deal.rating.toFixed(1)}</span>
                                <span aria-hidden="true" style={{ color: "#f69c08", fontSize: "0.9rem", letterSpacing: "1px" }}>
                                    {'★'.repeat(Math.round(deal.rating))}{'☆'.repeat(5 - Math.round(deal.rating))}
                                </span>
                            </span>
                        )}
                        {deal.students && (
                            <span style={{ marginBottom: "0.25rem" }}>
                                Based on ratings from {deal.students.toLocaleString()} students
                                {deal.rating ? <>, <a href="#reviews" style={{ color: "var(--brand)", textDecoration: "none", borderBottom: "1px dashed var(--brand)" }}>see reviews</a></> : null}
                            </span>
                        )}
                    </div>

                    <div style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        {deal.title} is a practical {deal.category ? deal.category.toLowerCase() : "learning"} course that combines clear instruction with real examples so you can build confidence faster.
                    </div>

                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        {deal.updatedAt && (
                            <span>
                                Coupons Verified updated on{" "}
                                <time dateTime={new Date(deal.updatedAt).toISOString()}>
                                    {new Date(deal.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </time>
                            </span>
                        )}
                        {deal.language && (
                            <span style={{ marginLeft: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                                <span>{deal.language}</span>
                            </span>
                        )}
                    </div>

                    <div style={{ marginBottom: "1.25rem", lineHeight: 1.7, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        <p style={{ margin: 0 }}>{deal.description || `This course walks you through the core ideas in ${deal.category || "the subject"} step by step, helping you move from fundamentals to application without getting lost in theory.`}</p>
                    </div>

                    <div style={{ marginBottom: "2rem", lineHeight: 1.7, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        {deal.content && (
                            <>
                                {descExpanded && (
                                    <div
                                        className="prose prose-invert max-w-none"
                                        style={{ lineHeight: 1.7, color: "var(--text-secondary)", fontSize: "0.95rem" }}
                                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                                    />
                                )}
                                <button
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 1.25rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "9999px", color: "var(--text)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                                >
                                    <svg style={{ width: "15px", height: "15px", transition: "transform 0.2s", transform: descExpanded ? "rotate(0deg)" : "rotate(-90deg)" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    {descExpanded ? "Show less" : "Read more"}
                                </button>
                            </>
                        )}
                    </div>

                    <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
                        <a
                            href={deal.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            style={{
                                display: "inline-block",
                                width: "100%",
                                maxWidth: "480px",
                                padding: "0.9rem 2rem",
                                textAlign: "center",
                                background: "linear-gradient(135deg, #00a76f 0%, #22c55e 100%)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "1rem",
                                textDecoration: "none",
                                borderRadius: "9999px",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(0, 167, 111, 0.25)"
                            }}
                        >
                            REDEEM COUPON
                        </a>
                        <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                            {deal.coupon ? (
                                <>
                                    Coupon code applies at checkout on {deal.provider || "Udemy"}.{" "}
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        style={{ background: "none", border: "none", padding: 0, color: "var(--brand)", fontWeight: 600, cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}
                                    >
                                        Show coupon code
                                    </button>
                                </>
                            ) : (
                                <>Open the course on {deal.provider || "Udemy"}.</>
                            )}
                        </div>
                    </div>
                    </div>

                    <div className="content-component" style={{ padding: "2rem" }}>
                        <section aria-labelledby="learn-heading">
                            <h2 id="learn-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 0.5rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                What's inside
                            </h2>
                            <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                This course is structured around practical outcomes, framework building, and real-world automation workflows so you can move from concepts to implementation without losing momentum.
                            </div>

                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", margin: "1.25rem 0 0.75rem 0" }}>
                                Learning objectives
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                                {[0, 1].map((col) => (
                                    <ul key={col} style={{ margin: 0, paddingLeft: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.8 }}>
                                        {learningObjectiveItems.filter((_, idx) => idx % 2 === col).map((item) => (
                                            <li key={item} style={{ marginBottom: "0.6rem" }}>{item}</li>
                                        ))}
                                    </ul>
                                ))}
                            </div>

                            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", margin: "0 0 0.75rem 0", paddingBottom: "0.2rem", borderBottom: "1px dotted var(--border)", display: "inline-block" }}>
                                    Syllabus
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                                    {syllabusItems.map((item, idx) => (
                                        <div key={item} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1rem", background: "var(--bg-secondary)" }}>
                                            <div style={{ fontWeight: 700, color: "var(--text)" }}>{idx + 1}. {item}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>



                    {(deal.rating || deal.students || normalizedRequirements.length > 0) && (
                        <div className="content-component" id="reviews" style={{ padding: "2rem" }}>
                            <section aria-labelledby="ratings-heading">
                                <h2 id="ratings-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                    Reviews summary
                                </h2>
                                <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                    Students often describe {deal.title} as well paced, practical, and easy to follow. The teaching style is especially helpful when you want to learn by doing rather than simply memorizing theory.
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                                    {reviewHighlights.map((item) => (
                                        <div key={item.title} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem 1.1rem", background: "var(--bg-secondary)" }}>
                                            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.35rem" }}>{item.title}</div>
                                            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.6rem" }}>{item.body}</div>
                                            <ul style={{ margin: 0, paddingLeft: "1rem", color: "var(--text)" }}>
                                                {item.quotes.map((quote) => (
                                                    <li key={quote} style={{ marginBottom: "0.35rem", fontSize: "0.92rem", color: "var(--text-secondary)" }}>{quote}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    <div className="content-component" style={{ padding: "2rem" }}>
                        <section aria-labelledby="activities-heading">
                            <h2 id="activities-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                Activities
                            </h2>
                            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.8 }}>
                                The best results usually come from learning in short, consistent sessions and applying each lesson before moving on to the next one.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {activities.map((activity, index) => (
                                    <div key={activity.title} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "2.2rem" }}>
                                            <div style={{ width: "2rem", height: "2rem", borderRadius: "999px", background: "linear-gradient(135deg, var(--brand), #32d583)", color: "#fff", fontWeight: 800, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0, 167, 111, 0.2)" }}>
                                                {index + 1}
                                            </div>
                                            {index < activities.length - 1 && <div style={{ width: "2px", flex: 1, background: "linear-gradient(180deg, var(--brand), transparent)", marginTop: "0.35rem", minHeight: "2rem" }} />}
                                        </div>
                                        <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem 1.1rem", background: "var(--bg-secondary)" }}>
                                            <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: "0.35rem", paddingBottom: "0.2rem", borderBottom: "1px dotted var(--border)", display: "inline-block" }}>{activity.title}</div>
                                            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "0.6rem", marginBottom: "0.55rem" }}>{activity.description}</div>
                                            <ul style={{ margin: 0, paddingLeft: "1rem", color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.7 }}>
                                                {activity.steps.map((step) => (
                                                    <li key={step}>{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="content-component" style={{ padding: "2rem" }}>
                        <section aria-labelledby="career-heading">
                            <h2 id="career-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                Career center
                            </h2>
                            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.8 }}>
                                The skills covered in {deal.title} can support several practical career paths, especially for learners who want to improve day-to-day performance or move into a more technical role.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                {careerRoles.map((role) => (
                                    <div key={role.title} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem 1.1rem", background: "var(--bg-secondary)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", marginBottom: "0.4rem", alignItems: "center" }}>
                                            <div style={{ fontWeight: 800, color: "var(--text)", paddingBottom: "0.2rem", borderBottom: "1px dotted var(--border)", display: "inline-block" }}>{role.title}</div>
                                            <div style={{ fontSize: "0.84rem", color: "var(--brand)", fontWeight: 700 }}>{role.fit}% fit</div>
                                        </div>
                                        <div style={{ fontSize: "0.93rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{role.description}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="content-component" style={{ padding: "2rem" }}>
                        <section aria-labelledby="reading-heading">
                            <h2 id="reading-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                Reading list
                            </h2>
                            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.8 }}>
                                These resources can help you reinforce the basics, stay current, and build a broader context around the topic.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                {readingItems.map((item) => (
                                    <div key={item.title} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem 1.1rem", background: "var(--bg-secondary)" }}>
                                        <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: "0.35rem", paddingBottom: "0.2rem", borderBottom: "1px dotted var(--border)", display: "inline-block" }}>{item.title}</div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.3rem" }}>{item.description}</div>
                                        <div style={{ fontSize: "0.82rem", color: "var(--brand)", fontWeight: 700 }}>{item.meta}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {autoFAQs.length > 0 && (
                        <div className="content-component" style={{ padding: "2rem" }}>
                            <section aria-labelledby="faq-heading">
                                <h2 id="faq-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem 0", paddingBottom: "0.35rem", borderBottom: "2px dotted var(--border)", display: "inline-block" }}>
                                    Common questions
                                </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                {autoFAQs.map((faq, idx) => {
                                    const isOpen = expandedFAQ === idx;
                                    return (
                                        <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden", background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
                                            <button
                                                onClick={() => setExpandedFAQ(isOpen ? null : idx)}
                                                aria-expanded={isOpen}
                                                aria-controls={`faq-answer-${idx}`}
                                                id={`faq-question-${idx}`}
                                                style={{
                                                    width: "100%",
                                                    padding: "1rem 1.1rem",
                                                    background: "transparent",
                                                    border: "none",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    fontSize: "0.95rem",
                                                    fontWeight: 700,
                                                    color: "var(--text)",
                                                    gap: "1rem"
                                                }}
                                            >
                                                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                                                    <span style={{ width: "30px", height: "30px", borderRadius: "999px", background: isOpen ? "rgba(0, 167, 111, 0.16)" : "var(--bg-secondary)", color: isOpen ? "var(--brand)" : "var(--text-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, flexShrink: 0 }}>
                                                        {isOpen ? "−" : "+"}
                                                    </span>
                                                    <span style={{ paddingBottom: "0.16rem", borderBottom: "1px dotted var(--border)", display: "inline-block" }}>{faq.q}</span>
                                                </span>
                                                <span aria-hidden="true" style={{ color: "var(--brand)", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>Open</span>
                                            </button>
                                            {isOpen && (
                                                <div
                                                    id={`faq-answer-${idx}`}
                                                    role="region"
                                                    aria-labelledby={`faq-question-${idx}`}
                                                    style={{ padding: "0 1.1rem 1rem 3.35rem", background: "transparent" }}
                                                >
                                                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.92rem", margin: "0.25rem 0 0 0" }}>{faq.a}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            </section>
                        </div>
                    )}

                    <div className="content-component" style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            <strong style={{ color: "var(--text)" }}>New to redeeming coupons?</strong>{" "}
                            Visit our <a href="/how-to-redeem-coupon" style={{ color: "var(--brand)", textDecoration: "none", borderBottom: "1px dashed var(--brand)" }}>step-by-step guide</a> for detailed instructions on how to apply coupon codes.
                            <span style={{ display: "block", marginTop: "4px", color: "var(--muted)", fontSize: "0.78rem" }}>
                                Coupon last verified {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "recently"}. {deal.provider || "Udemy"} coupons are time-limited — redeem as soon as possible.
                            </span>
                        </div>
                    </div>

                    {relatedDeals.length > 0 && (
                        <div className="content-component" style={{ padding: "2rem" }}>
                            <section aria-labelledby="related-heading">
                                <h2 id="related-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", margin: "0 0 0.75rem 0" }}>
                                    Similar courses
                                </h2>
                                <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                                    More active deals in this category:
                                </div>
                                <RelatedList items={relatedDeals.map((d: any) => ({
                                    id: d.id, title: d.title, slug: d.slug, image: d.image,
                                    provider: d.provider, category: d.category, rating: d.rating,
                                    students: d.students, price: d.price, originalPrice: d.originalPrice,
                                    updatedAt: d.updatedAt, url: d.url
                                }))} />
                            </section>
                        </div>
                    )}

                </main>

                <aside aria-label="Course details" style={{ position: "relative", alignSelf: "start" }}>
                    <div style={{ position: "sticky", top: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div className="content-sidebar" style={{ overflow: "hidden" }}>
                            {deal.image && (
                                <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "block", width: "100%" }}>
                                    <img
                                        src={deal.image}
                                        alt={`${deal.title} — ${deal.provider || "Udemy"} course in ${deal.category || "Development"} — thumbnail`}
                                        width="480"
                                        height="270"
                                        loading="eager"
                                        decoding="async"
                                        fetchPriority="high"
                                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                                    />
                                </a>
                            )}

                            <div style={{ padding: "1.25rem" }}>
                                {infoRows.map((row) => (
                                    <div key={row.label} style={{ display: "flex", marginBottom: "0.75rem", fontSize: "0.88rem" }}>
                                        <div style={{ width: "90px", flexShrink: 0, color: "var(--muted)" }}>{row.label}</div>
                                        <div style={{ flex: 1, color: "var(--text-secondary)" }}>{row.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="content-sidebar" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem" }}>Traffic lights</div>
                                <div style={{ display: "inline-flex", gap: "4px", alignItems: "center", marginLeft: "auto" }} aria-hidden="true">
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }}></span>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308" }}></span>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></span>
                                </div>
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                                What's good <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", margin: "0 3px" }}></span>what should give you pause <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#eab308", margin: "0 3px" }}></span>possible dealbreakers.
                            </div>
                            {trafficLights.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.6rem" }}>
                                    <div style={{ marginTop: "5px" }}>
                                        <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: item!.color, flexShrink: 0 }}></div>
                                    </div>
                                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item!.text}</div>
                                </div>
                            ))}
                        </div>

                        <div className="content-sidebar" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: "0.25rem" }}>Share</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                                Help others find this course page by sharing it with your friends and followers.
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                                {[
                                    { key: "facebook", label: "Facebook", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                                    { key: "linkedin", label: "LinkedIn", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                                    { key: "x", label: "X", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                                    { key: "reddit", label: "Reddit", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg> },
                                ].map((s) => (
                                    <a
                                        key={s.key}
                                        href={shareTarget(s.key)}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "4px 8px 4px 0", padding: "6px 14px", borderRadius: "9999px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "0.75rem", textDecoration: "none", whiteSpace: "nowrap" }}
                                    >
                                        {s.icon}
                                        {s.label}
                                    </a>
                                ))}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : '')}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "4px 8px 4px 0", padding: "6px 14px", borderRadius: "9999px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    Link
                                </span>
                                <a
                                    href={shareTarget("email")}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "4px 8px 4px 0", padding: "6px 14px", borderRadius: "9999px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "0.75rem", textDecoration: "none", whiteSpace: "nowrap" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                    Email
                                </a>
                            </div>
                        </div>

                        <div className="content-sidebar" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: "0.25rem" }}>Begin learning today</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
                                Enroll now to gain full access to <span style={{ fontWeight: 600 }}>{deal.title}</span>.
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "2px" }}>Coupon code</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                                    {deal.coupon ? (
                                        <>
                                            <code style={{ fontSize: "0.85rem", fontWeight: 700, background: "var(--bg)", padding: "4px 10px", borderRadius: "6px", border: "1px dashed var(--border)", color: "var(--text)", flex: 1, textAlign: "center", letterSpacing: "0.5px" }}>
                                                {deal.coupon.length > 4 ? `${deal.coupon.substring(0, 4)}···` : deal.coupon}
                                            </code>
                                            <button
                                                onClick={handleCopyCoupon}
                                                style={{ background: couponCopied ? "var(--brand)" : "var(--bg)", border: "1px solid var(--border)", borderRadius: "9999px", padding: "6px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: couponCopied ? "#fff" : "var(--brand)", whiteSpace: "nowrap" }}
                                            >
                                                {couponCopied ? "Copied!" : "Copy code"}
                                            </button>
                                        </>
                                    ) : (
                                        <code style={{ fontSize: "0.85rem", fontWeight: 700, background: "var(--bg)", padding: "4px 10px", borderRadius: "6px", border: "1px dashed var(--border)", color: "var(--text)", flex: 1, textAlign: "center", letterSpacing: "0.5px" }}>
                                            Apply at checkout
                                        </code>
                                    )}
                                </div>
                                {countdown && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "0.8rem", color: expiresSoon ? "#f87171" : "var(--text)", fontWeight: 700, marginBottom: "0.75rem" }}>
                                        <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                        <span>
                                            {expiresSoon ? "HURRY — ENDS TODAY" : "Expires in"} {countdown.days}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m
                                        </span>
                                    </div>
                                )}
                            </div>
                            <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                aria-label={`Redeem coupon for ${deal.title} on ${deal.provider || "Udemy"}`}
                                style={{ display: "block", textAlign: "center", padding: "0.7rem 1rem", background: "linear-gradient(135deg, #00a76f 0%, #22c55e 100%)", color: "#ffffff", textDecoration: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "0.85rem" }}
                            >
                                Enroll now
                            </a>
                            <div style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.75rem", lineHeight: 1.5 }}>
                                <span>30-Day Money-Back Guarantee via {deal.provider || "Udemy"}</span>
                            </div>
                        </div>

                        <div className="content-sidebar" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: "0.25rem" }}>Save this course</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
                                Create your own learning path. Save this course to your list so you can find it easily later.
                            </div>
                            <button
                                onClick={toggleSave}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "0.7rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9999px", color: saved ? "var(--brand)" : "var(--text)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                {saved ? "Saved" : "Save"}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {isModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        style={{ background: "var(--card)", borderRadius: "12px", padding: "2rem", maxWidth: "480px", width: "100%", border: "1px solid var(--border)", boxShadow: "0 20px 30px rgba(0,0,0,0.6)", position: "relative" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                            style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
                        >
                            ✕
                        </button>

                        <h3 id="modal-title" style={{ color: "var(--text)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
                            Your Coupon Code
                        </h3>
                        <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem" }}>
                            Copy the code, then click "Redeem Now" — the discount will apply at checkout.
                        </p>

                        <div style={{ background: "linear-gradient(135deg, #00a76f, #22c55e)", padding: "1.25rem", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center" }}>
                            <p style={{ color: "#fff", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", fontWeight: 600 }}>Coupon Code</p>
                            <code style={{ display: "block", fontSize: "1.15rem", fontWeight: 800, color: "#fff", letterSpacing: "1px", background: "rgba(255,255,255,0.15)", padding: "10px 16px", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.5)" }}>
                                {deal.coupon}
                            </code>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                            <button
                                onClick={handleCopyCoupon}
                                style={{ background: couponCopied ? "var(--brand)" : "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "0.75rem", borderRadius: "9999px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", transition: "all 0.2s" }}
                            >
                                {couponCopied ? "✓ Copied!" : "📋 Copy Code"}
                            </button>
                            <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                style={{ background: "var(--brand)", border: "1px solid var(--brand-hover)", color: "#fff", padding: "0.75rem", borderRadius: "9999px", fontWeight: 700, textDecoration: "none", textAlign: "center", fontSize: "0.95rem" }}
                            >
                                Redeem Now on {deal.provider || "Udemy"} →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .deal-page { min-height: 100vh; }
                .deal-layout { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
                .content-component, .content-sidebar { background: var(--card); border: 1px solid var(--border); border-radius: 12px; }

                .prose p { margin-bottom: 1em; }
                .prose h1, .prose h2, .prose h3 { color: var(--text); margin-top: 1.5em; margin-bottom: 0.5em; }
                .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; list-style: disc; }
                .prose li { margin-bottom: 0.5em; }
                .prose a { color: var(--brand); text-decoration: underline; }
                .prose strong { color: var(--text); }
                .prose code { background: var(--border); padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }

                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
                .card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
                .card-body { padding: 0.75rem; }
                .card-footer { padding: 0 0.75rem 0.75rem; }
                .pill { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
                .muted { color: var(--muted); }
                .card .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; background: linear-gradient(135deg, #00a76f 0%, #22c55e 100%); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
                button.pill { background: var(--secondary); color: var(--text); border: 1px solid var(--border); cursor: pointer; }

                .cw-compare { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
                .cw-compare-title { font-size: 1.4rem; font-weight: 700; color: var(--text); margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
                .cw-compare-desc { font-size: 0.9rem; color: var(--muted); margin: 0 0 1.25rem; }
                .cw-compare-table { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
                .cw-compare-row { display: grid; grid-template-columns: 120px 1fr 1fr; border-bottom: 1px solid var(--border); }
                .cw-compare-row:last-child { border-bottom: none; }
                .cw-compare-header { background: var(--bg-secondary); font-weight: 700; }
                .cw-compare-feature { padding: 10px 14px; font-size: 0.8rem; color: var(--muted); font-weight: 600; border-right: 1px solid var(--border); }
                .cw-compare-val { padding: 10px 14px; font-size: 0.82rem; color: var(--text-secondary); border-right: 1px solid var(--border); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .cw-compare-val:last-child { border-right: none; }
                .cw-compare-badge-c { font-size: 0.6rem; background: var(--brand); color: #fff; padding: 1px 6px; border-radius: 3px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
                .cw-compare-actions-row .cw-compare-btn { padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 700; text-decoration: none; display: inline-block; text-align: center; }
                .cw-compare-btn-active { background: linear-gradient(135deg, #00a76f 0%, #22c55e 100%); color: #fff; border: none; }
                .cw-compare-actions-row .cw-compare-val a:not(.cw-compare-btn-active) { background: var(--card); color: var(--text); border: 1px solid var(--border); }

                @media (max-width: 900px) {
                    .deal-layout { grid-template-columns: 1fr !important; }
                    .cw-compare-row { grid-template-columns: 90px 1fr 1fr; }
                }
                @media (max-width: 640px) {
                    h1 { font-size: 1.4rem !important; }
                    .cw-compare-row { grid-template-columns: 1fr; }
                    .cw-compare-feature { border-right: none; border-bottom: 1px solid var(--border); }
                }
                @media print {
                    body { background: white !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}

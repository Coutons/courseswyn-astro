"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Deal } from "@/types/deal";
import { slugifyCategory, slugifyTopic } from "@/lib/utils";
import { parseInstructors, createInstructorSlug } from "@/lib/instructors";
import { couponFAQs, formatMoney } from "@/lib/dealStats";
import { renderMarkdownToHtml } from "@/lib/markdown";

interface Props {
  deal: Deal;
  relatedDeals?: Deal[];
  catStats?: unknown;
  instructorImage?: string;
  couponMask?: string;
}

function extractDifficulty(title?: string, description?: string): string {
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  if (/beginner|starter|introduction|fundamentals|zero to hero|complete guide/.test(text)) return "Beginner-friendly";
  if (/advanced|expert|master|professional/.test(text)) return "Advanced";
  if (/intermediate|mid-level|practical/.test(text)) return "Intermediate";
  return "All levels";
}

function timeAgo(iso?: string): string {
  if (!iso) return "recently";
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function DealPage({ deal, relatedDeals = [], instructorImage, couponMask }: Props) {
  const instructorsList = useMemo(() => parseInstructors(deal.instructor), [deal.instructor]);

  const bodyContent = (deal as { content?: string }).content || deal.description || "";
  const isHtml = bodyContent.includes("<") && bodyContent.includes(">");
  const htmlContent = useMemo(() => {
    if (isHtml) {
      return bodyContent
        .replace(/style="[^"]*"/gi, "")
        .replace(/class="[^"]*"/gi, "")
        .replace(/data-[^=]*="[^"]*"/gi, "");
    }
    return renderMarkdownToHtml(bodyContent);
  }, [bodyContent, isHtml]);

  const faqs = useMemo(() => [...couponFAQs(deal), ...((deal.faqs || []).slice(0, 3))].slice(0, 8), [deal]);

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [visibleRelated, setVisibleRelated] = useState(4);

  const markdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (markdownRef.current && htmlContent) markdownRef.current.innerHTML = htmlContent;
  }, [htmlContent]);

  useEffect(() => {
    if (!deal.expiresAt) return;
    const tick = () => {
      const diff = new Date(deal.expiresAt as string).getTime() - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deal.expiresAt]);

  const price = deal.price ?? 0;
  const originalPrice = deal.originalPrice && deal.originalPrice > price ? deal.originalPrice : price;
  const discountPct = originalPrice > price && price >= 0 ? Math.round(100 - (price / originalPrice) * 100) : 0;
  const savings = Math.max(originalPrice - price, 0);

  const durationHours = (() => {
    if (!deal.duration) return null;
    const h = deal.duration.match(/(\d+(?:\.\d+)?)\s*h/);
    const m = deal.duration.match(/(\d+)\s*m/);
    let total = 0;
    if (h) total += parseFloat(h[1]);
    if (m) total += parseInt(m[1], 10) / 60;
    return total > 0 ? total : null;
  })();
  const costPerHour = durationHours && price > 0 ? price / durationHours : null;

  const learnPoints = (deal.learn || []).map((s) => s.replace(/\r/g, "").trim()).filter(Boolean);
  const reqPoints = (deal.requirements || []).map((s) => s.replace(/\r/g, "").trim()).filter(Boolean);
  const easyStart = reqPoints.some((r) => /no |beginner|none|without|anyone|basic|no experience/i.test(r));
  const masked = couponMask || "AUTO-APPLY";

  const copyMasked = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(masked).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }).catch(() => {});
      }
    } catch {}
  };

  const related = relatedDeals.filter((d) => d.slug !== deal.slug);
  const shownRelated = related.slice(0, visibleRelated);

  return (
    <div style={{ background: "linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary) 100%)", color: "var(--text)", minHeight: "100vh" }}>
      <header style={{ background: "var(--card)", padding: "2rem 0", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem" }}>
            <ol style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text)", fontWeight: 600, flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
              <li><a href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Home</a></li>
              <li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li>
              <li><a href="/udemy-coupon-code" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>All Coupons</a></li>
              {deal.category && (<><li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li><li><a href={`/categories/${slugifyCategory(deal.category)}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{deal.category}</a></li></>)}
              {deal.subcategory && deal.subcategory !== deal.category && (<><li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li><li><a href={`/topics/${slugifyTopic(deal.subcategory)}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{deal.subcategory}</a></li></>)}
              <li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li>
              <li aria-current="page" style={{ color: "var(--brand)", fontWeight: 700, wordBreak: "break-word" }}>{deal.title}</li>
            </ol>
          </nav>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem", color: "var(--text)" }}>
            {deal.title}{discountPct > 0 ? ` — Save ${discountPct}% With This Udemy Coupon` : " — Udemy Coupon"}
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem", color: "var(--text-secondary)", maxWidth: "800px" }}>{deal.description}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
            {typeof deal.rating === "number" && (<span style={{ color: "var(--brand)", fontWeight: 700 }} aria-label={`Rated ${deal.rating.toFixed(1)} out of 5`}>⭐ {deal.rating.toFixed(1)} out of 5</span>)}
            {typeof deal.students === "number" && (<span style={{ color: "var(--text-secondary)" }}><strong>({deal.students.toLocaleString()}</strong> students enrolled)</span>)}
            {instructorsList.length > 0 && (
              <span style={{ color: "var(--text-secondary)" }}>Created by{" "}
                {instructorsList.map((name, i) => (
                  <span key={name}>{i > 0 && <>, </>}<a href={`/instructor/${createInstructorSlug(name)}`} style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>{name}</a></span>
                ))}
              </span>
            )}
            {deal.updatedAt && (<span style={{ color: "var(--muted)" }}>Last updated: <time dateTime={new Date(deal.updatedAt).toISOString()}>{new Date(deal.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</time></span>)}
            {deal.language && (<span style={{ color: "var(--text-secondary)" }}>🌐 {deal.language}</span>)}
          </div>
        </div>
      </header>

      <div className="container deal-layout" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem" }}>
        <main>
          <section aria-labelledby="key-facts-heading" style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "2.5rem", background: "var(--bg)", marginBottom: "2rem" }}>
            <h2 id="key-facts-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
              Key Facts at a Glance
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
              Every data point below comes straight from {deal.provider || "Udemy"} and was last checked by CoursesWyn on <time dateTime={deal.updatedAt ? new Date(deal.updatedAt).toISOString() : new Date().toISOString()}>{fmtDate(deal.updatedAt)}</time>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {[
                { label: "Course", value: deal.title },
                { label: "Platform", value: `${deal.provider || "Udemy"} (coupon tracked by CoursesWyn)` },
                deal.instructor ? { label: "Instructor", value: deal.instructor } : null,
                deal.updatedAt ? { label: "Coupon Last Checked", value: fmtDate(deal.updatedAt) } : null,
                { label: "Level", value: extractDifficulty(deal.title, deal.description) },
                deal.category ? { label: "Category", value: deal.category } : null,
                deal.subcategory && deal.subcategory !== deal.category ? { label: "Topic", value: deal.subcategory } : null,
                deal.duration ? { label: "Length", value: `${deal.duration} of on-demand video` } : null,
                deal.language ? { label: "Language", value: deal.language } : null,
                { label: "Access", value: "Lifetime access, certificate included" },
                learnPoints.length > 0 ? { label: "Top Outcomes", value: learnPoints.slice(0, 3).join(" · ") } : null,
                reqPoints.length > 0 ? { label: "Prerequisites", value: reqPoints.slice(0, 2).join(" · ") } : null,
                discountPct > 0 ? { label: "Price", value: `${formatMoney(price)} with coupon (list ${formatMoney(originalPrice)} — you keep $${savings.toFixed(2)}, ${discountPct}% off).` } : null,
                { label: "Coupon", value: "Hit CLAIM COUPON — the code applies at checkout" },
              ].filter(Boolean).map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                  <span><strong style={{ color: "var(--text)" }}>{(item as { label: string }).label}:</strong> {(item as { value: string }).value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(252,211,77,0.07)", border: "1px solid rgba(252,211,77,0.3)", borderRadius: "8px", fontSize: "0.9rem", color: "#92400E" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                <div><strong style={{ display: "block", marginBottom: "4px" }}>Heads up:</strong>Coupon links sometimes misbehave in private/incognito windows. Use a normal browser tab and pause ad-blockers or VPNs if the discount does not show.</div>
              </div>
            </div>
          </section>

          {learnPoints.length > 0 && (
            <section aria-labelledby="learn-heading" style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "2.5rem", background: "var(--bg)", marginBottom: "2rem" }}>
              <h2 id="learn-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                What You Will Learn
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                Practical takeaways waiting inside this <a href={`/categories/${slugifyCategory(deal.category || "")}`} style={{ color: "inherit", textDecoration: "underline" }}><strong>{deal.category}</strong></a> course:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                {learnPoints.map((point, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--brand)", marginTop: "3px", flexShrink: 0 }}>✓</span>
                    <span>{point.endsWith(".") ? point : point + "."}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {reqPoints.length > 0 && (
            <section aria-labelledby="requirements-heading" style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "2.5rem", background: "var(--bg)", marginBottom: "2rem" }}>
              <h2 id="requirements-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                Requirements & Prerequisites
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.25rem" }}>Useful background before you start — you can still enroll without it, but expect a steeper climb:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                {reqPoints.map((req, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--muted)", marginTop: "2px", flexShrink: 0 }}>•</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="about-heading" style={{ marginBottom: "2rem" }}>
            <h2 id="about-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
              About This {deal.provider || "Udemy"} Course
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
              The full official description published on <strong>{deal.provider || "Udemy"}</strong> by <strong style={{ color: "var(--brand)" }}>{instructorsList.length > 0 ? instructorsList.join(", ") : deal.instructor}</strong> — syllabus, teaching style and scope for this <a href={`/categories/${slugifyCategory(deal.category || "")}`} style={{ color: "inherit", textDecoration: "underline" }}><strong>{deal.category}</strong></a> course:
            </p>
            <div ref={markdownRef} className="prose prose-invert max-w-none" style={{ lineHeight: 1.75, color: "var(--text-secondary)", fontSize: "0.95rem" }} />
          </section>

          <div style={{ marginBottom: "2rem", padding: "1.25rem 1.5rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(11, 122, 85, 0.12)", border: "1px solid rgba(11, 122, 85, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>New to Udemy coupons?</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>How codes, caps and expiries work — plus how to redeem in under two minutes.</div>
            </div>
            <a href="/udemy-coupons-guide" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "rgba(11, 122, 85, 0.1)", border: "1px solid rgba(11, 122, 85, 0.25)", borderRadius: "8px", color: "var(--brand)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>Read Guide ↗</a>
            <a href="/how-to-redeem-coupon" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>Redeem Steps ↗</a>
          </div>

          <section aria-labelledby="verdict-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginBottom: "2rem" }}>
            <h2 id="verdict-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true" />
              Is This {deal.title} Coupon Worth Claiming?
            </h2>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--muted)" }}>
                <span>Checked by <strong style={{ color: "var(--text)" }}>Andrew Derek</strong>, Coupon Analyst at CoursesWyn</span>
                <span>Updated {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "recently"}</span>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
                  Short answer: <strong style={{ color: "var(--text)" }}>yes</strong> — as long as {deal.category ? `these ${deal.category} skills match` : "the topic matches"} what you want to learn. <em>{deal.title}</em> lists at <strong style={{ color: "var(--text)" }}>${originalPrice.toFixed(2)}</strong> on {deal.provider || "Udemy"}.
                  {discountPct > 0 ? (<> This page's coupon cuts it to <strong style={{ color: "var(--text)" }}>${price.toFixed(2)}</strong> — ${savings.toFixed(2)} kept ({discountPct}% off).</>) : (<> It is currently listed without a price tag, so trying it costs nothing.</>)}
                  {costPerHour ? (<> Across {deal.duration} of video that is about <strong style={{ color: "var(--text)" }}>${costPerHour.toFixed(2)} per hour</strong> of content.</>) : ""}
                </p>
                {learnPoints.length > 0 && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
                    Discounts only matter if the material holds up. Here the syllabus targets usable outcomes — {learnPoints.slice(0, 3).map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join(", ")}.
                    {typeof deal.students === "number" ? ` ${deal.students.toLocaleString()} learners have already enrolled${typeof deal.rating === "number" ? ` at a ${deal.rating.toFixed(1)}-star average` : ""}.` : ""}
                  </p>
                )}
                {reqPoints.length > 0 && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
                    {easyStart ? (<>Entry bar is low ({reqPoints.slice(0, 2).join("; ")}) — approachable even if {deal.category || "the subject"} is new to you.</>) : (<>Skim the prerequisites first ({reqPoints.slice(0, 2).join("; ")}) — this one favors learners with some grounding.</>)}
                    {deal.duration && (<> Plan for around {deal.duration} of video at your own pace.</>)} {deal.language && (<>Taught in {deal.language}.</>)}
                  </p>
                )}
                {countdown && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>
                    One timing note: this code is expiring — {countdown.days > 0 ? `${countdown.days}d ${countdown.hours}h left on the clock.` : countdown.hours > 0 ? `${countdown.hours}h ${countdown.minutes}m left.` : "under a minute left."} Instructors can pull codes anytime, so sooner beats later.
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ background: "rgba(11, 122, 85, 0.06)", border: "1px solid rgba(11, 122, 85, 0.2)", borderRadius: "10px", padding: "1rem" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand)", margin: "0 0 0.6rem 0" }}>✓ Upsides</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.65 }}>
                      <li style={{ padding: "3px 0" }}>✓ Verified{discountPct > 0 ? ` ${discountPct}%` : ""} price cut.</li>
                      {typeof deal.rating === "number" && (<li style={{ padding: "3px 0" }}>✓ Learners rate it {deal.rating.toFixed(1)}/5.</li>)}
                      {typeof deal.students === "number" && (<li style={{ padding: "3px 0" }}>✓ {deal.students.toLocaleString()} students enrolled.</li>)}
                      <li style={{ padding: "3px 0" }}>✓ Certificate + lifetime access.</li>
                    </ul>
                  </div>
                  <div style={{ background: "rgba(207, 111, 89, 0.06)", border: "1px solid rgba(207, 111, 89, 0.2)", borderRadius: "10px", padding: "1rem" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#CF6F59", margin: "0 0 0.6rem 0" }}>! Trade-offs</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.65 }}>
                      {discountPct > 0 && (<li style={{ padding: "3px 0" }}>! Codes expire — then it's back to ${originalPrice.toFixed(2)}.</li>)}
                      <li style={{ padding: "3px 0" }}>! Access lives on {deal.provider || "Udemy"}'s platform and policies.</li>
                      {deal.duration && (<li style={{ padding: "3px 0" }}>! Exercises add real time beyond {deal.duration} of video.</li>)}
                      {!easyStart && (<li style={{ padding: "3px 0" }}>! Check prerequisites before enrolling.</li>)}
                    </ul>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px", padding: "0.75rem 1rem", background: "rgba(11, 122, 85, 0.06)", border: "1px solid rgba(11, 122, 85, 0.15)", borderRadius: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), #0B7A55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>AD</div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.85rem" }}>Andrew Derek</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Coupon Analyst</div>
                    </div>
                    <a href="/about" style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--brand)", textDecoration: "underline", whiteSpace: "nowrap" }}>Profile →</a>
                  </div>
                  <div style={{ flex: 2, minWidth: "250px", padding: "0.75rem 1rem", background: "rgba(11, 122, 85, 0.05)", border: "1px solid rgba(11, 122, 85, 0.15)", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                      "{costPerHour ? `About $${costPerHour.toFixed(2)} per video hour — ` : ""}<strong style={{ color: "var(--text)" }}>{deal.title}</strong> is fairly priced for its depth{learnPoints[0] ? `, starting with ${learnPoints[0].charAt(0).toLowerCase()}${learnPoints[0].slice(1)}` : ""}. If {deal.category || "this topic"} is on your list{typeof deal.rating === "number" ? `, the ${deal.rating.toFixed(1)}-star record backs it` : ""} — claim it while live."
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", padding: "0.75rem 1.25rem", background: "linear-gradient(135deg, #FFFFFF, #EDF2EF)", borderRadius: "10px", border: "1px solid rgba(11, 122, 85, 0.25)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(11,122,85,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", fontSize: "1rem" }}>✓</div>
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>Final Call: Worth Claiming</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{discountPct > 0 ? `Keeps $${savings.toFixed(2)} in your pocket vs list price` : "Free to enroll right now"}</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(11, 122, 85, 0.05)", border: "1px solid rgba(11, 122, 85, 0.15)", borderRadius: "8px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--brand)" }}>First coupon?</strong> Our <a href="/how-to-redeem-coupon" style={{ color: "var(--brand)", textDecoration: "underline" }}>redemption walkthrough</a> covers applying codes step by step.
                  <span style={{ display: "block", marginTop: "4px", color: "var(--muted)", fontSize: "0.78rem" }}>
                    Last checked {fmtDate(deal.updatedAt)}. {discountPct > 0 ? `At ${formatMoney(price)} you save ${formatMoney(savings)} vs ${formatMoney(originalPrice)} — ` : ""}codes are time-limited, so earlier is safer.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {typeof deal.rating === "number" && (
            <section aria-labelledby="ratings-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginBottom: "2rem" }}>
              <h2 id="ratings-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                Rating Breakdown
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                {deal.rating.toFixed(1)} out of 5{typeof deal.students === "number" ? ` from ${deal.students.toLocaleString()} verified learner reviews` : ""} on {deal.provider || "Udemy"}. Estimated split per star below.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", minWidth: "100px" }}>
                  <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "var(--brand)", lineHeight: 1 }}>{deal.rating.toFixed(1)}</div>
                  <div style={{ color: "var(--brand)", fontSize: "1.1rem", margin: "4px 0" }} aria-hidden="true">★★★★★</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{typeof deal.students === "number" ? deal.students.toLocaleString() : "Many"} Verified Ratings</div>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  {[{ star: 5, pct: 75 }, { star: 4, pct: 15 }, { star: 3, pct: 6 }, { star: 2, pct: 2 }, { star: 1, pct: 2 }].map(({ star, pct }) => (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem", width: "50px", flexShrink: 0 }}>{star} star{star !== 1 ? "s" : ""}</span>
                      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${star} stars: ${pct}%`} style={{ flex: 1, height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)", borderRadius: "4px" }}></div>
                      </div>
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem", width: "35px", textAlign: "right" }}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "1rem", fontStyle: "italic" }}>* Split estimated from the aggregate score. Source: {deal.provider || "Udemy"}. Checked {fmtDate(deal.updatedAt)}.</p>
            </section>
          )}

          <div style={{ margin: "0 0 2rem" }}>
            <div className="cta-box">
              <span className="cta-eyebrow">Udemy Personal Plan</span>
              <h2>One Subscription, <span style={{ color: "var(--brand)" }}>26,000+ Courses</span><br />Zero Coupon-Hunting</h2>
              <p className="cta-subtext">Prefer all-you-can-learn over single codes? One flat rate, certificates included, cancel anytime.</p>
              <div className="cta-actions">
                <a href="https://trk.udemy.com/c/6564357/3775958/39854" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ borderRadius: "999px", padding: "1rem 2.5rem" }}>Start Free Trial</a>
              </div>
              <div className="cta-features">
                <span><span className="cta-dot"></span>26,000+ courses</span>
                <span><span className="cta-dot"></span>7-day free trial</span>
                <span><span className="cta-dot"></span>Cancel anytime</span>
                <span><span className="cta-dot"></span>From $20/month</span>
              </div>
            </div>
          </div>

          {instructorsList.length > 0 && (
            <section aria-labelledby="instructor-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginBottom: "2rem" }}>
              <h2 id="instructor-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true" />
                Meet the Instructor{instructorsList.length > 1 ? "s" : ""}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                The creator{instructorsList.length > 1 ? "s" : ""} behind this course on <strong style={{ color: "var(--text)" }}>{deal.provider || "Udemy"}</strong>: <strong style={{ color: "var(--text)" }}>{instructorsList.join(", ")}</strong>.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {instructorsList.map((name, idx) => (
                  <div key={name} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
                    <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                      {idx === 0 && instructorImage ? (
                        <img src={instructorImage} alt={name} width={104} height={104} loading="lazy" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), #0B7A55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 700 }}>{initials(name)}</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: "180px" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>{name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{deal.provider || "Udemy"} Instructor</div>
                      </div>
                      <a href={`/instructor/${createInstructorSlug(name)}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 1rem", background: "rgba(11, 122, 85, 0.1)", border: "1px solid rgba(11, 122, 85, 0.25)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Full Profile ↗</a>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
                      <div><span style={{ color: "var(--muted)", fontWeight: 500 }}>Teaches</span><div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{deal.category || "Development"}</div></div>
                      {typeof deal.students === "number" && (<div><span style={{ color: "var(--muted)", fontWeight: 500 }}>Learners Here</span><div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{deal.students.toLocaleString()}+ enrolled</div></div>)}
                      {typeof deal.rating === "number" && (<div><span style={{ color: "var(--muted)", fontWeight: 500 }}>Course Rating</span><div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{deal.rating.toFixed(1)} / 5.0</div></div>)}
                      {deal.duration && (<div><span style={{ color: "var(--muted)", fontWeight: 500 }}>Course Length</span><div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{deal.duration}</div></div>)}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "var(--muted)", fontWeight: 500 }}>Teaching Style</span>
                        <div style={{ color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.5 }}>Hands-on, example-driven lessons around real {deal.category || "IT"} workflows — watch, build alongside, then test yourself with quizzes.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section aria-labelledby="faq-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginBottom: "2rem" }}>
              <h2 id="faq-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                Coupon FAQs
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                Quick answers on this coupon's validity, pricing and enrollment — generated from {deal.provider || "Udemy"} data checked {fmtDate(deal.updatedAt)}.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {faqs.map((faq, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                      aria-expanded={expandedFAQ === idx}
                      aria-controls={`faq-answer-${idx}`}
                      id={`faq-question-${idx}`}
                      style={{ width: "100%", padding: "1rem 1.25rem", background: "var(--card)", border: "none", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", gap: "1rem" }}
                    >
                      <span>{faq.q}</span>
                      <span aria-hidden="true" style={{ transition: "transform 0.2s", transform: expandedFAQ === idx ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▼</span>
                    </button>
                    {expandedFAQ === idx && (
                      <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-question-${idx}`} style={{ padding: "1rem 1.25rem", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.9rem", margin: 0 }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="reviewer-heading" style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "16px", background: "var(--bg)", marginBottom: "2rem" }}>
            <h2 id="reviewer-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true" />
              Reviewed By
            </h2>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--card-hover), var(--card))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "2px solid var(--brand)" }}>
                <img src="/images/author.jpg" alt="Andrew Derek" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </div>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>Andrew Derek</div>
                <div style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600, marginBottom: "0.5rem" }}>Coupon Analyst, CoursesWyn</div>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.65, margin: "0 0 0.75rem 0" }}>
                  Andrew tracks Udemy price swings daily and only lists codes that survive verification — so the discount you see here is one he'd claim himself.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <a href="https://facebook.com/CoursesWyn" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--muted)"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a href="https://x.com/CoursesWyn" target="_blank" rel="noopener noreferrer" aria-label="X" style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--muted)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://medium.com/@coursewyn" target="_blank" rel="noopener noreferrer" aria-label="Medium" style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "var(--muted)", fontSize: "0.8rem", fontWeight: 800 }}>M</a>
                  <a href="/udemy-coupon-code" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0 0.75rem", height: "32px", borderRadius: "6px", background: "rgba(11, 122, 85, 0.1)", border: "1px solid rgba(11, 122, 85, 0.25)", color: "var(--brand)", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}>Fresh Drops →</a>
                </div>
              </div>
            </div>
          </section>

          {related.length > 0 && (
            <section aria-labelledby="related-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginTop: "2rem" }}>
              <h2 id="related-heading" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "6px", height: "32px", background: "var(--brand)", borderRadius: "9999px" }} aria-hidden="true"></span>
                More {deal.category || "Udemy"} Coupons You'll Like
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                Sibling {deal.provider || "Udemy"} courses in {deal.category || "this category"} with live coupons:
              </p>
              <div className="grid">
                {shownRelated.map((r) => {
                  const rp = typeof r.price === "number" ? r.price : 0;
                  const ro = typeof r.originalPrice === "number" && r.originalPrice > rp ? r.originalPrice : rp;
                  const rd = ro > rp && rp >= 0 ? Math.round(100 - (rp / ro) * 100) : 0;
                  return (
                    <article key={r.slug} className="card">
                      <div className="card-body" style={{ display: "grid", gap: 8 }}>
                        {r.image && (
                          <img src={r.image} alt={r.title} width="300" height="200" loading="lazy" style={{ width: "100%", height: "140px", borderRadius: 8, border: "1px solid var(--border)", objectFit: "cover" }} />
                        )}
                        <h4 style={{ margin: 0, fontSize: 14 }}>
                          <a href={`/coupon/${r.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{r.title}</a>
                        </h4>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{r.subcategory || r.category || r.provider}</div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--muted)", fontSize: 12 }}>
                          {typeof r.rating === "number" && (<span>⭐ {r.rating.toFixed(1)}</span>)}
                          {typeof r.students === "number" && (<span>👥 {r.students >= 1000 ? (r.students / 1000).toFixed(1).replace(/\.0$/, "") + "k" : r.students}</span>)}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontWeight: 700 }}>${rp.toFixed(2)}</span>
                          {ro > rp && (<span className="muted" style={{ textDecoration: "line-through", fontSize: 12 }}>${ro.toFixed(2)}</span>)}
                          {rd > 0 && (<span className="pill" style={{ background: "var(--brand)", color: "#FFFFFF", fontWeight: 800 }}>{rd}% OFF</span>)}
                        </div>
                        {r.updatedAt && (<div className="muted" style={{ fontSize: 12 }}>Checked {timeAgo(r.updatedAt)}</div>)}
                      </div>
                      <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
                        <a className="btn" href={`/coupon/${r.slug}`} style={{ color: "var(--brand)" }}>View Coupon</a>
                      </div>
                    </article>
                  );
                })}
              </div>
              {related.length > visibleRelated && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                  <button className="pill" onClick={() => setVisibleRelated(related.length)}>Show more</button>
                </div>
              )}
            </section>
          )}
        </main>

        <aside aria-label="Coupon claim panel" style={{ position: "relative" }}>
          <div style={{ position: "sticky", top: "2rem", background: "linear-gradient(135deg, #FFFFFF 0%, #EDF2EF 100%)", border: "1px solid rgba(11,122,85,0.2)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}>
            {deal.image && (
              <div style={{ position: "relative" }}>
                <img src={deal.image} alt={`${deal.title} — ${deal.provider || "Udemy"} course`} width="400" height="190" loading="eager" decoding="async" style={{ width: "100%", height: "190px", objectFit: "cover", display: "block" }} />
              </div>
            )}
            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: discountPct > 0 ? "6px" : "1rem" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>{price === 0 ? "Free" : `$${price.toFixed(2)}`}</span>
                {discountPct > 0 && (<><span style={{ fontSize: "0.9rem", color: "var(--muted)", textDecoration: "line-through" }}>${originalPrice.toFixed(2)}</span><span style={{ fontSize: "0.75rem", background: "var(--brand)", color: "#FFFFFF", padding: "2px 7px", borderRadius: "3px", fontWeight: 700 }}>{discountPct}% OFF</span></>)}
              </div>
              {countdown && (
                <div role="timer" aria-live="polite" style={{ background: "rgba(11,122,85,0.07)", color: "var(--text)", fontSize: "0.85rem", padding: "10px 12px", borderRadius: "6px", marginBottom: "1rem", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.75rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px", color: "var(--muted)" }}>
                    <svg style={{ width: "13px", height: "13px" }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    OFFER ENDS IN
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", fontWeight: 800 }}>
                    {[{ val: countdown.days, label: "Days" }, { val: countdown.hours, label: "Hrs" }, { val: countdown.minutes, label: "Min" }, { val: countdown.seconds, label: "Sec" }].map(({ val, label }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.2rem" }}>{String(val).padStart(2, "0")}</div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.75, fontWeight: 500 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", marginBottom: "0.75rem", padding: "0.6rem 0.75rem" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>🎫 Coupon Code</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <code style={{ fontSize: "0.8rem", fontWeight: 700, background: "var(--card)", padding: "4px 8px", borderRadius: "4px", border: "1px dashed var(--border)", color: "var(--text)", flex: 1, textAlign: "center", letterSpacing: "0.5px" }}>{masked}</code>
                  <button onClick={() => setIsModalOpen(true)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", color: "var(--brand)", whiteSpace: "nowrap" }}>Reveal</button>
                </div>
              </div>
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={`Claim coupon for ${deal.title} on ${deal.provider || "Udemy"}`}
                style={{ display: "block", width: "100%", padding: "0.75rem", background: "linear-gradient(135deg, #0C6E4E 0%, #0B7A55 100%)", color: "#FFFFFF", textDecoration: "none", borderRadius: "8px", textAlign: "center", fontWeight: 700, fontSize: "0.9rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(11, 122, 85, 0.25)" }}
              >
                CLAIM COUPON
              </a>
              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.25rem", marginTop: "0.75rem" }}>
                30-Day Money-Back Guarantee via {deal.provider || "Udemy"}
              </p>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: "10px", fontSize: "0.875rem" }}>This Course Includes:</p>
                {[
                  ["Length", deal.duration ? `${deal.duration} on-demand video` : "On-demand video"],
                  ["Access", "Lifetime access · Mobile & TV"],
                  ["Certificate", "Certificate of completion"],
                  ["Language", deal.language || "English"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{label}</span>
                    <span style={{ color: "var(--text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => { try { (navigator as unknown as { share?: (d: { title: string; url: string }) => void }).share?.({ title: deal.title, url: window.location.href }); } catch {} }} style={{ color: "var(--muted)", fontWeight: 600, fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Share this coupon
                </button>
                <a href="/affiliate-disclosure" style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Affiliate note</a>
              </div>
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(11, 122, 85, 0.06)", border: "1px solid rgba(11, 122, 85, 0.15)", borderRadius: "6px", fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.4 }}>
                <span>Claiming through CoursesWyn may earn us a commission at no cost to you. </span>
                <a href="/affiliate-disclosure" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Details</a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: "var(--card)", borderRadius: "12px", padding: "2rem", maxWidth: "480px", width: "100%", border: "1px solid var(--border)", boxShadow: "0 20px 30px rgba(0,0,0,0.6)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(false)} aria-label="Close modal" style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
            <h3 id="modal-title" style={{ color: "var(--text)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Your Coupon Is Ready</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem" }}>Continue to {deal.provider || "Udemy"} — the code below auto-applies at checkout.</p>
            <div style={{ background: "linear-gradient(135deg, #0C6E4E, #0B7A55)", padding: "1.25rem", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center" }}>
              <p style={{ color: "#FFFFFF", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", fontWeight: 600 }}>Coupon Code</p>
              <code style={{ display: "block", fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "1px", background: "rgba(0,0,0,0.2)", padding: "10px 16px", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.5)" }}>{masked}</code>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
              <button onClick={copyMasked} style={{ background: copied ? "var(--brand)" : "rgba(11,122,85,0.12)", border: "1px solid rgba(11,122,85,0.25)", color: copied ? "#FFFFFF" : "var(--text)", padding: "0.75rem", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}>
                {copied ? "✓ Copied!" : "📋 Copy Code"}
              </button>
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" style={{ background: "var(--brand)", border: "1px solid var(--brand)", color: "#FFFFFF", padding: "0.75rem", borderRadius: "6px", fontWeight: 700, textDecoration: "none", textAlign: "center", fontSize: "0.95rem" }}>
                Continue to {deal.provider || "Udemy"} →
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .deal-layout { grid-template-columns: 1fr 340px; }
        .prose h1, .prose h2, .prose h3 { color: var(--text); margin-top: 1.5em; margin-bottom: 0.5em; }
        .prose p { margin-bottom: 1em; }
        .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; list-style: disc; }
        .prose li { margin-bottom: 0.5em; }
        .prose a { color: var(--brand); text-decoration: underline; }
        .prose strong { color: var(--text); }
        .prose code { background: var(--border); padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
        @media (max-width: 900px) {
          .deal-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          h1 { font-size: 1.4rem !important; }
        }
      `}</style>
    </div>
  );
}

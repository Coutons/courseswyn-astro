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
  instructorImages?: Record<string, string>;
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

const H2: React.CSSProperties = { fontSize: "clamp(1.25rem, 2vw, 1.6rem)", fontWeight: 800, color: "var(--text)", margin: "2.5rem 0 1rem", lineHeight: 1.25, letterSpacing: "-0.015em" };

export default function DealPage({ deal, relatedDeals = [], instructorImage, instructorImages = {}, couponMask }: Props) {
  const instructorsList = useMemo(() => parseInstructors(deal.instructor), [deal.instructor]);
  const photoFor = (name: string, idx: number): string | undefined =>
    instructorImages[createInstructorSlug(name)] || (idx === 0 ? instructorImage : undefined);

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

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

  const starLevel = typeof deal.rating === "number" ? Math.max(0, Math.min(5, Math.round(deal.rating))) : 0;
  const starsStr = "★".repeat(starLevel) + "☆".repeat(5 - starLevel);

  const splitPcts = (() => {
    if (typeof deal.rating !== "number") return [75, 15, 6, 2, 2];
    const r = Math.min(5, Math.max(1, deal.rating));
    let p5 = Math.min(92, Math.max(35, Math.round(60 + (r - 4) * 20)));
    const p1 = Math.min(8, Math.max(1, Math.round(10 - (r - 3.5) * 6)));
    const p2 = p1;
    let p3 = Math.min(14, Math.max(2, Math.round(14 - (r - 3.5) * 5)));
    let p4 = 100 - p5 - p1 - p2 - p3;
    if (p4 < 0) { p3 = Math.max(0, p3 + p4); p4 = p4 - (p3 - Math.max(0, p3 + p4)); }
    if (p4 < 0) { p5 = Math.max(0, p5 + p4); p4 = 0; }
    return [p5, p4, p3, p2, p1];
  })();

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

  // ── Programmatic copy variation: variant picked by slug hash (Fase 1),
  // flavor clause per category group (Fase 2). Keeps body copy unique
  // across thousands of coupon pages without manual writing.
  const variantIdx = (salt: string): number => {
    const s = `${deal.slug}#${salt}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const pickV = <T,>(salt: string, arr: readonly T[]): T => arr[variantIdx(salt) % arr.length];

  const catLc = (deal.category || "").toLowerCase();
  const catGroup: "code" | "business" | "design" | "teach" | "general" =
    /development|software|program|desarrollo|informática|informatica/.test(catLc) ? "code"
    : /business|finance|office|marketing|productividad|management|accounting/.test(catLc) ? "business"
    : /design|photo|music|video|art/.test(catLc) ? "design"
    : /teach|academic|education|language/.test(catLc) ? "teach" : "general";
  const flavor: string = {
    code: "with hands-on labs and real-world projects",
    business: "with reusable templates and real case studies",
    design: "with project files you can add to a portfolio",
    teach: "with classroom-ready examples and exercises",
    general: "with lifetime access and a completion certificate",
  }[catGroup];

  const topicName = deal.subcategory || deal.category || "this subject";
  const skillDuo = learnPoints.slice(0, 2).map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join(" and ");
  const skillTrio = learnPoints.slice(0, 3).map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ");
  const socialProof = typeof deal.rating === "number"
    ? `${deal.rating.toFixed(1)}-star average${typeof deal.students === "number" ? ` across ${deal.students.toLocaleString()} learners` : ""}`
    : (typeof deal.students === "number" ? `${deal.students.toLocaleString()} learners enrolled` : "");
  const priceLine = discountPct > 0
    ? `At $${price.toFixed(2)} instead of $${originalPrice.toFixed(2)}, the coupon removes the price risk.`
    : "Listed free right now, so trying it costs nothing.";

  const verdictCopy: string = pickV("verdict", [
    `Yes — ${deal.title} teaches ${skillDuo || "practical, job-ready skills"}${typeof deal.students === "number" ? ` to ${deal.students.toLocaleString()} learners` : ""}${typeof deal.rating === "number" ? ` at a ${deal.rating.toFixed(1)}-star average` : ""}. ${priceLine}`,
    `${deal.title} is a ${deal.category || "self-paced"} course ${flavor}. ${socialProof ? `It holds a ${socialProof}.` : "It has no public rating yet, so the syllabus below matters most."} ${priceLine}`,
    `Short answer: yes. ${deal.title} covers ${skillDuo || `the core ${topicName} workflow`} ${flavor}${socialProof ? `, and it carries a ${socialProof}` : ""}. ${priceLine}`,
    `For ${deal.category || "self-paced"} learners, ${deal.title} is an easy yes ${flavor}: ${skillDuo || "practical skills"}${socialProof ? ` with a ${socialProof}` : ""}. ${priceLine}`,
  ] as const);

  const deliversHead = learnPoints.length > 0
    ? `The published syllabus lists ${learnPoints.length} outcomes — headlined by ${skillTrio}.`
    : "The instructor hasn't published a detailed outcome list, so judge by the category syllabus on Udemy.";
  const deliversRuntime = deal.duration
    ? `Total runtime is ${deal.duration} of video, which you work through self-paced with lifetime access.`
    : "You work through it self-paced with lifetime access.";
  const deliversScale = typeof deal.students === "number" && deal.students > 10000
    ? `With ${deal.students.toLocaleString()} learners enrolled, the pacing and explanations have been stress-tested at scale.`
    : "";
  const deliversCopy: string = pickV("delivers", [
    `${deliversHead} ${deliversRuntime} ${deliversScale}`,
    `${deliversRuntime} ${deliversHead} ${deliversScale}`,
    `${deal.duration ? `Across ${deal.duration} of video, ` : ""}${learnPoints.length > 0 ? `you'll work through ${learnPoints.length} published outcomes — first up: ${skillTrio}.` : "the syllabus is what the instructor published on Udemy — no padded outcome list."} ${deal.duration ? "Self-paced with lifetime access." : ""} ${deliversScale}`,
    `${deliversHead} ${flavor.charAt(0).toUpperCase() + flavor.slice(1)}, self-paced with lifetime access. ${deliversScale}`,
  ] as const).replace(/\s+/g, " ").trim();

  const priceListBit = `$${originalPrice.toFixed(2)} is the list price, but Udemy courses at this level almost never sell at list.`;
  const priceCutBit = discountPct > 0
    ? `This coupon brings it to $${price.toFixed(2)} — a ${discountPct}% cut worth $${savings.toFixed(2)}.`
    : "This listing is currently free, so the price question answers itself.";
  const priceCphBit = costPerHour ? ` Spread over the runtime, that is about $${costPerHour.toFixed(2)} per hour of instruction — cheaper than a coffee per study session.` : "";
  const priceCmpBit = ` The real comparison is not list versus coupon, but coupon versus the next-best course at the same sale price — and on ratings-per-dollar, ${typeof deal.rating === "number" && deal.rating >= 4.5 ? "this one compares well." : "check the rating box above before deciding."}`;
  const priceCopy: string = pickV("price", [
    `${priceListBit} ${priceCutBit}${priceCphBit}${priceCmpBit}`,
    `${priceCutBit} ${priceListBit}${priceCphBit}${priceCmpBit}`,
    `${priceCmpBit.trim()} ${priceListBit} ${priceCutBit}${priceCphBit}`,
  ] as const).replace(/\s+/g, " ").trim();
  const masked = couponMask || "AUTO-APPLY";
  const personalPlanUrl = "https://trk.udemy.com/c/6564357/3775958/39854";

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

  const goEnroll = () => {
    copyMasked();
    window.open(deal.url, "_blank", "noopener,noreferrer");
  };

  const copyLink = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2500);
        }).catch(() => {});
      }
    } catch {}
  };

  const related = relatedDeals.filter((d) => d.slug !== deal.slug);
  const shownRelated = related.slice(0, 4);
  const updatedLong = fmtDate(deal.updatedAt);
  const updatedShort = deal.updatedAt
    ? new Date(deal.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "recently";
  const monthYear = deal.updatedAt
    ? new Date(deal.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const readMins = Math.max(
    1,
    Math.round(
      (`${deal.title} ${deal.description} ${learnPoints.join(" ")} ${reqPoints.join(" ")}`.split(/\s+/).length) / 200
    )
  );
  const toc: Array<[string, string]> = [
    ["entry-verdict", "Quick verdict"],
    ["entry-facts", "Course facts"],
    ["entry-learn", "What you will learn"],
    ["entry-relevance", "Still relevant?"],
    ["entry-delivers", "What it delivers"],
    ["entry-price", "Is the price fair?"],
    ["entry-about-official", "About this course"],
    ["entry-rating", "Rating breakdown"],
    ["entry-instructor", "Instructor"],
    ["entry-faq", "Coupon FAQs"],
  ];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", paddingBottom: "3rem" }}>
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem 0" }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
          <ol style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
            <li><a href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Home</a></li>
            <li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li>
            <li><a href="/udemy-coupon-code" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Coupons</a></li>
            {deal.category && (<><li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li><li><a href={`/categories/${slugifyCategory(deal.category)}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{deal.category}</a></li></>)}
            {deal.subcategory && deal.subcategory !== deal.category ? (
              <><li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li><li><a href={`/topics/${slugifyTopic(deal.subcategory)}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{deal.subcategory}</a></li></>
            ) : (
              <><li aria-hidden="true" style={{ color: "var(--muted)" }}>›</li><li aria-current="page" style={{ color: "var(--muted)", fontWeight: 500 }}>{deal.title}</li></>
            )}
          </ol>
        </nav>

        {/* ═══ 3-COLUMN ARTICLE GRID: TOC | BODY | VERDICT ═══ */}
        <div className="article-grid">
          {/* LEFT RAIL — sticky TOC */}
          <aside className="article-col-toc" aria-label="In this review">
            <div className="toc-card">
              <h4 className="toc-label">In this review</h4>
              <ul className="toc-list">
                {toc.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`}>{label}</a></li>
                ))}
              </ul>
            </div>
          </aside>

          {/* CENTER — article body */}
          <article className="article-col-main">
            <header className="article-hero">
              <h1 className="article-h1">
                {deal.title} — Udemy Coupon {price === 0 ? "100% Free" : discountPct > 0 ? `${discountPct}% OFF` : "Deal"}
              </h1>
              <div className="article-byline">
                <span className="byline-avatar" aria-hidden="true">AD</span>
                <p style={{ margin: 0, fontSize: "13px" }}>By <strong>Andrew Derek</strong></p>
                <span className="dot" aria-hidden="true"></span>
                <time dateTime={deal.updatedAt ? new Date(deal.updatedAt).toISOString() : undefined} style={{ fontSize: "13px" }}>{updatedLong}</time>
                <span className="dot" aria-hidden="true"></span>
                <span className="reading-time" style={{ fontSize: "13px" }}>{readMins} min read</span>
              </div>
            </header>

            {deal.image && (
              <figure className="udemy-course-hero">
                <img src={deal.image} alt={`${deal.title} — ${deal.provider || "Udemy"} course`} width="800" height="450" loading="eager" decoding="async" />
              </figure>
            )}

            <div className="udemy-course-chip">
              <div className="udemy-chip-instructor">
                {instructorImage ? (
                  <img src={instructorImage} alt={instructorsList[0] || "Instructor"} width={96} height={96} loading="lazy" className="udemy-avatar-img" />
                ) : (
                  <span className="udemy-avatar" aria-hidden="true">{initials(instructorsList[0] || deal.instructor || "CW")}</span>
                )}
                <div className="udemy-chip-id">
                  <span className="udemy-chip-kicker">Instructor</span>
                  <span className="udemy-chip-name">{instructorsList.length > 0 ? instructorsList.join(", ") : (deal.instructor || "—")}</span>
                </div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Rating</div>
                <div className="udemy-stat-val">
                  <span className="udemy-stars" aria-hidden="true">{starsStr}</span>{" "}
                  <strong>{typeof deal.rating === "number" ? deal.rating.toFixed(1) : "—"}</strong>{" "}
                  <span className="udemy-stat-dim">{typeof deal.students === "number" ? `(${deal.students.toLocaleString()})` : ""}</span>
                </div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Length</div>
                <div className="udemy-stat-val"><strong>{deal.duration || "—"}</strong></div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Price</div>
                <div className="udemy-stat-val"><strong className="udemy-price-now">{price === 0 ? "Free" : `$${price.toFixed(2)}`}</strong></div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Level</div>
                <div className="udemy-stat-val"><strong>{extractDifficulty(deal.title, deal.description)}</strong></div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Topic</div>
                <div className="udemy-stat-val"><strong>{deal.subcategory && deal.subcategory !== deal.category ? deal.subcategory : (deal.category || "—")}</strong></div>
              </div>
              <div className="udemy-chip-sep" aria-hidden="true"></div>
              <div className="udemy-stat">
                <div className="udemy-chip-kicker">Students</div>
                <div className="udemy-stat-val"><strong>{typeof deal.students === "number" ? deal.students.toLocaleString() : "—"}</strong></div>
              </div>
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="udemy-chip-cta" aria-label={`Claim coupon for ${deal.title} on ${deal.provider || "Udemy"}`}>
                Claim Coupon →
              </a>
            </div>

            <section aria-labelledby="verdict-heading" id="entry-verdict">
              <h2 id="verdict-heading" style={{ ...H2 }}>Quick Verdict: Is This {deal.subcategory && deal.subcategory !== deal.category ? deal.subcategory : (deal.category || "Udemy")} Coupon Worth It?</h2>
              <div className="verdict-box">
                <p className="verdict-answer">
                  {verdictCopy.startsWith("Yes — ") ? (<><strong>Yes — </strong>{verdictCopy.slice("Yes — ".length)}</>) : verdictCopy}
                </p>
                <dl className="verdict-facts">
                  <div><dt>Rating</dt><dd>{typeof deal.rating === "number" ? `${deal.rating.toFixed(1)} / 5${typeof deal.students === "number" ? ` · ${deal.students.toLocaleString()} learners` : ""}` : "Not yet rated"}</dd></div>
                  <div><dt>Best for</dt><dd>{deal.category || "Course"} learners{reqPoints.length > 0 && easyStart ? " starting from zero" : ""} · certificate included</dd></div>
                  <div><dt>Price</dt><dd>{discountPct > 0 ? `$${price.toFixed(2)} with coupon (list $${originalPrice.toFixed(2)})` : "Free enrollment"}</dd></div>
                </dl>
              </div>
              {deal.editorNote && deal.editorNote.trim() && (
                <aside className="editor-note" aria-label="Editor's take">
                  <div className="editor-note-label">Editor's take</div>
                  <p>{deal.editorNote.trim()}</p>
                </aside>
              )}
            </section>

            <section aria-labelledby="facts-heading" id="entry-facts" className="panel-facts">
              <h2 id="facts-heading" style={{ ...H2 }}>Course Facts & Live Coupon Details</h2>
              <dl className="fact-table">
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
                  <div key={idx} className="fact-row">
                    <dt>{(item as { label: string }).label}</dt>
                    <dd>{(item as { value: string }).value}</dd>
                  </div>
                ))}
              </dl>
              <p className="notice-warn">
                <strong>⚠️ Heads up:</strong> coupon links sometimes misbehave in private/incognito windows. Use a normal browser tab and pause ad-blockers or VPNs if the discount does not show.
              </p>
            </section>

            {(learnPoints.length > 0 || reqPoints.length > 0) && (
              <section aria-labelledby="learn-heading" id="entry-learn">
                <h2 id="learn-heading" style={{ ...H2 }}>What You'll Learn</h2>
                {learnPoints.length > 0 ? (
                  <>
                    <p className="sec-intro">
                      Practical takeaways waiting inside this <a href={`/categories/${slugifyCategory(deal.category || "")}`}>{deal.category}</a> course:
                    </p>
                    <ul className="plain-list">
                      {learnPoints.map((point, idx) => (
                        <li key={idx}>{point.endsWith(".") ? point : point + "."}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="sec-intro">The instructor hasn't published a detailed outcome list — the <a href={`/categories/${slugifyCategory(deal.category || "")}`}>{deal.category}</a> syllabus on Udemy has the full breakdown.</p>
                )}
                <h3>Before you start</h3>
                {reqPoints.length > 0 ? (
                  <ul className="plain-list">
                    {reqPoints.map((req, idx) => (<li key={idx}>{req}</li>))}
                  </ul>
                ) : (
                  <p className="sec-intro">No prerequisites listed — open to all levels, start from lesson one.</p>
                )}
              </section>
            )}

            <section aria-labelledby="about-heading" id="entry-relevance">
              <h2 id="about-heading" style={{ ...H2 }}>Is {deal.title} Still Relevant?</h2>
              <p className="body-p">
                The {deal.updatedAt ? `last update landed ${fmtDate(deal.updatedAt)}` : "listing is current"} — and for a {deal.category || "skills"} course, freshness is the first thing to verify. An updated date means the instructor still maintains the material; a stale one means you learn last year's version of the tools.
              </p>
              <p className="body-p">
                {typeof deal.rating === "number" ? `The ${deal.rating.toFixed(1)} rating${typeof deal.students === "number" ? ` from ${deal.students.toLocaleString()} learners` : ""} suggests the content holds up in practice — ratings at that level rarely survive contact with outdated material.` : "There is no public rating to lean on here, so weigh the syllabus below against your goal instead."} {reqPoints.length > 0 && !easyStart ? "Note the prerequisites, though: this one assumes background, so beginners should treat the requirements list as mandatory reading." : "The entry bar looks low, which makes this a reasonable first course in the topic rather than a capstone."}
              </p>
            </section>

            <section aria-labelledby="delivers-heading" id="entry-delivers">
              <h2 id="delivers-heading" style={{ ...H2 }}>What the Course Actually Delivers{deal.duration ? ` in ${deal.duration}` : ""}</h2>
              <p className="body-p">
                {deliversCopy}
              </p>
            </section>

            <section aria-labelledby="price-heading" id="entry-price">
              <h2 id="price-heading" style={{ ...H2 }}>Is the Price Fair After the Coupon Discount?</h2>
              <p className="body-p">
                {priceCopy}
              </p>
            </section>

            <section aria-labelledby="about2-heading" id="entry-about-official">
              <h2 id="about2-heading" style={{ ...H2 }}>About This {deal.provider || "Udemy"} Course</h2>
              <p className="sec-intro">
                The official description by <strong className="hl">{instructorsList.length > 0 ? instructorsList.join(", ") : deal.instructor}</strong>:
              </p>
              <div ref={markdownRef} className="prose max-w-none" />
              <div className="guide-strip">
                <div className="guide-strip-main">
                  <div className="guide-strip-title">New to Udemy coupons?</div>
                  <div className="guide-strip-sub">How codes, caps and expiries work — plus redeeming in under two minutes.</div>
                </div>
                <a href="/udemy-coupons-guide" className="guide-btn">Read Guide ↗</a>
                <a href="/how-to-redeem-coupon" className="guide-btn ghost">Redeem Steps ↗</a>
              </div>
            </section>

            {typeof deal.rating === "number" && (
              <section aria-labelledby="ratings-heading" id="entry-rating">
                <h2 id="ratings-heading" style={{ ...H2 }}>Learner Ratings: {typeof deal.rating === "number" ? `${deal.rating.toFixed(1)}★ From ${typeof deal.students === "number" ? deal.students.toLocaleString() : ""} Learners`.trim() : "What Learners Say"}</h2>
                <p className="sec-intro">
                  {deal.rating.toFixed(1)} out of 5{typeof deal.students === "number" ? ` from ${deal.students.toLocaleString()} learners` : ""} on {deal.provider || "Udemy"}. Estimated split per star below.
                </p>
                <div className="rating-summary">
                  <div className="rating-big">
                    <div className="rating-num">{deal.rating.toFixed(1)}</div>
                    <div className="rating-stars" aria-hidden="true">{starsStr}</div>
                    <div className="rating-count">{typeof deal.students === "number" ? deal.students.toLocaleString() : "Many"} learners</div>
                  </div>
                  <div className="rating-bars">
                    {[5,4,3,2,1].map((star, i) => { const pct = splitPcts[i]; return (
                      <div key={star} className="rating-row">
                        <span className="rating-star-lab">{star}★</span>
                        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${star} stars: ${pct}%`} className="rating-track">
                          <div style={{ width: `${pct}%` }} className="rating-fill"></div>
                        </div>
                        <span className="mono rating-pct">{pct}%</span>
                      </div>
                    )})}
                  </div>
                </div>
                <p className="fine-note">* Split estimated from the aggregate score. Source: {deal.provider || "Udemy"}. Checked {fmtDate(deal.updatedAt)}.</p>
              </section>
            )}

            <section aria-labelledby="proscons-heading" style={{ marginTop: "2.25rem" }}>
              <h2 id="proscons-heading" style={{ ...H2 }}>Pros and Cons of This Course</h2>
              <div className="pros-cons">
                <div className="pros-col">
                  <h3>What works</h3>
                  <ul>
                    <li><span aria-hidden="true"></span><span>Verified{discountPct > 0 ? ` ${discountPct}%` : ""} price cut, checked {deal.updatedAt ? timeAgo(deal.updatedAt) : "recently"} — not a fake anchor price</span></li>
                    {typeof deal.rating === "number" && (<li><span aria-hidden="true"></span><span>Learner record of {deal.rating.toFixed(1)}/5{typeof deal.students === "number" ? ` across ${deal.students.toLocaleString()} enrollments` : ""} — consistent satisfaction signal</span></li>)}
                    {learnPoints.length > 0 && (<li><span aria-hidden="true"></span><span>Practical outcomes up front: {learnPoints.slice(0, 2).map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ")}</span></li>)}
                    <li><span aria-hidden="true"></span><span>Same seat as full price — certificate, lifetime access, Q&A included</span></li>
                  </ul>
                </div>
                <div className="cons-col">
                  <h3>What's weaker</h3>
                  <ul>
                    {discountPct > 0 && (<li><span aria-hidden="true"></span><span>Back to ${originalPrice.toFixed(2)} the moment the code dies — no grace period</span></li>)}
                    {deal.duration && (<li><span aria-hidden="true"></span><span>Plan real time beyond {deal.duration} of video — exercises and quizzes add up</span></li>)}
                    {!easyStart && reqPoints.length > 0 ? (<li><span aria-hidden="true"></span><span>Assumes background ({reqPoints.slice(0, 2).join("; ")}) — total beginners should check prerequisites first</span></li>) : (<li><span aria-hidden="true"></span><span>Popular codes run out of redemptions fast — waiting usually loses</span></li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section aria-labelledby="who-heading" style={{ marginTop: "2.25rem" }}>
              <h2 id="who-heading" style={{ ...H2 }}>Who Should Enroll (And Who Should Wait)</h2>
              <p className="body-p"><strong>Enroll now if:</strong></p>
              <ul>
                <li>You want {deal.subcategory && deal.subcategory !== deal.category ? deal.subcategory : (deal.category || "these")} skills with a certificate at the end</li>
                {easyStart && (<li>You're starting from zero — the entry bar on this one is low</li>)}
                {typeof deal.rating === "number" && deal.rating >= 4.5 && (<li>You trust a {deal.rating.toFixed(1)}★ learner record over marketing copy</li>)}
                {discountPct >= 90 && (<li>You want maximum cuts — this code takes {discountPct}% off</li>)}
                <li>You'll actually finish — code seats are limited, collectors waste them</li>
              </ul>
              <p className="body-p"><strong>Wait or look elsewhere if:</strong></p>
              <ul>
                {!easyStart && reqPoints.length > 0 ? (<li>You're an absolute beginner — the prerequisites above are real, start easier first</li>) : (<li>You already mastered this topic — the first hours will feel like review</li>)}
                <li>You need a different language — this course is taught in {deal.language || "English"}</li>
                <li>You collect courses without finishing them — let someone else take the seat</li>
              </ul>
            </section>

            {instructorsList.length > 0 && (
              <section aria-labelledby="instructor-heading" id="entry-instructor">
                <h2 id="instructor-heading" style={{ ...H2 }}>Meet the Instructor{instructorsList.length > 1 ? "s" : ""}</h2>
                <div className="instructor-cards">
                  {instructorsList.map((name, idx) => (
                    <div key={name} className="instructor-card">
                      <div className="instructor-top">
                    {(() => {
                      const photo = photoFor(name, idx);
                      return photo ? (
                        <img src={photo} alt={name} width={104} height={104} loading="lazy" className="instructor-photo" />
                      ) : (
                        <div className="instructor-initials" aria-hidden="true">{initials(name)}</div>
                      );
                    })()}
                        <div className="instructor-id">
                          <div className="instructor-name">{name}</div>
                          <div className="mono instructor-sub">{deal.provider || "Udemy"} instructor{typeof deal.students === "number" ? ` · ${deal.students.toLocaleString()}+ learners here` : ""}{typeof deal.rating === "number" ? ` · ★ ${deal.rating.toFixed(1)}` : ""}</div>
                        </div>
                        <a href={`/instructor/${createInstructorSlug(name)}`} className="profile-btn">Full Profile ↗</a>
                      </div>
                      <div className="instructor-note">
                        Hands-on, example-driven teaching around real {deal.category || "IT"} workflows — watch, build alongside, then test yourself with quizzes.{deal.duration ? ` Expect around ${deal.duration} of video.` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section aria-labelledby="faq-heading" id="entry-faq" className="panel-faq">
                <h2 id="faq-heading" style={{ ...H2 }}>Udemy Coupon FAQs — Answered</h2>
                <div className="faq-list">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="faq-item">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                        aria-expanded={expandedFAQ === idx}
                        aria-controls={`faq-answer-${idx}`}
                        id={`faq-question-${idx}`}
                        className="faq-q"
                      >
                        <span><span className="mono faq-no">Q{idx + 1}</span>{faq.q}</span>
                        <span aria-hidden="true" className={expandedFAQ === idx ? "faq-caret open" : "faq-caret"}>▼</span>
                      </button>
                      {expandedFAQ === idx && (
                        <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-question-${idx}`} className="faq-a">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="reviewer-heading" className="reviewer-box">
              <h2 id="reviewer-heading" style={{ ...H2, fontSize: "1.15rem" }}>Reviewed By</h2>
              <div className="reviewer-inner">
                <div className="reviewer-photo">
                  <img src="/images/author.jpg" alt="Andrew Derek" loading="lazy" />
                </div>
                <div className="reviewer-id">
                  <div className="reviewer-name">Andrew Derek</div>
                  <div className="mono reviewer-role">COUPON ANALYST · COURSESWYN</div>
                  <p className="reviewer-bio">
                    Andrew tracks Udemy price swings daily and only lists codes that survive verification — so the discount you see here is one he'd claim himself.
                  </p>
                  <div className="reviewer-links">
                    <a href="https://facebook.com/CoursesWyn" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="soc-btn">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href="https://x.com/CoursesWyn" target="_blank" rel="noopener noreferrer" aria-label="X" className="soc-btn">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                    <a href="https://medium.com/@coursewyn" target="_blank" rel="noopener noreferrer" aria-label="Medium" className="soc-btn soc-m">M</a>
                    <a href="/udemy-coupon-code" className="lg-link" style={{ marginLeft: "auto" }}>Fresh Drops →</a>
                  </div>
                </div>
              </div>
            </section>

            <section aria-label="Claim this coupon" className="claim-strip">
              {deal.image && (
                <img src={deal.image} alt="" width="160" height="90" loading="lazy" decoding="async" className="claim-thumb" />
              )}
              <div className="claim-main">
                <div className="claim-title">{discountPct >= 50 || price === 0 ? "Worth claiming — enroll now" : "Worth claiming while the code lives"}</div>
                <div className="claim-sub">{discountPct > 0 ? `$${price.toFixed(2)} instead of $${originalPrice.toFixed(2)} · certificate included` : "Free enrollment · certificate included"}</div>
              </div>
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary btn-lg final-cta">
                Enroll for ${price.toFixed(2)} →
              </a>
            </section>

            <div className="topic-tags">
              <span className="topic-tags-label">Explore topics:</span>
              {deal.category && (<a href={`/categories/${slugifyCategory(deal.category)}`} className="topic-chip">{deal.category}</a>)}
              {deal.subcategory && deal.subcategory !== deal.category && (<a href={`/topics/${slugifyTopic(deal.subcategory)}`} className="topic-chip">{deal.subcategory}</a>)}
            </div>

            <div className="share-row">
              <span className="share-label">Share:</span>
              <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(deal.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="soc-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="soc-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <button onClick={copyLink} className="copy-link-btn">{linkCopied ? "✓ Copied" : "Copy link"}</button>
            </div>

            {related.length > 0 && (
              <section aria-labelledby="related-heading" className="related-sec">
                <h3 id="related-heading" className="related-title">Keep reading</h3>
                <div className="keep-grid">
                  {shownRelated.map((r) => {
                    const rp = typeof r.price === "number" ? r.price : 0;
                    const ro = typeof r.originalPrice === "number" && r.originalPrice > rp ? r.originalPrice : rp;
                    const rd = ro > rp && rp >= 0 ? Math.round(100 - (rp / ro) * 100) : 0;
                    return (
                      <article key={r.slug} className="keep-card">
                        {r.image && (
                          <a href={`/coupon/${r.slug}`} tabIndex={-1} aria-hidden="true">
                            <img src={r.image} alt="" width="300" height="169" loading="lazy" className="keep-thumb" />
                          </a>
                        )}
                        <div className="keep-cat">{r.subcategory || r.category || r.provider}</div>
                        <h4 className="keep-title">
                          <a href={`/coupon/${r.slug}`}>{r.title}</a>
                        </h4>
                        <div className="keep-meta">
                          {typeof r.rating === "number" && (<span>⭐ {r.rating.toFixed(1)}</span>)}
                          {typeof r.students === "number" && (<span>{r.students >= 1000 ? (r.students / 1000).toFixed(1).replace(/\.0$/, "") + "k" : r.students} learners</span>)}
                          <span className="mono keep-price">${rp.toFixed(2)}</span>
                          {rd > 0 && (<span className="keep-off">{rd}% off</span>)}
                        </div>
                        {r.updatedAt && (<div className="keep-checked">Checked {timeAgo(r.updatedAt)}</div>)}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </article>

          {/* RIGHT RAIL — sticky verdict + share */}
          <aside className="article-col-side" aria-label="Coupon verdict and sharing">
            <div className="tl-verdict">
              <div className="tl-verdict-label">The Verdict</div>
              <div className="tl-verdict-price">
                <span className="mono">{price === 0 ? "Free" : `$${price.toFixed(2)}`}</span>
                {discountPct > 0 && <span className="tl-verdict-was">${originalPrice.toFixed(2)}</span>}
              </div>
              {discountPct > 0 && <div className="tl-verdict-save">You save ${savings.toFixed(2)} ({discountPct}%)</div>}
              {countdown && (
                <div className="tl-verdict-clock" role="timer" aria-live="polite">
                  ⏳ {countdown.days > 0 ? `${countdown.days}d ${countdown.hours}h` : countdown.hours > 0 ? `${countdown.hours}h ${countdown.minutes}m` : "Ending soon"} left
                </div>
              )}
              <button onClick={() => { copyMasked(); goEnroll(); }} className="btn btn-primary tl-verdict-cta">
                {copied ? "✓ Copied — opening…" : "Reveal & Claim"}
              </button>
              <div className="tl-verdict-code">
                <span>Code</span>
                <code className="mono">{masked}</code>
              </div>
              <div className="tl-verdict-checked">✓ Checked {deal.updatedAt ? timeAgo(deal.updatedAt) : "recently"}</div>
            </div>
            <div className="pp-side" aria-label="Udemy Personal Plan alternative">
              <div className="pp-side-top"><span className="pp-side-pill">Alternative</span><span className="pp-side-off">25% OFF</span></div>
              <div className="pp-side-title">No working code? Get 26,000+ courses</div>
              <p className="pp-side-sub">One flat price, certificates included, cancel anytime.</p>
              <div className="pp-side-price"><span className="pp-side-now">$20/mo</span><span className="pp-side-trial">7-day free trial</span></div>
              <a href={personalPlanUrl} target="_blank" rel="sponsored noopener noreferrer" className="btn btn-primary pp-side-btn">Try Personal Plan →</a>
              <p className="pp-side-note">Sponsored</p>
            </div>
            <div className="share-card">
              <h5 className="toc-label">Share</h5>
              <div className="share-btns">
                <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(deal.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="soc-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="soc-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--muted)"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <button onClick={copyLink} className="copy-link-btn">{linkCopied ? "✓" : "⧉"}</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: "var(--card)", borderRadius: "16px", padding: "2rem", maxWidth: "460px", width: "100%", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.25)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(false)} aria-label="Close modal" style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--brand)", textAlign: "center", marginBottom: "0.4rem" }}>CoursesWyn verified coupon</div>
            <h3 id="modal-title" style={{ color: "var(--text)", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.4rem", textAlign: "center" }}>Your Coupon Is Ready</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", textAlign: "center", margin: "0 0 1.4rem" }}>Click Reveal — the code appears here and Udemy opens with the discount applied.</p>
            <div style={{ background: "var(--bg)", border: "1px dashed var(--brand)", padding: "1.1rem", borderRadius: "10px", marginBottom: "1.1rem", textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px", fontWeight: 700 }}>Coupon Code</p>
              <code style={{ display: "block", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", letterSpacing: "1px", fontFamily: "var(--font-mono)" }}>{masked}</code>
            </div>
            <div style={{ display: "flex", gap: "0.7rem", flexDirection: "column" }}>
              <button onClick={() => { copyMasked(); goEnroll(); }} style={{ background: "var(--brand)", border: "1px solid var(--brand)", color: "#121715", padding: "0.75rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.92rem", minHeight: "48px" }}>
                {copied ? "✓ Copied — opening Udemy…" : "Reveal & Go to Udemy"}
              </button>
              <button onClick={copyMasked} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "0.7rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}>
                {copied ? "✓ Copied!" : "Copy code only"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .article-grid { display: grid; grid-template-columns: 220px minmax(0, 720px) 300px; gap: 2.5rem; justify-content: center; align-items: start; }
        .article-col-toc { position: sticky; top: 90px; }
        .toc-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.1rem 1.2rem; }
        .toc-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text); margin: 0 0 0.6rem; }
        .toc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .toc-list li a { display: block; font-size: 0.82rem; font-weight: 600; color: var(--muted); text-decoration: none; padding: 7px 2px; border-top: 1px solid var(--ledger); }
        .toc-list li:first-child a { border-top: none; }
        .toc-list li a:hover { color: var(--brand); }
        .article-col-main { min-width: 0; }
        .article-h1 { font-size: clamp(1.7rem, 3.4vw, 2.4rem); font-weight: 800; line-height: 1.2; margin: 0 0 0.9rem; color: var(--text); letter-spacing: -0.015em; }
        .article-h1-updated { color: var(--muted); font-weight: 600; font-size: 0.55em; white-space: nowrap; }
        .article-byline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--muted); margin-bottom: 1.4rem; }
        .byline-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--brand); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 0.72rem; flex-shrink: 0; }
        .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); display: inline-block; }
        .udemy-course-hero { position: relative; aspect-ratio: 16/9; margin: 0 0 1.5rem; border-radius: 12px; overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border); }
        .udemy-course-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .udemy-course-chip { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 18px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; margin: 0 0 1.75rem; }
        .udemy-chip-instructor { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .udemy-avatar, .udemy-avatar-img { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; }
        .udemy-avatar { display: inline-flex; align-items: center; justify-content: center; background: var(--brand-soft); color: var(--brand); font-weight: 800; font-size: 0.85rem; }
        .udemy-avatar-img { object-fit: cover; }
        .udemy-chip-id { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .udemy-chip-kicker { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
        .udemy-chip-name { font-size: 0.88rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .udemy-chip-sep { width: 1px; align-self: stretch; background: var(--border); }
        .udemy-stat { display: flex; flex-direction: column; gap: 2px; }
        .udemy-stat-val { font-size: 0.88rem; color: var(--text); }
        .udemy-stat-dim { color: var(--muted); font-weight: 400; font-size: 0.75rem; }
        .udemy-stars { color: var(--brand); letter-spacing: 1px; }
        .udemy-price-now { color: var(--brand); }
        .udemy-chip-cta { display: inline-flex; align-items: center; justify-content: center; padding: 0.7rem 1.5rem; background: var(--brand); color: #fff; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 0.85rem; white-space: nowrap; margin-left: auto; }
        .udemy-chip-cta:hover { filter: brightness(1.07); }
        .body-p { font-size: 0.92rem; line-height: 1.75; color: var(--text-secondary); margin: 0 0 1rem; }
        [role="dialog"] button { font-family: inherit; }
        .sec-intro { font-size: 0.88rem; color: var(--muted); margin: 0 0 1rem; line-height: 1.65; }
        .article-col-main h3 { font-size: 0.95rem; font-weight: 700; color: var(--text); margin: 1.25rem 0 0.6rem; line-height: 1.4; }
        .sec-intro a, .prose a { color: var(--brand); }
        .plain-list { margin: 0; padding-left: 1.2rem; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.8; }
        .prose { font-size: 0.92rem; line-height: 1.75; color: var(--text-secondary); background: transparent; border: none; border-radius: 0; padding: 0; }
        .prose, .prose * { font-family: inherit !important; }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: var(--text); margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1em; line-height: 1.5; }
        .prose pre { white-space: pre-wrap; font-family: var(--font-mono) !important; font-size: 0.82rem; background: var(--bg-secondary); padding: 0.9rem 1rem; border-radius: 10px; overflow-x: auto; }
        .prose p { margin-bottom: 1em; }
        .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; }
        .prose li { margin-bottom: 0.5em; }
        .prose a { color: var(--brand); text-decoration: underline; }
        .prose strong { color: var(--text); }
        .prose code { background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
        .guide-strip { margin-top: 1.1rem; padding: 1rem 1.25rem; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; }
        .guide-strip-main { flex: 1; min-width: 180px; }
        .guide-strip-title { font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .guide-strip-sub { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }
        .guide-btn { padding: 0.5rem 1rem; background: var(--brand-soft); border: 1px solid var(--brand); border-radius: 8px; color: var(--brand); text-decoration: none; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
        .guide-btn.ghost { background: transparent; border-color: var(--border); color: var(--text); }
        .rating-summary { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.4rem 1.5rem; display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .rating-num { font-size: 3rem; font-weight: 800; color: var(--brand); line-height: 1; }
        .fine-note { font-size: 0.75rem; color: var(--muted); margin-top: 0.7rem; font-style: italic; }
        .rating-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .rating-star-lab { color: var(--muted); font-size: 0.78rem; width: 46px; flex-shrink: 0; font-family: var(--font-mono); }
        .rating-track { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
        .rating-fill { height: 100%; background: var(--brand); border-radius: 4px; }
        .instructor-cards { display: flex; flex-direction: column; gap: 1rem; }
        .instructor-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
        .instructor-photo { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .instructor-initials { width: 52px; height: 52px; border-radius: 50%; background: var(--brand-soft); border: 1px solid var(--brand); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--brand); font-size: 1.1rem; font-weight: 700; }
        .instructor-name { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .profile-btn { padding: 0.45rem 1rem; background: var(--brand-soft); border: 1px solid var(--brand); border-radius: 8px; font-size: 0.8rem; color: var(--brand); text-decoration: none; font-weight: 700; }
        .faq-list { display: flex; flex-direction: column; gap: 0.7rem; }
        .faq-item { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--card); }
        .faq-q { width: 100%; padding: 0.95rem 1.2rem; background: transparent; border: none; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-family: inherit; font-size: 0.92rem; font-weight: 700; color: var(--text); gap: 1rem; }
        .faq-no { color: var(--brand); font-size: 0.75rem; margin-right: 8px; }
        .faq-caret { transition: transform 0.2s; flex-shrink: 0; color: var(--muted); }
        .faq-caret.open { transform: rotate(180deg); }
        .faq-a { padding: 0 1.2rem 1rem 1.2rem; }
        .faq-a p { color: var(--text-secondary); line-height: 1.7; font-size: 0.88rem; margin: 0; border-top: 1px dashed var(--border); padding-top: 0.9rem; }
        .reviewer-box { margin-top: 2.25rem; border: 1px solid var(--border); padding: 1.4rem 1.5rem; border-radius: 16px; background: var(--card); display: flex; gap: 1.1rem; flex-wrap: wrap; align-items: flex-start; }
        .reviewer-photo { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 2px solid var(--brand); flex-shrink: 0; }
        .reviewer-photo img { width: 100%; height: 100%; object-fit: cover; }
        .topic-tags { margin-top: 2rem; padding: 1rem 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .topic-tags-label { font-size: 0.8rem; font-weight: 800; color: var(--text); }
        .topic-chip { font-size: 0.78rem; font-weight: 600; color: var(--brand); background: var(--brand-soft); border: 1px solid var(--brand); border-radius: 999px; padding: 4px 12px; text-decoration: none; }
        .share-row { margin-top: 1rem; padding: 1rem 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .share-label { font-size: 0.8rem; font-weight: 800; color: var(--text); }
        .soc-btn { width: 30px; height: 30px; border-radius: 7px; background: var(--bg); border: 1px solid var(--border); display: inline-flex; align-items: center; justify-content: center; text-decoration: none; color: var(--muted); font-size: 0.75rem; font-weight: 800; cursor: pointer; font-family: inherit; }
        .copy-link-btn { height: 30px; padding: 0 12px; border-radius: 7px; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-size: 0.75rem; font-weight: 700; cursor: pointer; font-family: inherit; }
        .related-sec { margin-top: 2.5rem; }
        .related-title { font-size: 1.15rem; font-weight: 800; color: var(--text); margin: 0 0 1.1rem; }
        .keep-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .keep-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .keep-thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; border-bottom: 1px solid var(--border); }
        .keep-cat { font-size: 11px; font-weight: 700; color: var(--brand); text-transform: uppercase; letter-spacing: 0.06em; padding: 12px 14px 0; }
        .keep-title { margin: 4px 0 0; font-size: 14px; line-height: 1.4; padding: 0 14px; }
        .keep-title a { color: var(--text); text-decoration: none; }
        .keep-title a:hover { color: var(--brand); }
        .keep-meta { display: flex; gap: 10px; align-items: center; color: var(--muted); font-size: 12px; padding: 8px 14px 0; flex-wrap: wrap; }
        .keep-price { font-weight: 700; color: var(--text); }
        .keep-off { background: var(--brand); color: #fff; font-weight: 800; font-size: 11px; padding: 1px 7px; border-radius: 5px; }
        .keep-checked { font-size: 11px; color: var(--muted); padding: 6px 14px 14px; }
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 2rem 0; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .pros-col { padding: 1.25rem 1.4rem; border-right: 1px solid var(--border); }
        .cons-col { padding: 1.25rem 1.4rem; }
        .pros-cons h3 { margin: 0 0 0.75rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; }
        .pros-col h3 { color: var(--brand); }
        .cons-col h3 { color: #CF6F59; }
        .pros-cons ul { padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .pros-cons li { display: flex; gap: 10px; align-items: flex-start; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; }
        .pros-cons li > span:first-child { flex: none; width: 6px; height: 6px; border-radius: 50%; margin-top: 8px; }
        .pros-col li > span:first-child { background: var(--brand); }
        .cons-col li > span:first-child { background: #CF6F59; }
        @media (max-width: 640px) { .pros-cons { grid-template-columns: 1fr; } .pros-col { border-right: none; border-bottom: 1px solid var(--border); } .keep-grid { grid-template-columns: 1fr; } }
        .final-verdict { margin-top: 2.5rem; background: var(--card); border: 1px solid var(--brand); border-radius: 16px; padding: 1.75rem; text-align: center; }
        .claim-strip { margin-top: 2.5rem; background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--brand); border-radius: 14px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
        .claim-thumb { width: 120px; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); flex-shrink: 0; }
        .claim-main { flex: 1; min-width: 200px; }
        .claim-title { font-size: 1.05rem; font-weight: 800; color: var(--text); }
        .claim-sub { font-size: 0.85rem; color: var(--muted); margin-top: 2px; }
        .final-verdict-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 1.25rem; display: block; }
        .final-verdict h2 { font-size: clamp(1.2rem, 2.6vw, 1.6rem); font-weight: 800; color: var(--text); margin: 0 0 0.6rem; }
        .final-verdict p { font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; margin: 0 auto 1.25rem; max-width: 600px; }
        .article-col-side { position: sticky; top: 90px; display: flex; flex-direction: column; gap: 1rem; }
        .tl-verdict { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; }
        .tl-verdict-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin-bottom: 10px; }
        .tl-verdict-price { display: flex; align-items: baseline; gap: 10px; }
        .tl-verdict-price .mono { font-size: 1.6rem; font-weight: 700; color: var(--text); }
        .tl-verdict-was { font-size: 0.85rem; color: var(--muted); text-decoration: line-through; }
        .tl-verdict-save { font-size: 0.8rem; font-weight: 700; color: var(--brand); margin-top: 4px; }
        .tl-verdict-clock { font-size: 0.75rem; font-weight: 600; color: var(--muted); margin-top: 8px; }
        .tl-verdict-cta { display: block; width: 100%; margin-top: 12px; padding: 0.8rem; font-size: 0.9rem; }
        .tl-verdict-alt { display: block; text-align: center; font-size: 0.78rem; font-weight: 600; color: var(--muted); margin-top: 8px; text-decoration: none; }
        .tl-verdict-alt:hover { color: var(--brand); }
        .tl-verdict-code { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; padding: 8px 10px; background: var(--bg); border: 1px dashed var(--border); border-radius: 8px; font-size: 0.72rem; color: var(--muted); }
        .tl-verdict-code code { font-weight: 700; color: var(--text); letter-spacing: 0.5px; }
        .tl-verdict-checked { font-size: 0.72rem; color: var(--brand); font-weight: 600; margin-top: 8px; }
        .pp-side { background: linear-gradient(180deg, rgba(255,201,77,0.18), rgba(255,201,77,0.05)); border: 1px solid var(--brand); border-radius: 14px; padding: 1.05rem 1.1rem; }
        .pp-side-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
        .pp-side-pill { font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--brand); border: 1px solid var(--brand); border-radius: 999px; padding: 3px 9px; }
        .pp-side-off { font-family: var(--font-display); font-size: 0.72rem; font-weight: 800; color: #0b0e14; background: var(--brand); border-radius: 999px; padding: 4px 10px; }
        .pp-side-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: var(--text); line-height: 1.35; margin-bottom: 4px; }
        .pp-side-sub { font-size: 0.78rem; color: var(--muted); line-height: 1.55; margin: 0 0 8px; }
        .pp-side-price { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
        .pp-side-now { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--brand); }
        .pp-side-trial { font-family: var(--font-mono); font-size: 0.68rem; color: var(--muted); }
        .pp-side-btn { display: block; width: 100%; padding: 0.8rem; font-size: 0.9rem; }
        .pp-side-note { font-size: 0.68rem; color: var(--muted); text-align: center; margin: 8px 0 0; }
        .share-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.1rem 1.2rem; }
        .share-card .toc-label { margin-bottom: 0.6rem; }
        .share-btns { display: flex; gap: 8px; }
        .toc-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.1rem 1.2rem; }
        .toc-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text); margin: 0 0 0.6rem; }
        .toc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .toc-list li a { display: block; font-size: 0.82rem; font-weight: 600; color: var(--muted); text-decoration: none; padding: 7px 2px; border-top: 1px solid var(--border); }
        .toc-list li:first-child a { border-top: none; }
        .toc-list li a:hover { color: var(--brand); }
        .lg-link { display: inline-flex; align-items: center; gap: 7px; font-size: 0.82rem; font-weight: 700; color: var(--brand); text-decoration: none; }
        .lg-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .verdict-box { margin: 0; padding: 1.25rem 1.4rem; background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--brand); border-radius: 0 12px 12px 0; }
        .verdict-answer { font-size: 1rem; line-height: 1.75; color: var(--text-secondary); margin: 0 0 1rem; }
        .verdict-answer strong { color: var(--text); }
        .verdict-facts { margin: 0; display: grid; gap: 0; border-top: 1px dashed var(--border); padding-top: 0.9rem; }
        .verdict-facts > div { display: grid; grid-template-columns: 90px 1fr; gap: 10px; padding: 5px 0; font-size: 0.88rem; }
        .verdict-facts dt { color: var(--muted); font-weight: 600; }
        .verdict-facts dd { margin: 0; color: var(--text); font-weight: 500; }
        .editor-note { margin-top: 1rem; background: linear-gradient(180deg, rgba(255,201,77,0.08), transparent); border: 1px solid rgba(255,201,77,0.25); border-radius: 12px; padding: 1rem 1.2rem; }
        .editor-note-label { font-family: var(--font-mono); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--brand); margin-bottom: 0.4rem; }
        .editor-note p { margin: 0; font-size: 0.92rem; line-height: 1.75; color: var(--text-secondary); white-space: pre-line; }
        .fact-table { margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .panel-facts { background: linear-gradient(180deg, rgba(255,201,77,0.10), rgba(255,201,77,0.03)); border: 1px solid rgba(255,201,77,0.28); border-radius: 16px; padding: 1.4rem 1.5rem; margin-top: 2.25rem; }
        .panel-facts .fact-table { background: transparent; border: none; border-radius: 0; }
        .panel-facts .fact-row { border-top-color: rgba(255,201,77,0.18); padding-left: 0; padding-right: 0; }
        .panel-faq { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 1.4rem 1.5rem; }
        .article-col-main h2::before { content: "## "; color: var(--brand); font-family: var(--font-mono); }
        .fact-row { display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 0.7rem 1.2rem; border-top: 1px solid var(--border); font-size: 0.9rem; }
        .fact-row:first-child { border-top: none; }
        .fact-row dt { color: var(--muted); font-weight: 600; }
        .fact-row dd { margin: 0; color: var(--text); font-weight: 500; line-height: 1.55; }
        .hl { color: var(--brand); }
        .notice-warn { font-size: 0.83rem; color: var(--text-secondary); background: rgba(252,211,77,0.1); border: 1px solid rgba(252,211,77,0.35); border-radius: 10px; padding: 0.8rem 1.1rem; line-height: 1.6; }
        .notice-warn strong { color: var(--text); }
        .rating-big { text-align: center; min-width: 100px; }
        .rating-num { font-size: 3rem; font-weight: 800; color: var(--brand); line-height: 1; }
        .rating-stars { color: var(--brand); font-size: 1rem; margin: 4px 0; }
        .rating-count { color: var(--muted); font-size: 0.75rem; }
        .rating-bars { flex: 1; min-width: 200px; }
        .reading-time { font-size: 13px; color: var(--muted); }
        .reviewer-inner { display: flex; gap: 1.1rem; flex-wrap: wrap; align-items: flex-start; }
        .reviewer-id { flex: 1; min-width: 240px; }
        .reviewer-name { font-size: 1rem; font-weight: 700; color: var(--text); }
        .reviewer-bio { font-size: 0.85rem; color: var(--muted); line-height: 1.65; margin: 0.4rem 0 0.75rem; }
        .reviewer-links { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
        .instructor-top { padding: 1.25rem 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
        .instructor-id { flex: 1; min-width: 180px; }
        .instructor-note { border-top: 1px dashed var(--border); padding: 0.9rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }
        @media (max-width: 1100px) {
          .article-grid { grid-template-columns: 200px minmax(0, 1fr) !important; }
          .article-col-side { display: none !important; }
        }
        @media (max-width: 860px) {
          .article-grid { grid-template-columns: 1fr !important; }
          .article-col-toc { display: none !important; }
          .keep-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .keep-grid { grid-template-columns: 1fr !important; }
          .article-h1 { font-size: 1.35rem !important; }
        }
      `}</style>
    </div>
  );
}

function currentMonthYear(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

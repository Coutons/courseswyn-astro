"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Deal } from "@/types/deal";
import { slugifyCategory, slugifyTopic } from "@/lib/utils";
import { parseInstructors, createInstructorSlug } from "@/lib/instructors";
import { buildCouponFAQs, formatDuration, formatMoney } from "@/lib/dealStats";
import { renderMarkdownToHtml } from "@/lib/markdown";

interface Props {
  deal: Deal;
  relatedDeals?: Deal[];
  catStats?: unknown;
  instructorImage?: string;
  instructorImages?: Record<string, string>;
  couponMask?: string;
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

const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 13.2l7.1-.6z";

function UdemyLogo({ height = 28 }: { height?: number }) {
  const width = Math.round((height * 250) / 94);
  return (
    <img src="/providers/udemy.png" alt="Udemy" height={height} width={width} loading="lazy" className="clx-provider-img" />
  );
}

function ProviderLogo({ name, height = 28 }: { name?: string; height?: number }) {
  if ((name || "").trim().toLowerCase() === "udemy") return <UdemyLogo height={height} />;
  return <span className="clx-provider-fallback">{name}</span>;
}

function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#111111" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="M12 6.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.6l2-.3z" fill="#111111" stroke="none" />
      <path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#292EC9" aria-hidden="true">
      <path d="M3 7l4 4 5-6 5 6 4-4-1.5 11h-15L3 7zm0 13h18v2H3v-2z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 1l2.4 2.1 3.1-.5 1.1 3 3 1.1-.5 3.1L23 12l-2.1 2.4.5 3.1-3 1.1-1.1 3-3.1-.5L12 23l-2.4-2.1-3.1.5-1.1-3-3-1.1.5-3.1L1 12l2.1-2.4-.5-3.1 3-1.1 1.1-3 3.1.5z" fill="#292EC9" />
      <path d="M10.6 15.6l-3.2-3.2 1.4-1.4 1.8 1.8 5-5 1.4 1.4z" fill="#ffffff" />
    </svg>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="clx-stars" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="clx-star" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff" opacity="0.55"><path d={STAR} /></svg>
            <span className="clx-star-fill" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff"><path d={STAR} /></svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function DealPage({ deal, relatedDeals = [], instructorImages = {}, couponMask }: Props) {
  const instructorsList = useMemo(() => parseInstructors(deal.instructor), [deal.instructor]);

  const bodyContent = deal.content || deal.description || "";
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

  const faqs = useMemo(() => buildCouponFAQs(deal), [deal]);

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [qnOpen, setQnOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAllLearn, setShowAllLearn] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Coupon expired");
  const [reportDetail, setReportDetail] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [nlDone, setNlDone] = useState(false);
  const [nlError, setNlError] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);
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

  useEffect(() => {
    if (shownRelated.length <= 1) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || pauseRef.current) return;
      const card = el.querySelector<HTMLElement>("[data-card]");
      const step = card ? card.offsetWidth + 20 : el.clientWidth;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [relatedDeals.length]);

  const nlSubmit = () => {
    const em = nlEmail.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
      setNlError("Enter a valid email address.");
      return;
    }
    setNlError("");
    setNlDone(true);
  };

  useEffect(() => {
    if (!qnOpen && !reportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setQnOpen(false); setReportOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [qnOpen, reportOpen]);

  const price = deal.price ?? 0;
  const originalPrice = deal.originalPrice && deal.originalPrice > price ? deal.originalPrice : price;
  const discountPct = originalPrice > price && price >= 0 ? Math.round(100 - (price / originalPrice) * 100) : 0;
  const savings = Math.max(originalPrice - price, 0);

  const learnPoints = (deal.learn || []).map((s) => s.replace(/\r/g, "").trim()).filter(Boolean);
  const reqPoints = (deal.requirements || []).map((s) => s.replace(/\r/g, "").trim()).filter(Boolean);
  const levelLabel = (deal.level || "").trim() || "All levels";

  // ── "Is this coupon worth it?" verdict (coursespeak-style, fully dynamic) ──
  const worthCat = (deal.category || "course").trim();
  const durStr = typeof deal.duration === "string" ? deal.duration : "";
  const durMatch = /(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?/i.exec(durStr);
  const durHours = durMatch ? parseFloat(durMatch[1]) + (durMatch[2] ? parseFloat(durMatch[2]) / 60 : 0) : 0;
  const perHour = durHours > 0 && price > 0 ? price / durHours : 0;
  const learnHighlights = learnPoints.slice(0, 3);
  const reqHighlights = reqPoints.filter((r) => !/^(none|n\/?a|-|nothing)\.?$/i.test(r)).slice(0, 2);
  const beginnerFriendly = /beginner|all levels/i.test(levelLabel) && reqHighlights.length === 0;
  const updatedShort = (() => { try { return new Date(deal.updatedAt || deal.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "recently"; } })();
  const urgencyText = countdown
    ? countdown.days > 0
      ? `Our records show it runs out in ${countdown.days} day${countdown.days !== 1 ? "s" : ""}${countdown.hours > 0 ? ` and ${countdown.hours} hour${countdown.hours !== 1 ? "s" : ""}` : ""}.`
      : countdown.hours > 0
        ? `Our records show it runs out in ${countdown.hours} hour${countdown.hours !== 1 ? "s" : ""}${countdown.minutes > 0 ? ` and ${countdown.minutes} minute${countdown.minutes !== 1 ? "s" : ""}` : ""}.`
        : "Our records show it runs out very soon."
    : "";

  // ── Sidebar "More Info" (demand signal from enrollment) ──
  const demand: string = typeof deal.students === "number" && deal.students >= 50000 ? "High" : typeof deal.students === "number" && deal.students >= 5000 ? "Medium" : "Growing";
  const visibleLearn = showAllLearn ? learnPoints : learnPoints.slice(0, 8);
  const needLearnToggle = learnPoints.length > 4;

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
  const shownRelated = related.slice(0, 6);
  const updatedLong = fmtDate(deal.updatedAt);
  const reportHref = `/contact?issue=${encodeURIComponent(reportReason)}&coupon=${encodeURIComponent(deal.slug)}&detail=${encodeURIComponent(reportDetail)}`;

  return (
    <div className="clx">
      <div className="clx-wrap">

        <nav aria-label="breadcrumbs" className="clx-crumb">
          <p><span>Home &gt;</span> {deal.category ? <><a href={`/categories/${slugifyCategory(deal.category)}`}>{deal.category}</a><span> &gt; </span></> : null}<span>{deal.title}</span></p>
        </nav>

        {/* ── Hero: media | info ── */}
        <div className="clx-hero">
          <div className="clx-media">
            {deal.image && (
              <img src={deal.image} alt={deal.title} title={deal.title} width="640" height="360" loading="eager" decoding="async" className="clx-poster" />
            )}
            <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="clx-enroll clx-enroll-desktop" aria-label={`Claim coupon for ${deal.title} on ${deal.provider || "Udemy"}`}>
              <span className="clx-enroll-text">CLAIM COUPON</span>
              <span className="clx-enroll-icon" aria-hidden="true">
                <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" /></svg>
              </span>
            </a>
          </div>

          <div className="clx-info">
            <span className="clx-provider"><ProviderLogo name={deal.provider} height={28} /></span>
            <h1 className="clx-h1">{deal.title}</h1>
            {deal.description && (
              <p className="clx-desc">{deal.description}</p>
            )}
            {instructorsList.length > 0 && (
              <h2 className="clx-taught">
                Taught by ⋮<b> {instructorsList.map((name, i) => (
                  <span key={name}>
                    {i > 0 && <>, </>}
                    <a href={`/instructor/${createInstructorSlug(name)}`}>{name}</a>
                  </span>
                ))}</b>{" "}
                <button className="clx-qmark" onClick={() => setQnOpen(true)} aria-label="Quick note" title="Quick Note">
                  <span className="clx-qmark-text">?</span>
                </button>
              </h2>
            )}

            <div className="clx-pills">
              {typeof deal.students === "number" && (
                <span className="clx-pill">Total Enrolments : <b>{deal.students.toLocaleString()}</b></span>
              )}
              {deal.category && (
                <span className="clx-pill clx-pill-link"><a href={`/categories/${slugifyCategory(deal.category)}`} rel="tag">{deal.category}</a></span>
              )}
            </div>

            {typeof deal.rating === "number" && (
              <div className="clx-ratingrow">
                <Stars value={deal.rating} />
                <span className="clx-ratingbadge">
                  <span className="clx-rating-number">{deal.rating.toFixed(1)}</span>
                  <span className="clx-rating-label">rating based on</span>
                  {typeof deal.students === "number" && (
                    <span className="clx-rating-reviews">({deal.students.toLocaleString()} reviews)</span>
                  )}
                  <span className="clx-info-tip" tabIndex={0} aria-label="More information">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16m0 2C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-1-11v6h2v-6zm0-4h2v2h-2z" /></svg>
                    <span className="clx-tooltip" role="tooltip">Available on <strong>{deal.provider || "Udemy"}</strong></span>
                  </span>
                </span>
              </div>
            )}

            <p className="clx-price">
              {price === 0 ? (
                <><strong>Free</strong> with coupon</>
              ) : (
                <><strong>${price.toFixed(2)}</strong> with coupon{discountPct > 0 ? <> (list ${originalPrice.toFixed(2)} — save ${savings.toFixed(2)}, {discountPct}% off)</> : null}</>
              )}
            </p>
            <p className="clx-checked">
              Coupon Verified: <strong>{updatedLong}</strong> · click Claim Coupon to apply the discount code
            </p>
            {countdown && (
              <div className="clx-timer" role="timer" aria-live="polite" aria-label="Coupon countdown">
                <span className="clx-timer-label">Ends in</span>
                {[
                  { v: countdown.days, l: "Days" },
                  { v: countdown.hours, l: "Hrs" },
                  { v: countdown.minutes, l: "Min" },
                  { v: countdown.seconds, l: "Sec" },
                ].map(({ v, l }) => (
                  <span key={l} className="clx-tbox">
                    <strong>{String(v).padStart(2, "0")}</strong>
                    <small>{l}</small>
                  </span>
                ))}
              </div>
            )}
            <div className="clx-coderow" aria-label="Coupon code">
              <code>{masked}</code>
              <button onClick={copyMasked} type="button">{copied ? "✓ Copied" : "Copy"}</button>
            </div>
          </div>
        </div>

        {/* ── Info card + content ── */}
        <div className="clx-cols">
          <aside className="clx-side" aria-label="Course info">
            <div className="clx-sidecard">
              <h2 className="clx-side-h2">Course Info</h2>
              <div className="clx-iconbox">
                <MedalIcon />
                <div>
                  <span className="clx-iconbox-title">Shareable Badge</span>
                  <p className="clx-iconbox-desc">Certificate of completion</p>
                </div>
              </div>
              <div className="clx-providerline">
                <span className="clx-pl-item"><CrownIcon /><span>{deal.provider || "Udemy"}</span></span>
                <span className="clx-pl-sep" aria-hidden="true" />
                <span className="clx-pl-item"><VerifiedIcon /><span>{price === 0 ? "Free" : "Premium"}</span></span>
              </div>
              <hr className="clx-side-hr" />
              <ul className="clx-postinfo">
                {deal.duration && (
                  <li><span className="clx-gicon" aria-hidden="true">◷</span><span>{deal.duration}</span></li>
                )}
                <li><span className="clx-gicon" aria-hidden="true">▅</span><span>{levelLabel}</span></li>
                {deal.language && (
                  <li><span className="clx-gicon" aria-hidden="true">▶</span><span>{deal.language}</span></li>
                )}
                <li><span className="clx-gicon" aria-hidden="true">◉</span><span>Self-Paced Online Course · Lifetime Access</span></li>
              </ul>
              <hr className="clx-side-hr" />
              <h2 className="clx-side-h2">More Info</h2>
              <ul className="clx-postinfo">
                <li><span className="clx-gicon" aria-hidden="true">▲</span><span>Course Demand Is <strong>{demand}</strong></span></li>
                <li className="clx-guarantee"><span className="clx-gicon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg></span><span>Under <strong>30 Days</strong> Money Back Policy</span><span className="clx-info-tip" tabIndex={0} aria-label="About the money-back policy"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16m0 2C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-1-11v6h2v-6zm0-4h2v2h-2z" /></svg><span className="clx-tooltip" role="tooltip">Udemy&apos;s standard 30-day money-back guarantee applies to this course — full refund, no questions asked.</span></span></li>
              </ul>
              <div className="clx-sidetopics">
                <div className="clx-sidetopics-title">Explore related topics</div>
                <div className="clx-sidepills">
                  {deal.category && (<a className="clx-sidepill" href={`/categories/${slugifyCategory(deal.category)}`}>{deal.category}</a>)}
                  {deal.subcategory && deal.subcategory !== deal.category && (<a className="clx-sidepill" href={`/topics/${slugifyTopic(deal.subcategory)}`}>{deal.subcategory}</a>)}
                </div>
              </div>
              <p>
                <button type="button" onClick={() => setReportOpen(true)} className="clx-report-btn" aria-haspopup="dialog">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                  Report
                </button>
              </p>
            </div>
          </aside>

          <div className="clx-main">
            {/* ── Is this coupon worth it? Full verdict: meta + analysis + curriculum + prereqs + urgency + pros/cons ── */}
            <section aria-labelledby="worth-it-heading">
              <h2 id="worth-it-heading">Is the {deal.title} Coupon Worth It?</h2>
              <div className="clx-worth-box">
                <div className="clx-worth-meta">
                  <span>Expert review by <strong>Andrew Derek</strong>, Lead Course Analyst at CoursesWyn</span>
                  <span>Updated {updatedShort}</span>
                </div>
                <div className="clx-worth-body">
                  <p>
                    Our verdict: <strong>worth it</strong> — as long as the <strong>{worthCat} skills</strong> on the syllabus match what you actually want to learn. The <strong>regular price</strong> for <em>{deal.title}</em> on {deal.provider || "Udemy"} is <strong>{formatMoney(originalPrice)}</strong>. With the <u>coupon code on this page</u>, that falls to {price === 0 ? (<><strong>free</strong> — $0.00 out of pocket</>) : (<><strong>{formatMoney(price)}</strong> — a saving of <strong>{formatMoney(savings)}</strong>, or <strong>{discountPct}% off</strong> the standard rate</>)}
                    {price > 0 && durHours > 0 && <> Spread across <strong>{durStr} of on-demand video</strong>, that works out to roughly <strong>{formatMoney(perHour)} per hour</strong> of content — cheaper than a single chapter of most printed {worthCat} textbooks.</>}
                  </p>
                  {learnHighlights.length > 0 && (
                    <p>
                      A cheap price means nothing if the material is thin — here the syllabus is organized around usable outcomes.{" "}
                      {instructorsList.length > 0 ? `${instructorsList.join(" and ")} ${instructorsList.length > 1 ? "walk" : "walks"} you through ` : "The course walks you through "}
                      {learnHighlights.map((item, i, arr) => {
                        const text = item.charAt(0).toLowerCase() + item.slice(1).replace(/\.+$/, "");
                        return i === arr.length - 1 ? `and ${text}` : text;
                      }).join(", ")}
                      {" — skills meant to be used, not just watched."}
                      {typeof deal.students === "number" ? ` It has already been taken by ${deal.students.toLocaleString()} students${typeof deal.rating === "number" ? ` and holds a ${deal.rating.toFixed(1)}-star average from verified reviews` : ""}, which suggests the content holds up once learners actually apply it.` : ""}
                    </p>
                  )}
                  {(reqHighlights.length > 0 || deal.duration || deal.language) && (
                    <p>
                      {reqHighlights.length > 0 ? (
                        beginnerFriendly ? (
                          <>Getting started is easy: {reqHighlights.join("; ")}. That keeps it realistic even when {worthCat} is new to you.</>
                        ) : (
                          <>Check the prerequisites before you commit: {reqHighlights.join("; ")}. Best suited to learners who already have footing in {worthCat}.</>
                        )
                      ) : (
                        <>No prerequisites are listed, so it stays approachable even when {worthCat} is new to you.</>
                      )}
                      {deal.duration && <> Plan for roughly {typeof deal.duration === "string" ? deal.duration : deal.duration} of on-demand video at your own pace.</>}
                      {deal.language && <> Lessons are delivered in {deal.language}.</>}
                    </p>
                  )}
                  {urgencyText && (
                    <p>
                      One timing note: this coupon will not stay live forever. {urgencyText} {deal.provider || "Udemy"} instructors can change or retire a code at any time, so if the math works for you, claim it sooner rather than later.
                    </p>
                  )}
                  <div className="clx-worth-grid">
                    <div className="clx-worth-pros">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Pros</h3>
                      <ul>
                        <li><span>✓</span>Confirmed{discountPct > 0 ? ` ${discountPct}%` : ""} price cut, checked by hand.</li>
                        {typeof deal.rating === "number" && (<li><span>✓</span>Strong learner feedback ({deal.rating.toFixed(1)} out of 5).</li>)}
                        {typeof deal.students === "number" && (<li><span>✓</span>Taken by {deal.students.toLocaleString()} students so far.</li>)}
                        <li><span>✓</span>Completion certificate plus lifetime access.</li>
                      </ul>
                    </div>
                    <div className="clx-worth-cons">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Cons</h3>
                      <ul>
                        {discountPct > 0 && (<li><span>!</span>The coupon can expire without warning — after that, expect something close to the standard {formatMoney(originalPrice)}.</li>)}
                        <li><span>!</span>Lifetime access depends on {deal.provider || "Udemy"} itself; platform policies can always change.</li>
                        {deal.duration && (<li><span>!</span>Set aside extra hours for exercises and quizzes beyond the {typeof deal.duration === "string" ? deal.duration : deal.duration} of video.</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {learnPoints.length > 0 && (
              <>
                <h2 id="learn-heading">What You&apos;ll Learn</h2>
                <p className="clx-sec-intro">Practical skills and outcomes you&apos;ll gain from {deal.title} — taken from the official {deal.provider || "Udemy"} syllabus{deal.category ? ` for ${deal.category} learners` : ""}.</p>
                <div className={!showAllLearn && needLearnToggle ? "clx-collapsed-learn" : undefined}>
                  {visibleLearn.map((point, idx) => (
                    <p key={idx}>{point.endsWith(".") ? point : point + "."}</p>
                  ))}
                </div>
                {needLearnToggle && (
                  <button onClick={() => setShowAllLearn(!showAllLearn)} className="clx-readmore" aria-expanded={showAllLearn}>
                    <span>{showAllLearn ? "See less" : "See all"}</span>
                    <span className="clx-arrow" aria-hidden="true">⌄</span>
                  </button>
                )}
              </>
            )}

            {reqPoints.length > 0 && (
              <>
                <h2 id="requirements-heading">Requirements</h2>
                <p className="clx-sec-intro">What you need before enrolling in {deal.title} — prerequisites as listed by the instructor on {deal.provider || "Udemy"}.</p>
                {reqPoints.map((req, idx) => (<p key={idx}>{req}</p>))}
              </>
            )}

            <h2 id="about-heading">Overview</h2>
            <p className="clx-sec-intro">The full official description of {deal.title} — curriculum, teaching approach, and everything included with this {deal.provider || "Udemy"} coupon.</p>
            <div className={overviewOpen ? "" : "clx-collapsed" } data-readmore={overviewOpen ? undefined : "true"}>
              <div ref={markdownRef} className="clx-prose" />
            </div>
              <button onClick={() => setOverviewOpen(!overviewOpen)} className="clx-readmore" aria-expanded={overviewOpen}>
                <span>{overviewOpen ? "Read Less" : "Read More"}</span>
                <span className="clx-arrow" aria-hidden="true">⌄</span>
              </button>
            <p className="clx-warningbox">
              <strong>Important:</strong> this coupon may not function properly in private/incognito browsing mode. Please use a standard browser window and consider temporarily disabling any ad blockers or VPN services.
            </p>

            <div className="clx-share">
              <span>Share:</span>
              <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(deal.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">𝕏</a>
              <a href={`https://www.facebook.com/sharer/sharer.php`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">f</a>
              <button onClick={copyLink}>{linkCopied ? "✓ Copied" : "Copy link"}</button>
            </div>

            {faqs.length > 0 && (
              <>
                <h2 id="faq-heading">Frequently Asked Questions</h2>
                <p>Common queries about this coupon, pricing, and enrollment. Answers reflect our last check on {updatedLong}.</p>
                <div className="clx-faqs">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="clx-faq">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                        aria-expanded={expandedFAQ === idx}
                        aria-controls={`faq-answer-${idx}`}
                        id={`faq-question-${idx}`}
                        className="clx-faq-q"
                      >
                        <span>{faq.q}</span>
                        <span aria-hidden="true" className={expandedFAQ === idx ? "clx-caret open" : "clx-caret"}>▼</span>
                      </button>
                      {expandedFAQ === idx && (
                        <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-question-${idx}`} className="clx-faq-a">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Related ── */}
        {related.length > 0 && (
          <>
            <h2 id="related-heading">You Might Also Like</h2>
            <hr className="clx-divider" />
            <div
              className="clx-carousel"
              ref={trackRef}
              onMouseEnter={() => { pauseRef.current = true; }}
              onMouseLeave={() => { pauseRef.current = false; }}
              onTouchStart={() => { pauseRef.current = true; }}
              onTouchEnd={() => { pauseRef.current = false; }}
            >
              <div className="clx-track">
              {shownRelated.map((r) => {
                const rp = typeof r.price === "number" ? r.price : 0;
                const ro = typeof r.originalPrice === "number" && r.originalPrice > rp ? r.originalPrice : rp;
                const rd = ro > rp && rp >= 0 ? Math.round(100 - (rp / ro) * 100) : 0;
                return (
                  <a key={r.slug} href={`/coupon/${r.slug}`} className="clx-card" data-card>
                    <span className="clx-card-media">
                      {r.image && (<img src={r.image} alt={r.title} width="400" height="205" loading="lazy" />)}
                      <span className="clx-card-flag">🏷 {rd > 0 ? `${rd}% OFF` : "Free"}</span>
                    </span>
                    <span className="clx-card-provider"><ProviderLogo name={r.provider} height={24} /></span>
                    <span className="clx-card-title">{r.title}</span>
                    <span className="clx-card-cert">🎓 {typeof r.rating === "number" ? `${r.rating.toFixed(1)} rated` : "Certificate"} · {formatMoney(rp)}</span>
                    <span className="clx-card-meta">▅ {r.subcategory || r.category || "Course"}</span>
                  </a>
                );
              })}
              </div>
            </div>

            {/* ── Subscribe banner ── */}
            <div className="clx-banner">
              <div className="clx-banner-left">
                <span className="clx-banner-label"><span className="clx-banner-dot" />Free · Weekly</span>
                <h3 className="clx-banner-heading">Enjoyed this? Get more<br /><em>worth reading.</em></h3>
                <p className="clx-banner-sub">Fresh verified coupons &amp; course deals — straight to your inbox.</p>
              </div>
              <div className="clx-banner-right">
                {!nlDone ? (
                  <>
                    <div className="clx-banner-row">
                      <input
                        className="clx-nl-email"
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-label="Email address"
                        value={nlEmail}
                        onChange={(e) => setNlEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") nlSubmit(); }}
                      />
                      <button className="clx-nl-submit" type="button" onClick={nlSubmit}>Subscribe →</button>
                    </div>
                    {nlError ? <p className="clx-nl-error">{nlError}</p> : null}
                    <p className="clx-nl-trust">By subscribing you agree to our <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. Unsubscribe anytime.</p>
                  </>
                ) : (
                  <div className="clx-nl-success">
                    <span className="clx-nl-ok" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F2C94C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <div><strong>You&apos;re in.</strong><p>Fresh coupons land soon. Welcome.</p></div>
                  </div>
                )}
              </div>
            </div>

          </>
        )}

        <p className="clx-affiliate">We may earn a commission when you purchase through our links. <a href="/affiliate-disclosure">Learn more</a></p>
      </div>

      {/* Sticky mobile claim */}
      <div className="clx-stickybar" aria-label="Claim this coupon">
        <div className="clx-stickybar-main">
          <div className="clx-stickybar-price">{price === 0 ? "Free" : `$${price.toFixed(2)}`}{discountPct > 0 && <span> · {discountPct}% off</span>}</div>
          <div className="clx-stickybar-sub">Checked {deal.updatedAt ? timeAgo(deal.updatedAt) : "recently"}</div>
        </div>
        <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="clx-enroll clx-stickybar-cta" aria-label={`Claim coupon for ${deal.title}`}>
          <span className="clx-enroll-text">Claim Coupon</span>
        </a>
      </div>

      {/* Quick Note modal persis courselegend */}
      {qnOpen && (
        <div className="clx-overlay" onClick={() => setQnOpen(false)}>
          <div className="clx-modal" role="dialog" aria-modal="true" aria-labelledby="clx-qn-heading" onClick={(e) => e.stopPropagation()}>
            <div className="clx-stripe" aria-hidden="true" />
            <button className="clx-close" onClick={() => setQnOpen(false)} aria-label="Close">
              <svg viewBox="0 0 12 12" width="14" height="14" fill="none"><line x1="1" y1="1" x2="11" y2="11" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" /><line x1="11" y1="1" x2="1" y2="11" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </button>
            <div className="clx-inner">
              <p className="clx-label">Quick Note</p>
              <p className="clx-qn-heading" id="clx-qn-heading">How CoursesWyn Works</p>
              <p className="clx-body-text">We&apos;re not a course marketplace. Every coupon is hand-checked for validity before listing — ratings and enrolments are {deal.provider || "Udemy"}&apos;s own figures, not our review. Not popularity. Not commission rates.</p>
              <div className="clx-divider-sm" aria-hidden="true" />
              <div className="clx-disclosure">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#9b8f82" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="8.5" /><line x1="10" y1="9" x2="10" y2="14" /><circle cx="10" cy="6.5" r="0.9" fill="#9b8f82" stroke="none" /></svg>
                <p>Some links are affiliate links. This never influences which coupons we feature or how we rank them.</p>
              </div>
              <div className="clx-footer">
                <a href="/udemy-coupons-guide" className="clx-link" target="_blank" rel="noopener noreferrer">
                  How Site Works
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#5a4fcf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5 7" /></svg>
                </a>
                <a href="#faq-heading" className="clx-link" onClick={() => setQnOpen(false)}>
                  FAQs
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#5a4fcf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5 7" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal persis courselegend */}
      {reportOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="clx-report-title" className="clx-report-overlay" onClick={() => setReportOpen(false)}>
          <div className="clx-report-dialog" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReportOpen(false)} aria-label="Close" className="clx-report-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <div className="clx-report-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
              <h2 id="clx-report-title">Report This Coupon</h2>
            </div>
            <p className="clx-report-sub">What&apos;s the issue with this coupon?</p>
            <div className="clx-report-categories" role="radiogroup" aria-label="Report reason">
              {["Coupon expired", "Wrong price at checkout", "Broken Udemy link", "Wrong course details", "Inappropriate or misleading content", "Other issue"].map((opt) => (
                <label key={opt} className={reportReason === opt ? "clx-report-option selected" : "clx-report-option"}>
                  <input type="radio" name="report-reason" checked={reportReason === opt} onChange={() => setReportReason(opt)} />
                  <span className="clx-report-option-label">{opt}</span>
                  <svg className="clx-report-option-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                </label>
              ))}
            </div>
            <div className="clx-report-detail">
              <label className="clx-report-detail-label" htmlFor="clx-report-text">Additional details (optional)</label>
              <textarea id="clx-report-text" rows={3} value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} placeholder="Add any extra context…" />
            </div>
            <div className="clx-report-actions">
              <a href={reportHref} className="clx-report-submit">Submit Report</a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .clx { background: #ffffff; color: #333333; font-size: 17px; line-height: 1.7; font-family: sans-serif; min-height: 100vh; padding-bottom: 3rem; box-sizing: border-box; }
        .clx [id] { scroll-margin-top: 80px; }
        .clx-wrap { max-width: 1140px; width: 100%; margin: 0 auto; padding: 0 1rem; box-sizing: border-box; }
        .clx h1, .clx h2, .clx h3 { font-family: sans-serif; border: none; background: none; padding: 0; }
        .clx-crumb { white-space: nowrap; overflow-x: auto; scrollbar-width: none; padding: 1rem 0; margin-bottom: 0; }
        .clx-crumb::-webkit-scrollbar { display: none; }
        .clx-crumb p { margin: 0; white-space: nowrap; font-size: 15px; color: #555555; }
        .clx-crumb a { color: #3C85DA; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
        .clx-hero { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: flex-start; }
        .clx-media { flex: 0 1 380px; min-width: 0; }
        .clx-poster { width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; display: block; }
        .clx-enroll { display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #3C85DA 0%, #5D61DC 100%); color: #fff; font-family: sans-serif; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid rgba(255,255,255,0.2); border-radius: 7px; padding: 17px 17px 16px 14px; margin-top: 14px; cursor: pointer; text-decoration: none; text-align: center; }
        .clx-enroll:hover { filter: brightness(1.07); }
        .clx-enroll-text { flex: 1; }
        .clx-enroll-icon { display: inline-flex; flex-shrink: 0; }
        .clx-info { flex: 1 1 420px; min-width: 0; }
        .clx-provider { display: block; margin-bottom: 14px; line-height: 1; }
        .clx-provider-fallback { font-size: 28px; font-weight: 800; color: #111111; line-height: 1; }
        .clx-card-provider .clx-provider-fallback { font-size: 20px; }
        .clx-h1 { font-size: 37px; font-weight: 700; text-transform: capitalize; line-height: 48px; color: #000000; margin: 0; }
        .clx-desc { font-size: 17px; line-height: 1.6; color: #444444; margin: 0.75rem 0 0; max-width: 800px; }
        .clx-taught { font-family: sans-serif; font-size: 18px; font-weight: 400; text-transform: capitalize; color: #1E1E82; margin: 10px 5px 10px 0; }
        .clx-taught a { color: inherit; font-weight: 600; }
        .clx-qmark { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #1E1E82; background: #fff; color: #1E1E82; cursor: pointer; vertical-align: middle; margin-left: 6px; font-family: inherit; padding: 0; }
        .clx-qmark:hover { background: #1E1E82; }
        .clx-qmark:hover .clx-qmark-text { color: #fff; }
        .clx-qmark-text { font-size: 13px; font-weight: 700; line-height: 1; }
        .clx-pills { display: flex; gap: 10px; flex-wrap: wrap; padding: 5px 0 10px 0; }
        .clx-pill { background: #2B262B12; padding: 3px 10px 2px 10px; border-radius: 5px; font-family: sans-serif; font-size: 15px; font-weight: 500; color: #000000; }
        .clx-pill-link { background: #2B262B05; border: 1px solid #0201011A; }
        .clx-provider-img { object-fit: contain; display: block; }
        .clx-pill a { color: inherit; }
        .clx-pill-link a { color: #292EC9; font-weight: 700; }
        .clx a:hover:not(.clx-enroll):not(.clx-report-submit):not(.clx-nl-submit):not(.clx-sidepill) { color: #7c3aed; }
        .clx-card:hover .clx-card-title { color: #3C85DA; text-decoration: underline; }
        .clx-ratingrow { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 0 0 10px 0; }
        .clx-stars { display: inline-flex; gap: 3px; line-height: 1; vertical-align: middle; }
        .clx-star { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #4b5563; border-radius: 5px; line-height: 1; overflow: hidden; }
        .clx-star-fill { position: absolute; left: 0; top: 0; bottom: 0; overflow: hidden; background: #111111; display: flex; align-items: center; }
        .clx-star-fill svg { display: block; flex: none; margin-left: 5px; }
        .clx-star > svg { display: block; }
        .clx-ratingbadge { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; color: #000000; font-weight: 500; }
        .clx-rating-number { font-weight: 700; }
        .clx-rating-reviews { color: #555555; }
        .clx-info-tip { position: relative; display: inline-flex; color: #777777; cursor: help; }
        .clx-tooltip { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); white-space: nowrap; background: #111111; color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 4px; z-index: 20; }
        .clx-info-tip:hover .clx-tooltip, .clx-info-tip:focus .clx-tooltip { display: block; }
        .clx-price { margin: 0 0 0.5rem 0; }
        .clx-price strong { color: #111111; }
        .clx-checked { font-size: 15px; color: #555555; margin: 0 0 1rem 0; }
        .clx-checked code { padding: 1px 5px; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 0.875em; font-family: Consolas, Monaco, monospace; color: #c7254e; }
        .clx-timer { display: flex; align-items: center; gap: 8px; margin: 0 0 1rem 0; flex-wrap: wrap; }
        .clx-timer-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #555555; margin-right: 2px; }
        .clx-tbox { display: inline-flex; flex-direction: column; align-items: center; min-width: 52px; background: #e8f4fd; border: 1px solid #3C85DA; border-radius: 6px; padding: 6px 8px 5px 8px; }
        .clx-tbox strong { font-size: 1.15rem; font-weight: 800; color: #3C85DA; line-height: 1; font-variant-numeric: tabular-nums; }
        .clx-tbox small { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #777777; }
        .clx-coderow { display: inline-flex; align-items: center; gap: 0; margin: 0 0 1rem 0; border: 1px dashed #3C85DA; border-radius: 6px; overflow: hidden; background: #fff; }
        .clx-coderow code { font-size: 0.95rem; font-weight: 800; letter-spacing: 1.5px; color: #111111; font-family: Consolas, Monaco, monospace; padding: 8px 14px; }
        .clx-coderow button { background: linear-gradient(135deg, #3C85DA 0%, #5D61DC 100%); color: #fff; border: none; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; align-self: stretch; }
        .clx-coderow button:hover { background: #5D61DC; }
        .clx-cols { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: flex-start; margin-top: 1.5rem; }
        .clx-takeaways { background: #fff; border: 1px solid #e5e5e5; border-radius: 14px; padding: 1.25rem 1.5rem; margin-top: 1.5rem; }
        .clx-takeaways-title { font-size: 1.15rem; font-weight: 800; color: #111111; margin: 0 0 0.75rem; }
        .clx-takeaways ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.6rem 1.5rem; }
        .clx-takeaways li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.9rem; color: #333333; line-height: 1.6; }
        .clx-takeaways li > span:first-child { color: #16a34a; font-weight: 800; flex-shrink: 0; }
        .clx-takeaways strong { color: #111111; }
        .clx-tk-intro { font-size: 0.88rem; color: #555555; margin: 0 0 1rem; line-height: 1.6; }
        .clx-worth-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .clx-worth-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border); font-size: 0.8rem; color: var(--muted); }
        .clx-worth-meta strong { color: var(--text); }
        .clx-worth-body { padding: 1.5rem; }
        .clx-worth-body > p { font-size: 0.95rem; color: var(--text); line-height: 1.75; margin: 0 0 1.25rem 0; }
        .clx-worth-body > p:last-child { margin-bottom: 0; }
        .clx-worth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.25rem; }
        @media (max-width: 640px) { .clx-worth-grid { grid-template-columns: 1fr; } }
        .clx-worth-pros, .clx-worth-cons { border-radius: 10px; padding: 1rem 1.15rem; }
        .clx-worth-pros { background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.18); }
        .clx-worth-cons { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.18); }
        .clx-worth-pros h3, .clx-worth-cons h3 { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.6rem 0; display: flex; align-items: center; gap: 0.4rem; }
        .clx-worth-pros h3 { color: var(--brand); }
        .clx-worth-cons h3 { color: #dc2626; }
        .clx-worth-pros ul, .clx-worth-cons ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
        .clx-worth-pros li, .clx-worth-cons li { padding: 3px 0; display: flex; gap: 8px; font-size: 0.85rem; line-height: 1.6; color: var(--text); }
        .clx-worth-pros li > span { color: var(--brand); font-weight: 800; flex-shrink: 0; }
        .clx-worth-cons li > span { color: #dc2626; font-weight: 800; flex-shrink: 0; }
        .clx-tk-grid { display: flex; flex-direction: column; margin: 0; padding: 0; background: transparent; border: none; border-radius: 0; }
        .clx-tk-grid > div { display: grid; grid-template-columns: 170px 1fr; gap: 12px; padding: 0.65rem 0; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
        .clx-tk-grid > div:last-child { border-bottom: none; }
        .clx-tk-grid dt { color: #666666; font-weight: 600; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; padding-top: 3px; }
        .clx-tk-grid dd { margin: 0; color: #111111; font-weight: 500; line-height: 1.6; }
        .clx-sec-intro { font-size: 0.9rem; color: #555555; line-height: 1.65; margin: 0 0 1rem; max-width: 720px; }
        @media (max-width: 560px) { .clx-tk-grid > div { grid-template-columns: 1fr; gap: 2px; } }
        .clx-side { flex: 0 1 300px; min-width: 0; position: sticky; top: 15px; }
        .clx-sidecard { border: 1px solid #D9D9D9; border-radius: 10px; padding: 15px; background: #fff; }
        .clx-side-h2 { font-size: 22px; font-weight: 700; color: #111111; margin: 0 0 0.75rem 0; }
        .clx-iconbox { display: flex; gap: 11px; align-items: start; margin-bottom: 0.9rem; }
        .clx-iconbox-title { font-family: sans-serif; font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #111111; }
        .clx-iconbox-desc { font-size: 15px; color: #555555; margin: 2px 0 0 0; }
        .clx-providerline { display: flex; align-items: center; gap: 12px; margin: 0.2rem 0 0.6rem 0; flex-wrap: wrap; }
        .clx-pl-item { display: inline-flex; align-items: center; gap: 7px; font-size: 17px; font-weight: 700; color: #292EC9; }
        .clx-pl-sep { width: 1px; align-self: stretch; background: #e0e0e0; }
        .clx-side-hr { border: none; height: 1px; background: #ebebeb; margin: 0 0 0.6rem 0; }
        .clx-gicon { display: inline-flex; align-items: center; justify-content: center; width: 22px; color: #6b7280; font-size: 15px; flex-shrink: 0; }
        .clx-guarantee, .clx-guarantee span { color: #16a34a; }
        .clx-guarantee .clx-gicon { background: transparent; color: #16a34a; width: auto; height: auto; }
        .clx-guarantee strong { color: #16a34a; }
        .clx-sidetopics { margin-top: 1.1rem; }
        .clx-sidetopics-title { font-size: 16px; font-weight: 700; color: #111111; margin-bottom: 0.6rem; }
        .clx-sidepills { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1rem; }
        .clx-sidepill { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 8px 16px; font-size: 15px; font-weight: 600; color: #1f2937; text-decoration: none; }
        .clx-sidepill:hover { border-color: #3C85DA; color: #3C85DA; }
        .clx-postinfo { list-style: none; margin: 0; padding: 0; }
        .clx-postinfo li { display: flex; gap: 10px; align-items: center; font-size: 17px; font-weight: 600; color: #111111; margin-bottom: 0.55rem; }
        .clx-main { flex: 1 1 420px; min-width: 0; }
        .clx-mobile-h2 { font-size: 1.375rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #111111; }
        .clx-main > p { margin: 0 0 1rem 0; color: #444444; }
        .clx-main h2 { font-size: 1.75rem; font-weight: 800; margin: 2rem 0 0.75rem 0; color: #111111; line-height: 1.25; }
        .clx-main a { color: #3C85DA; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
        .clx-main a:hover { color: #7c3aed; }
        .clx-tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 0.5rem 0; }
        .clx-tag { color: #3C85DA; font-weight: 700; }
        .clx-report-btn { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #e53e3e; color: #e53e3e; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-family: inherit; cursor: pointer; line-height: 1.4; }
        .clx-report-btn:hover { background: #e53e3e; color: #fff; }
        .clx-collapsed-learn { max-height: 150px; overflow: hidden; position: relative; }
        .clx-collapsed-learn::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(237,237,237,0.8), #ededed); pointer-events: none; }
        .clx-main [data-readmore] { position: relative; }
        .clx-main [data-readmore="true"] { max-height: 260px; overflow: hidden; }
        .clx-main [data-readmore="true"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(237,237,237,0.8), #ededed); pointer-events: none; }
        .clx-readmore { background: none; border: none; padding: 0; color: #3C85DA; font-weight: 700; cursor: pointer; font-size: 16px; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
        .clx-readmore:hover { color: #7c3aed; }
        .clx-arrow { font-size: 14px; }
        .clx-prose { line-height: 1.7; color: #444444; }
        .clx-prose p { margin: 0 0 1rem 0; }
        .clx-prose ul, .clx-prose ol { margin: 0.875rem 0; padding-left: 1.5rem; list-style-position: outside; }
        .clx-prose ul { list-style-type: disc; }
        .clx-prose ol { list-style-type: decimal; }
        .clx-prose li { margin-bottom: 0.35rem; }
        .clx-prose a { color: #3C85DA; font-weight: 700; }
        .clx-prose strong { color: #111111; }
        .clx-warningbox { background: #fff8e1; border-left: 4px solid #ffc107; border-radius: 0 5px 5px 0; padding: 0.75rem 1.125rem; font-size: 15px; line-height: 1.6; color: #555555; margin: 1.25rem 0; }
        .clx-share { display: flex; gap: 10px; align-items: center; margin-top: 1.5rem; font-weight: 700; color: #111111; }
        .clx-share a, .clx-share button { border: 1px solid #e0e0e0; background: #fff; border-radius: 4px; padding: 5px 12px; font-size: 13px; font-weight: 700; color: #3C85DA; cursor: pointer; text-decoration: none; font-family: inherit; }
        .clx-faqs { display: flex; flex-direction: column; gap: 0.75rem; }
        .clx-faq { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; background: #fff; }
        .clx-faq-q { width: 100%; padding: 1rem 1.25rem; background: none; border: none; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; font-weight: 700; color: #111111; gap: 1rem; font-family: inherit; }
        .clx-caret { transition: transform 0.2s; flex-shrink: 0; color: #3C85DA; }
        .clx-caret.open { transform: rotate(180deg); }
        .clx-faq-a { padding: 0 1.25rem 1rem 1.25rem; }
        .clx-faq-a p { color: #444444; line-height: 1.65; font-size: 16px; margin: 0; border-top: 1px dashed #e0e0e0; padding-top: 0.9rem; }
        .clx-divider { border: none; height: 1px; background: #e5e5e5; margin: 0 0 1.5rem 0; }
        .clx-carousel { overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding-bottom: 4px; }
        .clx-carousel::-webkit-scrollbar { display: none; }
        .clx-track { display: flex; gap: 1.25rem; }
        .clx-track .clx-card { flex: 0 0 calc(33.333% - 0.85rem); min-width: 0; scroll-snap-align: start; }
        .clx-ctas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-top: 2.5rem; }
        .clx-cta { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.75rem 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; }
        .clx-cta-title { font-size: 1.3rem; font-weight: 700; color: #111111; margin: 0; line-height: 1.3; }
        .clx-cta-btn { width: auto; margin-top: 0; }
        .clx-banner { font-family: system-ui, sans-serif; background: #3D28E8; border-radius: 20px; padding: 36px 40px; color: #fff; display: flex; align-items: center; gap: 40px; width: 100%; box-sizing: border-box; position: relative; overflow: hidden; margin-top: 2.5rem; }
        .clx-banner::before { content: ''; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px; background: radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 65%); pointer-events: none; }
        .clx-banner-left { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .clx-banner-label { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); border-radius: 100px; padding: 3px 11px 3px 8px; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 12px; }
        .clx-banner-dot { width: 6px; height: 6px; border-radius: 50%; background: #F2C94C; flex-shrink: 0; }
        .clx-banner-heading { font-family: system-ui, sans-serif; font-size: clamp(18px, 2.2vw, 24px); font-weight: 900; line-height: 1.2; letter-spacing: -.025em; color: #fff; margin: 0 0 8px; padding: 0; }
        .clx-banner-heading em { font-style: normal; color: #F2C94C; }
        .clx-banner-sub { font-size: 14px; font-weight: 400; line-height: 1.6; color: rgba(255,255,255,.8); margin: 0; padding: 0; }
        .clx-banner-right { flex: 0 0 380px; max-width: 100%; position: relative; z-index: 1; }
        .clx-banner-row { display: flex; gap: 8px; }
        .clx-nl-email { flex: 1; min-width: 0; padding: 13px 16px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 500; color: #1a1040; background: #fff; border: 2px solid transparent; border-radius: 11px; outline: none; }
        .clx-nl-email::placeholder { color: #a09cbe; }
        .clx-nl-email:focus { border-color: #F2C94C; box-shadow: 0 0 0 3px rgba(242,201,76,.2); }
        .clx-nl-submit { padding: 13px 22px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 800; color: #2E1FBE; background: #fff; border: none; border-radius: 11px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .clx-nl-submit:hover { background: #F2C94C; color: #1a1040; }
        .clx-nl-trust { font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.55); margin: 8px 0 0 0; padding: 0; }
        .clx-nl-trust a { color: rgba(255,255,255,.7); text-decoration: underline; }
        .clx-nl-error { font-size: 12.5px; font-weight: 600; color: #ffb3b3; background: rgba(255,50,50,.18); border: 1px solid rgba(255,80,80,.22); border-radius: 8px; padding: 8px 12px; text-align: center; margin: 8px 0 0 0; }
        .clx-nl-success { display: flex; align-items: center; gap: 14px; text-align: left; padding: 4px 0; }
        .clx-nl-ok { width: 44px; height: 44px; border-radius: 12px; background: rgba(242,201,76,.18); border: 1px solid rgba(242,201,76,.35); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .clx-nl-success strong { display: block; font-family: sans-serif; font-size: 16px; font-weight: 900; color: #fff; margin-bottom: 3px; }
        .clx-nl-success p { font-size: 13px; color: rgba(255,255,255,.75); margin: 0; padding: 0; line-height: 1.5; }
        .clx-card { border-radius: 10px; padding: 10px; background: #ffffff; border: 1px solid #e0e0e0; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: flex; flex-direction: column; text-decoration: none; transition: transform 0.2s ease; }
        .clx-card:hover { transform: translateY(-5px); }
        .clx-card-media { position: relative; display: block; }
        .clx-card-media img { width: 100%; height: 205px; object-fit: cover; border-radius: 7px; display: block; }
        .clx-card-flag { position: absolute; left: 0; bottom: 10px; background: #040803DE; color: #D4D7CE; font-size: 13px; font-weight: 500; letter-spacing: 0.3px; padding: 3px 10px 2px 10px; border-radius: 0 4px 0 4px; }
        .clx-card-provider { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; color: #111111; margin-top: 10px; font-family: sans-serif; }
        .clx-card-title { font-size: 20px; font-weight: 700; line-height: 1.4; color: #111111; margin: 2px 0 6px 0; }
        .clx-card-cert { display: inline-block; background: #75DC5D1F; color: #222B10; font-size: 13px; font-weight: 500; padding: 0 10px; border-radius: 4px; width: fit-content; }
        .clx-card-meta { display: inline-block; background: #2323261A; color: #1F1F30; font-size: 14px; font-weight: 500; padding: 3px 8px; border-radius: 8px; width: fit-content; margin-top: 6px; }
        .clx-affiliate { font-size: 13px; color: #777777; margin-top: 1.5rem; }
        .clx-affiliate a { color: #3C85DA; font-weight: 700; }
        .clx-stickybar { display: none; }
        .clx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
        .clx-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 460px; position: relative; box-shadow: 0 16px 48px rgba(0,0,0,0.18); overflow: hidden; padding: 2rem; box-sizing: border-box; }
        .clx-stripe { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #3C85DA, #5D61DC); }
        .clx-close { position: absolute; top: 14px; right: 14px; background: none; border: none; cursor: pointer; color: #aaa; padding: 5px; border-radius: 6px; display: flex; line-height: 1; }
        .clx-close:hover { color: #111; background: #f0f0f0; }
        .clx-modal-title { color: #111111; font-size: 1.3rem; font-weight: 700; margin: 0 0 0.5rem 0; text-align: center; }
        .clx-modal-sub { color: #555555; font-size: 0.9rem; text-align: center; margin: 0 0 1.25rem 0; }
        .clx-codebox { background: #e8f4fd; border: 1px dashed #3C85DA; padding: 1rem; border-radius: 6px; margin-bottom: 1.25rem; text-align: center; }
        .clx-codebox p { color: #3C85DA; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 6px 0; font-weight: 700; }
        .clx-codebox code { display: block; font-size: 1.15rem; font-weight: 800; color: #111111; letter-spacing: 1px; }
        .clx-modal-actions { display: flex; gap: 0.75rem; flex-direction: column; }
        .clx-modal-actions .clx-enroll { margin-top: 0; text-align: center; }
        .clx-soft { background: #e8f4fd; color: #3C85DA; border: 1px solid #3C85DA; }
        .clx-inner { padding-top: 0.5rem; }
        .clx-label { font-size: 14px; font-weight: 700; color: #777777; margin: 0; text-transform: uppercase; letter-spacing: 0.6px; }
        .clx-qn-heading { font-size: 22px; font-weight: 800; color: #111111; margin: 2px 0 0.6rem 0; }
        .clx-body-text { font-size: 16px; color: #444444; line-height: 1.65; margin: 0 0 1rem 0; }
        .clx-divider-sm { height: 1px; background: #f0f0f0; margin: 0 0 1rem 0; }
        .clx-disclosure { display: flex; gap: 10px; align-items: flex-start; margin: 0 0 1.1rem 0; }
        .clx-disclosure p { font-size: 14px; color: #555555; margin: 0; line-height: 1.6; }
        .clx-footer { display: flex; gap: 18px; }
        .clx-link { display: inline-flex; align-items: center; gap: 5px; color: #5a4fcf; font-weight: 700; font-size: 14px; text-decoration: none; }
        .clx-link:hover { text-decoration: underline; }
        .clx-report-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
        .clx-report-dialog { background: #fff; border-radius: 12px; width: 100%; max-width: 460px; position: relative; box-shadow: 0 16px 48px rgba(0,0,0,0.18); overflow: hidden; }
        .clx-report-close { position: absolute; top: 14px; right: 14px; background: none; border: none; cursor: pointer; color: #aaa; padding: 5px; border-radius: 6px; display: flex; line-height: 1; }
        .clx-report-close:hover { color: #111; background: #f0f0f0; }
        .clx-report-header { display: flex; align-items: center; gap: 10px; padding: 22px 24px 0; color: #e53e3e; }
        .clx-report-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #e53e3e; }
        .clx-report-sub { margin: 6px 24px 14px; font-size: 13px; color: #666; }
        .clx-report-categories { border-top: 1px solid #f0f0f0; }
        .clx-report-option { display: flex; align-items: center; padding: 13px 24px; cursor: pointer; border-bottom: 1px solid #f5f5f5; position: relative; }
        .clx-report-option:hover { background: #fff5f5; }
        .clx-report-option input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
        .clx-report-option-label { flex: 1; font-size: 14px; color: #222; }
        .clx-report-option-arrow { color: #bbb; flex-shrink: 0; }
        .clx-report-option.selected { background: #fff5f5; }
        .clx-report-option.selected .clx-report-option-label { color: #e53e3e; font-weight: 600; }
        .clx-report-detail { padding: 14px 24px 0; }
        .clx-report-detail-label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; }
        .clx-report-detail textarea { width: 100%; box-sizing: border-box; border: 1px solid #e5e5e5; border-radius: 6px; padding: 9px 11px; font-size: 13px; font-family: inherit; resize: none; color: #222; display: block; }
        .clx-report-actions { padding: 14px 24px 22px; }
        .clx-report-submit { display: block; width: 100%; box-sizing: border-box; background: #e53e3e; color: #fff; padding: 11px; border-radius: 6px; font-size: 14px; font-weight: 600; text-align: center; text-decoration: none; }
        .clx-report-submit:hover { background: #c53030; }
        .clx-side-h2, .clx-mobile-h2 { display: none; }
        @media (max-width: 767px) {
          .clx-side-h2, .clx-mobile-h2 { display: block; }
        }
        @media (max-width: 1024px) {
          .clx-track .clx-card { flex-basis: calc(50% - 0.65rem); }
          .clx-banner { flex-direction: column; padding: 28px 24px; gap: 24px; border-radius: 16px; }
          .clx-banner-right { flex: none; width: 100%; }
        }
        @media (max-width: 767px) {
          .clx-track .clx-card { flex-basis: 82%; }
          .clx-ctas { grid-template-columns: 1fr; }
          .clx-banner-row { flex-direction: column; }
          .clx-banner-row .clx-nl-submit { width: 100%; }
          .clx-hero { flex-direction: column; }
          .clx-media { flex: none; width: 100%; }
          .clx-enroll-desktop { display: none; }
          .clx-h1 { font-size: 1.75rem; line-height: 1.2; }
          .clx-main h2 { font-size: 1.375rem; }
          .clx-side { position: static; flex: none; width: 100%; }
          .clx-grid { grid-template-columns: 1fr; }
          .clx-cols { flex-direction: column; }
        }
        @media (max-width: 900px) {
          .clx { padding-bottom: 84px; }
          .clx-stickybar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 9000; align-items: center; gap: 0.8rem; background: #fff; border-top: 1px solid #e0e0e0; padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom)); box-shadow: 0 -8px 24px rgba(0,0,0,0.12); }
          .clx-stickybar-main { flex: 1; min-width: 0; }
          .clx-stickybar-price { font-weight: 800; color: #111111; font-size: 0.95rem; }
          .clx-stickybar-price span { font-weight: 600; color: #3C85DA; font-size: 0.78rem; }
          .clx-stickybar-sub { font-size: 0.72rem; color: #777777; }
          .clx-stickybar-cta { width: auto; margin-top: 0; }
        }
      `}</style>
    </div>
  );
}

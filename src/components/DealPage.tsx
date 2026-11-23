"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Deal } from "@/types/deal";
import { slugifyCategory, slugifyTopic } from "@/lib/utils";
import { parseInstructors, createInstructorSlug } from "@/lib/instructors";
import { buildCouponFAQs, formatDuration, formatMoney, isDealExpired } from "@/lib/dealStats";
import { buildCouponDetails, buildKeyTakeaways, buildHowToSteps, hasCertificate } from "@/lib/couponSections";
import { renderMarkdownToHtml } from "@/lib/markdown";

interface Props {
  deal: Deal;
  relatedDeals?: Deal[];
  catStats?: unknown;
  instructorImage?: string;
  instructorImages?: Record<string, string>;
  couponMask?: string;
  /** Kode coupon asli — dipakai tombol Copy. Tampilan tetap tersembunyi (couponMask). */
  couponCode?: string;
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

function UdemyLogo({ height = 28, loading = "lazy" }: { height?: number; loading?: "lazy" | "eager" }) {
  const width = Math.round((height * 250) / 94);
  return (
    <img src="/providers/udemy-white.svg" alt="Udemy" height={height} width={width} loading={loading} fetchPriority={loading === "eager" ? "high" : undefined} className="clx-provider-img" />
  );
}

function ProviderLogo({ name, height = 28, loading = "lazy" }: { name?: string; height?: number; loading?: "lazy" | "eager" }) {
  if ((name || "").trim().toLowerCase() === "udemy") return <UdemyLogo height={height} loading={loading} />;
  return <span className="clx-provider-fallback">{name}</span>;
}

function MedalIcon() {
  return (
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#f2f4f6" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="M12 6.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.6l2-.3z" fill="#0a0b0d" stroke="none" />
      <path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#A9C7FF" aria-hidden="true">
      <path d="M3 7l4 4 5-6 5 6 4-4-1.5 11h-15L3 7zm0 13h18v2H3v-2z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 1l2.4 2.1 3.1-.5 1.1 3 3 1.1-.5 3.1L23 12l-2.1 2.4.5 3.1-3 1.1-1.1 3-3.1-.5L12 23l-2.4-2.1-3.1.5-1.1-3-3-1.1.5-3.1L1 12l2.1-2.4-.5-3.1 3-1.1 1.1-3 3.1.5z" fill="#A9C7FF" />
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

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="clx-checklist">
      {items.map((item, idx) => (
        <li key={idx}>
          <span className="clx-check-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DealPage({ deal, relatedDeals = [], instructorImages = {}, couponMask, couponCode = "" }: Props) {
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Coupon expired");
  const [reportDetail, setReportDetail] = useState("");
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

  const masked = couponMask || "AUTO-APPLY";

  // ── SEO sections: coupon overview, key takeaways, how-to redeem ──
  const dealExpired = isDealExpired(deal);
  const couponDetails = useMemo(() => buildCouponDetails(deal), [deal]);
  const keyTakeaways = useMemo(() => buildKeyTakeaways(deal), [deal]);
  const howToSteps = useMemo(() => buildHowToSteps(deal), [deal]);

  const priceText = price === 0 ? "Free" : formatMoney(price);
  const originalText = formatMoney(originalPrice);
  const expiresLong = deal.expiresAt ? fmtDate(deal.expiresAt) : null;
  const topicName = (deal.subcategory || "").trim();
  const audiencePhrase = /^all\s*levels?$/i.test(levelLabel)
    ? "suitable for learners at every level"
    : `suitable for ${levelLabel.toLowerCase()} learners`;
  const courseArticle = /^[aeiou]/i.test(worthCat) ? "an" : "a";
  const instructorHref = instructorsList.length ? `/instructor/${createInstructorSlug(instructorsList[0])}` : null;

  // Inline CTA: keyword-rich anchor ("{title} coupon code") + price/scarcity line.
  // Judul ditampilkan utuh (tanpa elipsis) — teks potong terlihat aneh dan
  // mengurangi nilai SEO dari anchor teks ini.
  const ctaTitle = (deal.title || "").trim();
  const ctaSub = [
    price === 0
      ? `Free with coupon${originalPrice > price ? ` (list ${formatMoney(originalPrice)})` : ""}`
      : `$${price.toFixed(2)} with coupon`,
    ...(price > 0 && discountPct > 0 ? [`${discountPct}% off`] : []),
    `verified ${updatedShort}`,
    ...(dealExpired ? ["recorded end date has passed"] : expiresLong ? [`ends ${expiresLong}`] : []),
  ].join(" · ");

  const tocLinks = [
    { id: "coupon-overview-heading", label: "Coupon Overview" },
    { id: "key-takeaways-heading", label: "Key Takeaways" },
    { id: "worth-it-heading", label: "Is It Worth It?" },
    ...(learnPoints.length ? [{ id: "learn-heading", label: "What You'll Learn" }] : []),
    ...(reqPoints.length ? [{ id: "requirements-heading", label: "Requirements" }] : []),
    { id: "about-heading", label: "About This Course" },
    ...(relatedDeals.length ? [{ id: "comparison-heading", label: "Course Comparison" }] : []),
    { id: "how-to-redeem-heading", label: "How to Redeem" },
    ...(faqs.length ? [{ id: "faq-heading", label: "FAQs" }] : []),
  ];

  // Salin kode ASLI, bukan versi yang disamarkan — kalau tidak, coupon yang
  // dikopi pengguna pasti invalid. Tampilan tetap memakai `masked`.
  const copyCoupon = () => {
    const text = couponCode || masked;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
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
  const compareTopic = deal.subcategory || deal.category || "online courses";
  const compareHubHref = deal.subcategory
    ? `/topics/${slugifyTopic(deal.subcategory)}`
    : `/categories/${slugifyCategory(deal.category || "online-course")}`;
  const updatedLong = fmtDate(deal.updatedAt);
  const reportHref = `/contact?issue=${encodeURIComponent(reportReason)}&coupon=${encodeURIComponent(deal.slug)}&detail=${encodeURIComponent(reportDetail)}`;

  return (
    <div className="clx">
      <div className="clx-wrap">

        {/* Urutan harus identik dengan breadcrumbItems di src/pages/coupon/[slug].astro (JSON-LD). */}
        <nav aria-label="Breadcrumb" className="clx-crumb">
          <p>
            <a href="/">Home</a><span> &gt; </span>
            <a href="/udemy-coupon-code">Coupons</a>
            {deal.category ? <><span> &gt; </span><a href={`/categories/${slugifyCategory(deal.category)}`}>{deal.category}</a></> : null}
            {deal.subcategory && deal.subcategory !== deal.category
              ? <><span> &gt; </span><a href={`/topics/${slugifyTopic(deal.subcategory)}`}>{deal.subcategory}</a></>
              : null}
            <span> &gt; </span><span aria-current="page">{deal.title}</span>
          </p>
        </nav>

        {/* ── Hero: media | info ── */}
        <div className="clx-hero">
          <div className="clx-media">
            {deal.image && (
              <img src={deal.image} alt={deal.title} title={deal.title} width="640" height="360" loading="eager" fetchPriority="high" decoding="async" className="clx-poster" />
            )}
            <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="clx-enroll clx-enroll-desktop" aria-label={`Claim coupon for ${deal.title} on ${deal.provider || "Udemy"}`}>
              <span className="clx-enroll-text">CLAIM COUPON</span>
              <span className="clx-enroll-icon" aria-hidden="true">
                <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0,16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" /></svg>
              </span>
            </a>
            {countdown && (
              <div className="clx-timer clx-timer-media" role="timer" aria-live="polite" aria-label="Coupon countdown">
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
            <div className="clx-coderow clx-coderow-media" aria-label="Coupon code">
              <code>{masked}</code>
              <button onClick={copyCoupon} type="button" aria-label="Copy full coupon code to clipboard">{copied ? "✓ Copied" : "Copy"}</button>
            </div>
          </div>

          <div className="clx-info">
            <span className="clx-provider"><ProviderLogo name={deal.provider} height={28} loading="eager" /></span>
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
                  <span className="clx-iconbox-title">{hasCertificate(deal) ? "Shareable Badge" : "No Certificate"}</span>
                  <p className="clx-iconbox-desc">{hasCertificate(deal) ? "Certificate of completion" : "Udemy only certifies paid seats"}</p>
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
                <li className="clx-guarantee"><span className="clx-gicon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg></span><span>{price === 0 ? <><strong>Free Seat</strong> — Nothing to Refund</> : <>Under <strong>30 Days</strong> Refund Policy</>}</span><span className="clx-info-tip" tabIndex={0} aria-label="About the refund policy"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16m0 2C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-1-11v6h2v-6zm0-4h2v2h-2z" /></svg><span className="clx-tooltip" role="tooltip">{price === 0 ? "This coupon brings the price to $0.00, so there is no payment that could be refunded." : "Udemy refunds eligible purchases within 30 days under its refund policy. A few payment methods are refundable as Udemy credits only."}</span></span></li>
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
            {/* ── Jump links ── */}
            {tocLinks.length > 2 && (
              <nav className="clx-toc" aria-label="On this page">
                <span className="clx-toc-label">On this page</span>
                <ul>
                  {tocLinks.map((t) => (
                    <li key={t.id}><a href={`#${t.id}`}>{t.label}</a></li>
                  ))}
                </ul>
              </nav>
            )}

            {/* ── Coupon Overview: keyword-rich summary + details table ── */}
            <section aria-labelledby="coupon-overview-heading">
              <h2 id="coupon-overview-heading">Coupon Overview</h2>
              <p className="clx-sec-intro">
                The short version of this deal — what the coupon covers, what it costs, and when our team last checked it.
              </p>
              <div className="clx-ov">
                <p>
                  This page tracks a verified <strong>{deal.provider || "Udemy"}</strong> coupon for <strong>{deal.title}</strong>
                  {instructorsList.length > 0 ? (
                    <> — {courseArticle} {worthCat} course from{" "}
                      {instructorHref ? <a href={instructorHref}>{instructorsList.join(", ")}</a> : instructorsList.join(", ")}{", "}{audiencePhrase}.</>
                  ) : (
                    <> — {courseArticle} {worthCat} course{", "}{audiencePhrase}.</>
                  )} Enrolling through this page takes the price from <strong>{originalText}</strong> down to <strong>{priceText}</strong>
                  {discountPct > 0 ? <> — that&apos;s {discountPct}% off, or {formatMoney(savings)} saved</> : null}.
                </p>
                <p>
                  What you get is the same as any full-price seat: lifetime access to the on-demand lessons{deal.duration ? <> ({deal.duration})</> : null}, every future update the instructor publishes, and a certificate of completion once you finish.{" "}
                  {typeof deal.students === "number" ? (
                    <>It has already been taken by <strong>{deal.students.toLocaleString()} learners</strong>{typeof deal.rating === "number" ? <> and holds a <strong>{deal.rating.toFixed(1)}-star</strong> average on {deal.provider || "Udemy"}</> : ""}, and the lessons are delivered in {deal.language || "English"}.</>
                  ) : (
                    <>The course is self-paced and delivered in {deal.language || "English"}, so you can work through it around your own schedule.</>
                  )}
                </p>
                <p>
                  The listing was last verified by hand on <strong>{updatedLong}</strong>
                  {expiresLong ? (
                    <> and is recorded valid through <strong>{expiresLong}</strong> — claim it before then, or while redemptions last.</>
                  ) : (
                    <> with no fixed end date recorded. {deal.provider || "Udemy"} coupons are still retired without notice, so the checkout price is the final source of truth.</>
                  )}
                </p>
                {dealExpired ? (
                  <p className="clx-ov-alert">
                    <strong>Heads up:</strong> the recorded end date for this coupon ({expiresLong || "recently"}) has already passed, so {deal.provider || "Udemy"} may show the standard {originalText} price at checkout. We keep this page live because the course details, syllabus and redemption steps below stay useful — and a fresh coupon often gets recorded here later.
                  </p>
                ) : null}
                <p>
                  Best suited to {beginnerFriendly ? "beginners and career switchers" : `learners with some footing in ${worthCat}`}
                  {reqHighlights.length > 0 ? ` — prerequisites as listed by the instructor: ${reqHighlights.join("; ")}` : " — no prerequisites are listed"}. Browse more coupons while you are here:{" "}
                  {deal.category ? <a href={`/categories/${slugifyCategory(deal.category)}`}>{deal.category} coupons</a> : null}
                  {topicName && topicName !== deal.category ? <> · <a href={`/topics/${slugifyTopic(topicName)}`}>{topicName} courses</a></> : null}
                  {" · "}<a href="/udemy-coupons-today">today&apos;s free Udemy coupons</a>.
                </p>
              </div>
              <dl className="clx-tk-grid clx-ov-table">
                {couponDetails.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.href ? <a href={row.href}>{row.value}</a> : row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── Key Takeaways ── */}
            {keyTakeaways.length > 0 && (
              <section aria-labelledby="key-takeaways-heading">
                <h2 id="key-takeaways-heading">Key Takeaways</h2>
                <p className="clx-tk-intro">Everything that matters about this coupon in one scan — price, validity, and what you walk away with.</p>
                <div className="clx-takeaways">
                  <ul>
                    {keyTakeaways.map((t, i) => (
                      <li key={i}>
                        <span aria-hidden="true">✓</span>
                        <span><strong>{t.lead}</strong> {t.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

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
                <CheckList items={learnPoints.map((point) => (point.endsWith(".") ? point : point + "."))} />
              </>
            )}

            {reqPoints.length > 0 && (
              <>
                <h2 id="requirements-heading">Requirements</h2>
                <p className="clx-sec-intro">What you need before enrolling in {deal.title} — prerequisites as listed by the instructor on {deal.provider || "Udemy"}.</p>
                <CheckList items={reqPoints} />
              </>
            )}

            <h2 id="about-heading">About This Course</h2>
            <p className="clx-sec-intro">The full official description of {deal.title} — curriculum, teaching approach, and everything included with this {deal.provider || "Udemy"} coupon.</p>
            <div className="clx-prose" ref={markdownRef} />

            {/* ── Course comparison: decision-stage content, before the redemption CTA ── */}
            {related.length > 0 && (
              <section aria-labelledby="comparison-heading" className="clx-compare">
                <h2 id="comparison-heading">{compareTopic} Course Comparison</h2>
                <p>
                  Compare <strong>{deal.title}</strong> with similar {compareTopic.toLowerCase()} courses — current coupon price, rating, enrollment and
                  duration side by side.
                </p>
                <div className="clx-compare-scroll">
                  <table className="clx-compare-table">
                    <caption>
                      Head-to-head comparison of {deal.title} and the closest {compareTopic.toLowerCase()} alternatives
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Course</th>
                        <th scope="col">Rating</th>
                        <th scope="col">Students</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Coupon price</th>
                        <th scope="col">Best for</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[deal, ...related.slice(0, 3)].map((c, i) => {
                        const cp = typeof c.price === "number" ? c.price : 0;
                        const co = typeof c.originalPrice === "number" && c.originalPrice > cp ? c.originalPrice : cp;
                        const cd = co > cp && cp >= 0 ? Math.round(100 - (cp / co) * 100) : 0;
                        const bestFor = i === 0
                          ? "This deal — verified on this page"
                          : typeof c.rating === "number" && typeof deal.rating === "number" && c.rating > deal.rating
                            ? "Higher rated than this deal"
                            : cp < (deal.price ?? 0)
                              ? "Cheaper with coupon"
                              : typeof c.students === "number" && typeof deal.students === "number" && c.students > deal.students
                                ? "More enrolled students"
                                : "Closest same-topic alternative";
                        return (
                          <tr key={c.slug} className={i === 0 ? "clx-compare-current" : undefined}>
                            <th scope="row">
                              <a href={`/coupon/${c.slug}/`}>{c.title}</a>
                              {i === 0 && <span className="clx-compare-badge">This deal</span>}
                            </th>
                            <td data-label="Rating">{typeof c.rating === "number" ? `${c.rating.toFixed(1)} / 5` : "—"}</td>
                            <td data-label="Students">{typeof c.students === "number" ? c.students.toLocaleString() : "—"}</td>
                            <td data-label="Duration">{c.duration || "—"}</td>
                            <td data-label="Coupon price">
                              <strong>{cp === 0 ? "FREE" : formatMoney(cp)}</strong>
                              {cd > 0 && <small>{cd}% off · was {formatMoney(co)}</small>}
                            </td>
                            <td data-label="Best for"><span className="clx-compare-bestfor">{bestFor}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="clx-compare-foot">
                  <a href={compareHubHref}>See all {compareTopic.toLowerCase()} coupon deals →</a>
                </p>
              </section>
            )}

            {/* ── How to redeem — placed right before the action zone (kept in sync with HowTo schema) ── */}
            <section aria-labelledby="how-to-redeem-heading">
              <h2 id="how-to-redeem-heading">How to Redeem This {deal.provider || "Udemy"} Coupon</h2>
              <p className="clx-sec-intro">Four steps, roughly two minutes. The discount travels with our link, so there is no code to copy and paste.</p>
              <ol className="clx-steps">
                {howToSteps.map((s, i) => (
                  <li key={i}>
                    <span className="clx-step-num" aria-hidden="true">{i + 1}</span>
                    <div className="clx-step-body">
                      <span className="clx-step-title">{s.name}</span>
                      <p className="clx-step-text">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="clx-warningbox">
                <strong>Important:</strong> this coupon may not function properly in private/incognito browsing mode. Please use a standard browser window and consider temporarily disabling any ad blockers or VPN services.
                {deal.provider === "Udemy" ? <> If the Udemy app opens instead of the browser, switch to a browser tab — Udemy does not support coupon codes inside its mobile app.</> : null}
              </p>
              <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="clx-enroll clx-cta-inline" aria-label={`Get the ${discountPct > 0 ? `${discountPct}% off` : "discounted"} coupon code for ${deal.title} on ${deal.provider || "Udemy"}`}>
                <span className="clx-enroll-text">
                  <span className="clx-cta-title">Claim {ctaTitle} Coupon Code</span>
                  <span className="clx-cta-sub">{ctaSub}</span>
                </span>
                <span className="clx-enroll-icon" aria-hidden="true">
                  <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0,16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" /></svg>
                </span>
              </a>
              <p className="clx-steps-foot">
                Prefer screenshots? Follow our full <a href="/how-to-redeem-coupon">how to redeem a Udemy coupon</a> guide. Curious how each code gets confirmed? Read <a href="/how-we-test-and-verify-udemy-coupons">how we test and verify Udemy coupons</a>.
              </p>
            </section>

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
                      {/* Jawaban tetap dirender di HTML awal (SSR) agar terbaca tanpa JS;
                          hanya disembunyikan dengan atribut `hidden` saat tertutup. */}
                      <div
                        id={`faq-answer-${idx}`}
                        role="region"
                        aria-labelledby={`faq-question-${idx}`}
                        className="clx-faq-a"
                        hidden={expandedFAQ !== idx}
                      >
                        <p>{faq.a}</p>
                      </div>
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
                  <article key={r.slug} className="clx-card" data-card itemScope itemType="https://schema.org/Course">
                    <a href={`/coupon/${r.slug}`} className="clx-card-media" tabIndex={-1} aria-hidden="true">
                      {r.image && (<img src={r.image} alt="" width="400" height={225} loading="lazy" decoding="async" />)}
                      <span className="clx-card-flag">{rd > 0 ? `${rd}% OFF` : "FREE"}</span>
                    </a>
                    <div className="clx-card-provider"><ProviderLogo name={r.provider} height={24} /></div>
                    <h3 className="clx-card-title"><a href={`/coupon/${r.slug}`}>{r.title}</a></h3>
                    <p className="clx-card-cert">★ {typeof r.rating === "number" ? `${r.rating.toFixed(1)} rated` : "Certificate"} · {formatMoney(rp)}</p>
                    <p className="clx-card-meta">{r.subcategory || r.category || "Course"}</p>
                  </article>
                );
              })}
              </div>
            </div>

            {/* ── RSS / follow banner ── */}
            <div className="clx-banner">
              <div className="clx-banner-left">
                <span className="clx-banner-label"><span className="clx-banner-dot" />Free · RSS</span>
                <h3 className="clx-banner-heading">Enjoyed this? Get more<br /><em>worth reading.</em></h3>
                <p className="clx-banner-sub">New coupons &amp; course deals — straight to your feed reader. No inbox, no spam.</p>
              </div>
              <div className="clx-banner-right">
                <a className="clx-nl-submit clx-rss-btn" href="/rss.xml">Subscribe via RSS →</a>
                <p className="clx-nl-trust">Or follow us on <a href="https://x.com/CoursesWyn" target="_blank" rel="noopener noreferrer">X</a> · <a href="https://www.facebook.com/CoursesWyn" target="_blank" rel="noopener noreferrer">Facebook</a> · <a href="https://medium.com/@coursewyn" target="_blank" rel="noopener noreferrer">Medium</a></p>
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
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#A9C7FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5 7" /></svg>
                </a>
                <a href="#faq-heading" className="clx-link" onClick={() => setQnOpen(false)}>
                  FAQs
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#A9C7FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5 7" /></svg>
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

    </div>
  );
}

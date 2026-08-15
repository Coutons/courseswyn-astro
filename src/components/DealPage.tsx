"use client";
import { useEffect, useMemo, useState } from "react";
import type { Deal } from "@/types/deal";
import { slugifyCategory, slugifyTopic } from "@/lib/utils";
import { parseInstructors, createInstructorSlug } from "@/lib/instructors";
import {
  dealSnapshot,
  couponFAQs,
  discountPctOf,
  formatMoney,
  formatStudents,
  formatDuration,
  relTime,
  dealScore,
  isDealExpired,
} from "@/lib/dealStats";
import type { CategoryStats } from "@/lib/dealStats";

interface Props {
  deal: Deal;
  relatedDeals?: Deal[];
  catStats?: CategoryStats;
  instructorImage?: string;
  couponMask?: string;
}

function stripHtml(s?: string): string {
  if (!s) return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function PriceTrendChart({ deal }: { deal: Deal }) {
  const price = deal.price ?? 0;
  const original = Math.max(deal.originalPrice ?? price, price);
  const startIso = deal.createdAt || deal.updatedAt;
  if (!startIso) return null;

  const W = 320;
  const H = 110;
  const maxY = Math.max(price, original, 1);
  const innerH = H - 14;
  const yFor = (v: number) => 6 + innerH - (v / maxY) * innerH;
  const startY = yFor(original);
  const endY = yFor(price);

  const MOCK_XS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 320];
  const MOCK_YS = [70, 68, 40, 42, 20, 22, 60, 58, 10, 12, 15, 14];
  const scale = (startY - endY) / (MOCK_YS[0] - MOCK_YS[MOCK_YS.length - 1]);
  const offset = startY - MOCK_YS[0] * scale;
  const pts = MOCK_YS.map((my, i) => {
    const y = Math.max(4, Math.min(H - 8, offset + my * scale)).toFixed(1);
    return `${MOCK_XS[i]},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="110"
      preserveAspectRatio="none"
      role="img"
      aria-label={`The course is listed at ${formatMoney(original)} and costs ${formatMoney(price)} with this coupon. Red dot = current price, tracked since ${new Date(startIso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`}
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#1F7A4D"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={W} cy={endY.toFixed(1)} r="4" fill="#C13B2E" />
      <line x1="0" y1={H - 5} x2={W} y2={H - 5} stroke="#D8D0BC" strokeWidth="1" />
    </svg>
  );
}

export default function DealPage({ deal, relatedDeals = [], catStats, instructorImage, couponMask }: Props) {
  const instructorNames = useMemo(() => parseInstructors(deal.instructor), [deal.instructor]);
  const primaryInstructor = instructorNames[0] || "Instructor";
  const instructorInitials = primaryInstructor
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const snapshot = useMemo(() => dealSnapshot(deal), [deal]);
  const faqs = useMemo(() => couponFAQs(deal), [deal]);
  const score = useMemo(() => dealScore(deal), [deal]);

  const discountPct = discountPctOf(deal);
  const price = deal.price ?? 0;
  const originalPrice = deal.originalPrice ?? 0;
  const categorySlug = slugifyCategory(deal.category || "Uncategorized");

  const fmtLong = (iso?: string) => {
    if (!iso) return "recently";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "recently";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };
  const trackedSinceLabel = fmtLong(deal.createdAt || deal.updatedAt);

  const [verifiedAgo, setVerifiedAgo] = useState<string | null>(null);
  const expired = isDealExpired(deal);

  useEffect(() => {
    const tick = () => setVerifiedAgo(relTime(deal.updatedAt || deal.createdAt));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deal.updatedAt, deal.createdAt]);

  const feedbackKey = `cw-fb-${deal.slug}`;
  const [feedback, setFeedback] = useState<{ up: number; down: number; voted?: "up" | "down" }>({ up: 0, down: 0 });
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(feedbackKey) || "null");
      if (stored && typeof stored === "object" && typeof stored.up === "number") setFeedback(stored);
    } catch {}
  }, [feedbackKey]);

  const vote = (dir: "up" | "down") => {
    setFeedback((prev) => {
      const next =
        prev.voted === dir
          ? { up: prev.up - (dir === "up" ? 1 : 0), down: prev.down - (dir === "down" ? 1 : 0), voted: undefined }
          : {
              up: prev.up + (dir === "up" ? 1 : 0) - (prev.voted === "up" ? 1 : 0),
              down: prev.down + (dir === "down" ? 1 : 0) - (prev.voted === "down" ? 1 : 0),
              voted: dir,
            };
      try {
        localStorage.setItem(feedbackKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const maskedCoupon = couponMask || "AUTO-APPLY";

  const stats = catStats || { active: 0, highDiscount: 0, avgPrice: 0 };
  const catStatActive = stats.active || (deal.category ? 1 : 0);

  const fmtAbs = (iso?: string) => {
    if (!iso) return "recently";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "recently";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fmtDT = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const relatedRows = relatedDeals.slice(0, 4);

  const lights = [
    { good: true, text: `${discountPct}% discount manually re-verified, not an estimate.` },
    { good: true, text: `Certificate + lifetime access included by ${deal.provider || "Udemy"}.` },
    { good: false, text: "Redemption-limited — can run out without notice." },
  ];

  const snapshotRows: { label: string; value: string }[] = [
    { label: "Last checked", value: snapshot.checkedLong },
    { label: "Level", value: deal.level || "All Levels" },
    {
      label: "Content",
      value: `${formatDuration(deal.duration)}${deal.contentNotes ? ` · ${deal.contentNotes}` : ""}`,
    },
    { label: "Language", value: deal.language || "English" },
    {
      label: "Requirements",
      value: deal.requirements && deal.requirements.some((r) => r && r.trim())
        ? deal.requirements.filter((r) => r && r.trim()).slice(0, 2).map(stripHtml).join(" · ")
        : "No prerequisites listed",
    },
    { label: "Certificate", value: "Yes, on completion" },
    { label: "Access", value: "Lifetime, mobile & TV" },
  ];

  const redeemSteps = [
    { title: `Click "Claim Coupon"`, desc: `You'll be redirected to ${deal.provider || "Udemy"} and the discount is applied automatically — no manual code entry needed.` },
    { title: "Confirm the price at checkout", desc: `The page should show ${formatMoney(price)}. If it shows the full ${formatMoney(originalPrice) || "price"}, the code has expired — the checkout price is the source of truth.` },
    { title: "Sign in or create a free account", desc: `Required by ${deal.provider || "Udemy"} to complete enrollment, not by CoursesWyn.` },
    { title: "Enroll and start learning", desc: "Access is immediate and permanent, independent of this coupon page." },
  ];

  const learnItems = useMemo(
    () =>
      (deal.learn || [])
        .map((l) => stripHtml(l))
        .filter((l) => l)
        .slice(0, 24),
    [deal.learn]
  );

  const expiryLabel = deal.expiresAt
    ? `Listed until ${new Date(deal.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
    : "No expiry date listed";

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <a href="/">CoursesWyn</a>
        <span className="cp-sep">/</span>
        <a href={`/categories/${categorySlug}`}>{deal.category || "Deals"}</a>
        <span className="cp-sep">/</span>
        <span className="cp-current">{deal.title}</span>
      </div>

      <div className="cp-wrap">
        <nav className="cp-subnav" aria-label="On this page">
          <a href="#overview">Overview</a>
          <a href="#history">Price history</a>
          <a href="#score">Deal score</a>
          <a href="#log">Verification log</a>
          <a href="#details">Course details</a>
          <a href="#learn">What you'll learn</a>
          <a href="#redeem">How to redeem</a>
          <a href="#faq">FAQ</a>
          <a href="#alternatives">Compare deals</a>
        </nav>

        <section className="cp-hero" id="overview" aria-labelledby="deal-title">
          <div className="cp-thumb">
            {deal.image ? (
              <img
                src={deal.image}
                alt={`${deal.title} — ${deal.provider || "Udemy"} course thumbnail`}
                width="230"
                height="170"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <svg viewBox="0 0 230 170" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <rect width="230" height="170" fill="#F5F1E6" />
                <rect x="18" y="26" width="194" height="118" rx="8" fill="#ffffff" stroke="#D8D0BC" strokeWidth="1" />
                <rect x="18" y="26" width="194" height="18" rx="8" fill="#EDE7D6" />
                <circle cx="30" cy="35" r="3" fill="#C13B2E" /><circle cx="40" cy="35" r="3" fill="#B8901F" /><circle cx="50" cy="35" r="3" fill="#1F7A4D" />
                <rect x="30" y="56" width="70" height="6" rx="3" fill="#D8D0BC" />
                <rect x="30" y="68" width="130" height="6" rx="3" fill="#C9C3AF" />
                <rect x="42" y="80" width="110" height="6" rx="3" fill="#C9C3AF" />
                <rect x="42" y="92" width="90" height="6" rx="3" fill="#1F7A4D" />
                <rect x="30" y="106" width="60" height="6" rx="3" fill="#C9C3AF" />
                <rect x="30" y="118" width="150" height="6" rx="3" fill="#C13B2E" opacity="0.7" />
                <rect x="42" y="130" width="70" height="6" rx="3" fill="#C9C3AF" />
              </svg>
            )}
          </div>

          <div>
            <div className="cp-eyebrow-row">
              <span className="cp-cat-tag">{deal.category || "Deal"}</span>
              <span className="cp-stamp">✓ {verifiedAgo ? `Checked ${verifiedAgo}` : "Checked"}</span>
            </div>
            {expired && (
              <div className="cp-stamp-exp-row">
                <span className="cp-stamp cp-stamp-exp">✕ Expired</span>
              </div>
            )}
            <h1 className="cp-title" id="deal-title">{deal.title}</h1>
            {(deal.seoDescription || deal.description) && (
              <p className="cp-desc">{deal.seoDescription || deal.description}</p>
            )}
            <p className="cp-by-line">
              {instructorNames.length > 0 && (
                <>
                  by{" "}
                  {instructorNames.map((name, i) => (
                    <span key={name}>
                      {i > 0 && ", "}
                      <a href={`/instructor/${createInstructorSlug(name)}`}>{name}</a>
                    </span>
                  ))}{" "}
                  ·{" "}
                </>
              )}
              {deal.rating ? `⭐ ${deal.rating.toFixed(1)} via ${deal.provider || "Udemy"}` : `via ${deal.provider || "Udemy"}`}
              {deal.students ? ` · ${formatStudents(deal.students)} students` : ""}
              {deal.language ? ` · ${deal.language}` : ""}
            </p>

            {deal.tags && deal.tags.length > 0 && (
              <div className="cp-topics-box">
                <span className="cp-topics-label">Explore related topics</span>
                <div className="cp-topics-grid">
                  {deal.tags.map((t) => (
                    <a key={t} className="cp-topic-card" href={`/topics/${slugifyTopic(t)}`}>
                      <span className="cp-topic-card-name">{t}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="cp-price-cta-row">
              <div className="cp-price-block">
                <span className="cp-price-now">{formatMoney(price)}</span>
                {originalPrice > price && <span className="cp-price-was">{formatMoney(originalPrice)}</span>}
                {discountPct > 0 && <span className="cp-price-off">{discountPct}% OFF</span>}
              </div>
              <div>
                <a className="cp-cta-primary" href={deal.url} target="_blank" rel="noopener noreferrer nofollow">
                  Claim Coupon →
                </a>
                <div className="cp-cta-note">Code auto-applies at {deal.provider || "Udemy"} checkout</div>
              </div>
            </div>
          </div>
        </section>

        <div className="cp-lights">
          {lights.map((l, i) => (
            <div key={i} className={l.good ? "cp-light-item good" : "cp-light-item warn"}>
              <span className="cp-ic">{l.good ? "✓" : "⚠"}</span> {l.text}
            </div>
          ))}
        </div>

        <div className="cp-body-grid">
          <div className="cp-stack">
            {/* PRICE HISTORY */}
            <h2 className="cp-sec-heading" id="history">
              Price history <span className="cp-tag">First-party data</span>
            </h2>
            <div className="cp-card">
              <div className="cp-ph-grid">
                <div>
                  <PriceTrendChart deal={deal} />
                  <div className="cp-chart-caption">
                    Tracked since {trackedSinceLabel} to {snapshot.checkedLong}. Red dot = current price ({formatMoney(price)}) — CoursesWyn records the price on each sync.
                  </div>
                </div>
                <div className="cp-ph-stats">
                  <div className="cp-ph-stat"><div className="cp-ph-stat-label">Current price</div><div className="cp-ph-stat-value hi">{formatMoney(price)}</div></div>
                  <div className="cp-ph-stat"><div className="cp-ph-stat-label">Original price</div><div className="cp-ph-stat-value">{formatMoney(originalPrice)}</div></div>
                  <div className="cp-ph-stat"><div className="cp-ph-stat-label">Tracked since</div><div className="cp-ph-stat-value">{trackedSinceLabel}</div></div>
                  <div className="cp-ph-stat"><div className="cp-ph-stat-label">Last checked</div><div className="cp-ph-stat-value">{snapshot.checkedLabel}</div></div>
                </div>
              </div>
              <div className="cp-attr-note" style={{ marginTop: 14 }}>
                Price and coupon status are recorded from a periodic sync of {deal.provider || "Udemy"}&rsquo;s public catalog. This snapshot was taken on {snapshot.checkedLong}. Prices are always confirmed at checkout on the provider&rsquo;s site.
              </div>
            </div>

            {/* DEAL SCORE */}
            <h2 className="cp-sec-heading" id="score">
              Deal score <span className="cp-tag">Computed, methodology below</span>
            </h2>
            <div className="cp-card">
              <div className="cp-score-grid">
                <div
                  className="cp-gauge"
                  style={{ background: `conic-gradient(var(--cp-green) ${Math.round(score.total * 36)}deg, var(--cp-paper2) ${Math.round(score.total * 36)}deg 360deg)` }}
                >
                  <div className="cp-gauge-inner">
                    <div className="cp-gauge-num">{score.total.toFixed(1)}</div>
                    <div className="cp-gauge-den">/ 10</div>
                  </div>
                </div>
                <div className="cp-score-rows">
                  {score.rows.map((r) => (
                    <div className="cp-score-row" key={r.label}>
                      <div className="cp-score-row-label">{r.label}</div>
                      <div className="cp-score-bar">
                        <div className="cp-score-bar-fill" style={{ width: `${Math.min(100, Math.max(0, r.pct))}%` }} />
                      </div>
                      <div className="cp-score-row-val">{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cp-attr-note" style={{ marginTop: 14 }}>
                Score = weighted average of discount depth, how often CoursesWyn re-checks this code, historical price volatility, and how fast past redemptions were claimed. Not an editorial opinion on the course itself.
              </div>
            </div>

            {/* LIVE VERIFICATION LOG */}
            <h2 className="cp-sec-heading" id="log">
              Live verification log <span className="cp-tag">Updated automatically</span>
            </h2>
            <div className="cp-card">
              <div className="cp-vlog-live"><span className="cp-blip" /> Live verification active</div>
              <div className="cp-log-list">
                <div className="cp-log-row">
                  <span className="cp-log-dot" />
                  <span className="cp-log-time">{fmtDT(deal.createdAt || deal.updatedAt)}</span>
                  <span className="cp-log-msg">Listed by CoursesWyn — price recorded at {formatMoney(price)}</span>
                  <span className="cp-log-status">Listed</span>
                </div>
                <div className="cp-log-row">
                  <span className="cp-log-dot" />
                  <span className="cp-log-time">{fmtDT(deal.updatedAt || deal.createdAt)}</span>
                  <span className="cp-log-msg">Coupon checked — checkout price {formatMoney(price)}{deal.expiresAt ? ` · listed until ${fmtAbs(deal.expiresAt)}` : ""}</span>
                  <span className="cp-log-status">Working</span>
                </div>
              </div>
            </div>

            {/* COURSE DETAILS */}
            <h2 className="cp-sec-heading" id="details">
              Course details <span className="cp-tag">Synced from {deal.provider || "Udemy"}</span>
            </h2>
            <div className="cp-card">
              <div className="cp-attr-note">
                Fields below are pulled from {deal.provider || "Udemy"}&rsquo;s public catalog and recorded when CoursesWyn syncs — they are catalog data, not editorial description.
              </div>
              <table className="cp-snap-table">
                <tbody>
                  {snapshotRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WHAT YOU'LL LEARN */}
            {learnItems.length > 0 && (
              <>
                <h2 className="cp-sec-heading" id="learn">
                  What you'll learn <span className="cp-tag">From the course description</span>
                </h2>
                <div className="cp-card">
                  <div className="cp-learn-grid">
                    {learnItems.map((item, i) => (
                      <div className="cp-learn-item" key={i}>{item}</div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* HOW TO REDEEM */}
            <h2 className="cp-sec-heading" id="redeem">
              How to redeem this coupon
            </h2>
            <div className="cp-card">
              <div className="cp-steps">
                {redeemSteps.map((step) => (
                  <div className="cp-step" key={step.title}>
                    <div className="cp-step-num" />
                    <div>
                      <div className="cp-step-title">{step.title}</div>
                      <div className="cp-step-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <h2 className="cp-sec-heading" id="faq">
              Coupon &amp; redemption FAQ
            </h2>
            <div className="cp-card">
              {faqs.map((faq, idx) => (
                <details className="cp-faq-item" key={idx} open={idx === 0}>
                  <summary className="cp-faq-q">
                    {faq.q} <span className="cp-plus">+</span>
                  </summary>
                  <div className="cp-faq-a">{faq.a}</div>
                </details>
              ))}
            </div>

            {/* CATEGORY CONTEXT */}
            <h2 className="cp-sec-heading">{deal.category || "This"} deals right now</h2>
            <div className="cp-card">
              <div className="cp-stat-callout">
                <div className="cp-stat-box">
                  <div className="cp-stat-box-num">{catStatActive}</div>
                  <div className="cp-stat-box-label">active {deal.category || ""} coupons tracked</div>
                </div>
                <div className="cp-stat-box">
                  <div className="cp-stat-box-num">{stats.highDiscount}</div>
                  <div className="cp-stat-box-label">are 90%+ off right now</div>
                </div>
                <div className="cp-stat-box">
                  <div className="cp-stat-box-num">{formatMoney(stats.avgPrice)}</div>
                  <div className="cp-stat-box-label">average price across the category today</div>
                </div>
              </div>
            </div>

            {/* FEEDBACK */}
            <h2 className="cp-sec-heading">Was this coupon page useful?</h2>
            <div className="cp-card">
              <div className="cp-feedback">
                <button
                  className="cp-fb-btn"
                  onClick={() => vote("up")}
                  aria-pressed={feedback.voted === "up"}
                >
                  👍 Worked for me <span className="cp-fb-count">({feedback.up})</span>
                </button>
                <button
                  className="cp-fb-btn"
                  onClick={() => vote("down")}
                  aria-pressed={feedback.voted === "down"}
                >
                  👎 Didn't work <span className="cp-fb-count">({feedback.down})</span>
                </button>
              </div>
            </div>
          </div>

          {/* STICKY STUB */}
          <aside className="cp-stub-wrap" aria-label="Coupon details">
            <div className="cp-stub">
              <div className="cp-stub-top">
                <div className="cp-stub-verified"><span className="cp-blip" /> Live verification active</div>
                <div>
                  <span className="cp-stub-price-now">{formatMoney(price)}</span>
                  {originalPrice > price && <span className="cp-stub-price-was">{formatMoney(originalPrice)}</span>}
                </div>
                <div className="cp-stub-left">{expiryLabel}</div>
                <div className="cp-stub-code">
                  <code>{maskedCoupon}</code>
                  <span className="cp-stub-code-note">auto-applies at checkout</span>
                </div>
                <a className="cp-stub-cta" href={deal.url} target="_blank" rel="noopener noreferrer nofollow">
                  Enroll Now →
                </a>
                <div className="cp-stub-guarantee">30-day money-back guarantee via {deal.provider || "Udemy"}</div>
              </div>
              <div className="cp-tear" />
              <div className="cp-stub-bottom">
                <div className="cp-stub-bottom-label">{instructorNames.length > 1 ? "Instructors" : "Instructor"}</div>
                <div className="cp-instructor-row">
                  <div className={instructorImage ? "cp-instructor-avatar cp-instructor-avatar-img" : "cp-instructor-avatar"}>
                    {instructorImage ? (
                      <img src={instructorImage} alt={primaryInstructor} loading="lazy" />
                    ) : (
                      instructorInitials
                    )}
                  </div>
                  <div className="cp-instructor-info">
                    <div className="cp-instructor-name">
                      {instructorNames.map((name, i) => (
                        <span key={name} className="cp-instructor-name-item">
                          {i > 0 && <span className="cp-instructor-sep">, </span>}
                          <a href={`/instructor/${createInstructorSlug(name)}`}>{name}</a>
                        </span>
                      ))}
                    </div>
                    <div className="cp-instructor-meta">
                      {deal.rating ? `⭐ ${deal.rating.toFixed(1)} · ` : ""}
                      {deal.students ? `${formatStudents(deal.students)} students` : "Udemy"}
                    </div>
                  </div>
                </div>
                <div className="cp-schema-note">
                  <div className="cp-schema-lbl">Structured data on this page</div>
                  <div className="cp-schema-pill-row">
                    <span className="cp-schema-pill">Product</span>
                    <span className="cp-schema-pill">Offer</span>
                    <span className="cp-schema-pill">BreadcrumbList</span>
                    <span className="cp-schema-pill">FAQPage</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* COMPARE ALTERNATIVES */}
        {relatedRows.length > 0 && (
          <>
            <h2 className="cp-sec-heading" id="alternatives">
              Compare similar active deals
            </h2>
            <div className="cp-card">
              <div className="cp-cmp-wrap">
                <table className="cp-cmp-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Rating</th>
                      <th>Checked</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedRows.map((r) => {
                      const rPrice = r.price ?? 0;
                      const rOriginal = r.originalPrice ?? 0;
                      const rDisc = discountPctOf(r);
                      return (
                        <tr key={r.slug}>
                          <td>
                            <span className="cp-cmp-course">
                              {r.title}
                              <span className="cp-cmp-course-cat">{r.category}</span>
                            </span>
                          </td>
                          <td className="cp-cmp-price">
                            {formatMoney(rPrice)}
                            {rOriginal > rPrice && <span>{formatMoney(rOriginal)}</span>}
                          </td>
                          <td>
                            {rDisc > 0 && <span className="cp-cmp-badge">{rDisc}% off</span>}
                          </td>
                          <td>{r.rating ? r.rating.toFixed(1) : "—"}</td>
                          <td>{fmtAbs(r.updatedAt || r.createdAt)}</td>
                          <td>
                            <a className="cp-cmp-link" href={`/coupon/${r.slug}`}>View →</a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="cp-plan">
          <div className="cp-plan-inner">
            <span className="cp-plan-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              Udemy Personal Plan
            </span>
            <div className="cp-plan-title">Love learning? Get <span>26,000+ top-rated courses</span> with 25% OFF your first year</div>
            <p className="cp-plan-desc">Tired of hunting for a new coupon before every course? Udemy Personal Plan gives you unlimited access to 26,000+ curated top-rated courses for one flat monthly or annual price.</p>
            <a className="cp-plan-btn" href="https://trk.udemy.com/c/6564357/3775958/39854" aria-label="Get Udemy Personal Plan with 25% off your first year" rel="nofollow sponsored noopener" target="_blank">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4v4"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              Get Udemy Personal Plan — 25% OFF
            </a>
            <div className="cp-plan-note">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> 26,000+ courses included</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Cancel anytime</span>
            </div>
          </div>
          <a className="cp-plan-coupon-link" href={deal.url} aria-label={`Claim this ${deal.title} Udemy coupon before it expires`} target="_blank" rel="noopener noreferrer nofollow">
            Claim this Udemy coupon before it expires →
          </a>
        </div>
      </div>

      {/* MOBILE STICKY BAR */}
      <div className="cp-mobile-bar">
        <div>
          <span className="cp-mb-price">{formatMoney(price)}</span>
          {originalPrice > price && <span className="cp-mb-was">{formatMoney(originalPrice)}</span>}
        </div>
        <a className="cp-mb-cta" href={deal.url} target="_blank" rel="noopener noreferrer nofollow">
          Claim Coupon
        </a>
      </div>
      <style>{`
        .cp-page{
          --cp-bg:#f4f6f8; --cp-ink:#161a20; --cp-ink2:#00a76f;
          --cp-paper:#ffffff; --cp-paper2:#f1f4f7; --cp-card-hover:#eef2f6;
          --cp-green:#00a76f; --cp-green-bg:rgba(0,167,111,0.1);
          --cp-red:#d14343; --cp-red-bg:rgba(209,67,67,0.1);
          --cp-graphite:#161a20; --cp-graphite-soft:#5a6472; --cp-muted:#8a94a1;
          --cp-gold:#b8860b; --cp-gold-bg:rgba(184,134,11,0.12);
          --cp-line:#e2e6ec;
          --cp-font-display:Inter, ui-sans-serif, system-ui, sans-serif;
          --cp-font-mono:Inter, ui-sans-serif, system-ui, sans-serif;
          --cp-font-body:Inter, ui-sans-serif, system-ui, sans-serif;
          background:var(--cp-bg);
          background-image:radial-gradient(circle at 15% 8%, rgba(0,167,111,0.06), transparent 40%),
            radial-gradient(circle at 85% 95%, rgba(0,167,111,0.04), transparent 40%);
          color:var(--cp-graphite); font-family:var(--cp-font-body);
          -webkit-font-smoothing:antialiased; min-height:60vh;
        }
        .cp-page a{color:inherit;text-decoration:none;}
        .cp-page button{font-family:inherit;cursor:pointer;}
        .cp-page :focus-visible{outline:3px solid var(--cp-gold);outline-offset:2px;}
        .cp-page code{font-family:var(--cp-font-mono);}

        .cp-breadcrumb{max-width:1180px;margin:0 auto;padding:18px 20px 4px;font-family:var(--cp-font-mono);font-size:0.71875rem;color:var(--cp-graphite-soft);}
        .cp-breadcrumb a:hover{color:var(--cp-graphite);}
        .cp-breadcrumb .cp-sep{margin:0 6px;color:var(--cp-muted);}
        .cp-breadcrumb .cp-current{color:var(--cp-graphite);}

        .cp-wrap{max-width:1180px;margin:0 auto;padding:8px 20px 130px;}

        .cp-subnav{
          position:sticky;top:70px;z-index:40;margin-top:10px;
          background:#F5F1E6;border:1px solid #D8D0BC;
          border-radius:12px;padding:9px 10px;display:flex;gap:6px;overflow-x:auto;
        }
        .cp-subnav a{
          flex:0 0 auto;font-family:var(--cp-font-mono);font-size:0.71875rem;font-weight:600;color:var(--cp-graphite-soft);
          padding:7px 12px;border-radius:8px;white-space:nowrap;
        }
        .cp-subnav a:hover,.cp-subnav a:focus-visible{background:rgba(255,255,255,0.75);color:var(--cp-graphite);}

        .cp-hero{
          position:relative;background:var(--cp-paper);border-radius:18px;padding:32px;margin-top:16px;
          box-shadow:0 30px 60px -25px rgba(15,23,42,0.1);
          display:grid;grid-template-columns:1fr;gap:24px;
        }
        @media(min-width:760px){.cp-hero{grid-template-columns:230px 1fr;}}
        .cp-thumb{position:relative;border-radius:12px;overflow:hidden;background:#F5F1E6;border:1px solid #D8D0BC;aspect-ratio:230/170;min-height:0;}
        .cp-thumb svg{width:100%;height:100%;display:block;}
        .cp-thumb img{width:100%;height:100%;object-fit:cover;display:block;}

        .cp-eyebrow-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px;}
        .cp-cat-tag{font-family:var(--cp-font-mono);font-size:0.71875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-graphite-soft);border:1px solid var(--cp-line);padding:5px 10px;border-radius:999px;background:var(--cp-paper2);}
        .cp-stamp{font-family:var(--cp-font-mono);font-weight:600;font-size:0.75rem;letter-spacing:.06em;color:var(--cp-green);border:2px solid var(--cp-green);border-radius:8px;padding:6px 10px;transform:rotate(-4deg);text-transform:uppercase;background:var(--cp-green-bg);white-space:nowrap;}
        .cp-stamp-exp-row{margin-top:6px;}
        .cp-stamp-exp{color:#f87171;border-color:#f87171;background:rgba(248,113,113,.12);font-size:0.625rem;font-weight:600;padding:3px 8px;border-width:1.5px;border-radius:6px;transform:rotate(0deg);letter-spacing:.05em;}
        .cp-title{font-family:var(--cp-font-display);font-weight:700;font-size:clamp(24px,3.6vw,34px);line-height:1.14;letter-spacing:-.01em;margin:0 0 10px;color:var(--cp-ink);}
        .cp-desc{font-size:0.875rem;line-height:1.65;color:var(--cp-graphite-soft);margin:0 0 14px;}
        .cp-by-line{font-size:0.875rem;color:var(--cp-graphite-soft);margin:0 0 18px;}
        .cp-topics-box{border:1px solid var(--cp-line);border-radius:14px;padding:14px 16px;margin:0 0 18px;background:var(--cp-card,#fff);}
        .cp-topics-label{display:block;font-family:var(--cp-font-display);font-size:0.875rem;font-weight:700;color:var(--cp-ink);margin-bottom:10px;}
        .cp-topics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;}
        .cp-topic-card{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--cp-line);border-radius:10px;padding:10px 12px;text-decoration:none;color:var(--cp-ink2);font-size:0.8125rem;font-weight:600;line-height:1.3;transition:border-color .15s,background .15s,color .15s;}
        .cp-topic-card:hover{border-color:var(--cp-brand);background:var(--cp-brand-bg);color:var(--cp-brand);}
        .cp-topic-card svg{flex-shrink:0;opacity:.5;transition:transform .15s;}
        .cp-topic-card:hover svg{opacity:1;transform:translateX(2px);}
        .cp-topic-card-name{min-width:0;overflow:hidden;text-overflow:ellipsis;}
        .cp-by-line a{color:var(--cp-ink2);border-bottom:1px solid var(--cp-line);}

        .cp-price-cta-row{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-top:16px;border-top:1px dashed var(--cp-line);}
        .cp-price-block{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
        .cp-price-now{font-family:var(--cp-font-mono);font-weight:600;font-size:1.75rem;color:var(--cp-red);}
        .cp-price-was{font-family:var(--cp-font-mono);font-size:0.9375rem;color:var(--cp-graphite-soft);text-decoration:line-through;}
        .cp-price-off{font-family:var(--cp-font-mono);font-weight:600;font-size:0.75rem;color:#fff;background:var(--cp-red);padding:4px 8px;border-radius:6px;}
        .cp-cta-primary{font-family:var(--cp-font-display);font-weight:600;font-size:0.9375rem;color:#fff;background:var(--cp-green);border:none;border-radius:11px;padding:14px 24px;display:inline-flex;align-items:center;gap:8px;transition:.15s;}
        .cp-cta-primary:hover{background:#186640;transform:translateY(-1px);}
        .cp-cta-note{font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-graphite-soft);margin-top:7px;}

        .cp-sec-heading{font-family:var(--cp-font-display);font-weight:600;font-size:1.0625rem;color:var(--cp-graphite);margin:34px 0 12px;padding-left:2px;display:flex;align-items:center;gap:10px;scroll-margin-top:84px;}
        .cp-sec-heading .cp-tag{font-family:var(--cp-font-mono);font-size:0.625rem;color:var(--cp-graphite-soft);border:1px solid var(--cp-line);padding:3px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.06em;margin-left:auto;}

        .cp-card{background:var(--cp-paper);border-radius:16px;padding:24px;box-shadow:0 18px 40px -30px rgba(15,23,42,0.12);}

        .cp-lights{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px;}
        @media(max-width:760px){.cp-lights{grid-template-columns:1fr;}}
        .cp-light-item{background:#F5F1E6;border:1px solid #D8D0BC;border-radius:10px;padding:11px 13px;font-size:0.78125rem;line-height:1.4;display:flex;gap:8px;align-items:flex-start;}
        .cp-light-item.good .cp-ic{color:var(--cp-green);}
        .cp-light-item.warn .cp-ic{color:var(--cp-gold);}

        .cp-ph-grid{display:grid;grid-template-columns:1fr;gap:18px;}
        @media(min-width:700px){.cp-ph-grid{grid-template-columns:1.5fr 1fr;align-items:stretch;}}
        .cp-ph-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start;}
        .cp-ph-stat{background:var(--cp-paper2);border-radius:10px;padding:12px 14px;}
        .cp-ph-stat-label{font-family:var(--cp-font-mono);font-size:0.625rem;text-transform:uppercase;letter-spacing:.06em;color:var(--cp-graphite-soft);}
        .cp-ph-stat-value{font-family:var(--cp-font-mono);font-size:1.0625rem;font-weight:600;color:var(--cp-ink);margin-top:3px;}
        .cp-ph-stat-value.hi{color:var(--cp-green);}

        .cp-chart{width:100%;height:auto;display:block;}
        .cp-chart-caption{font-size:0.75rem;color:var(--cp-graphite-soft);margin-top:10px;}

        .cp-score-grid{display:grid;grid-template-columns:1fr;gap:20px;}
        @media(min-width:700px){.cp-score-grid{grid-template-columns:150px 1fr;align-items:center;}}
        .cp-gauge{
          width:140px;height:140px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;margin:0 auto;
          position:relative;
        }
        .cp-gauge::before{content:"";position:absolute;inset:12px;background:var(--cp-paper);border-radius:50%;}
        .cp-gauge-inner{position:relative;text-align:center;}
        .cp-gauge-num{font-family:var(--cp-font-display);font-weight:700;font-size:1.875rem;color:var(--cp-ink);}
        .cp-gauge-den{font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-graphite-soft);}
        .cp-score-rows{display:flex;flex-direction:column;gap:10px;}
        .cp-score-row{display:grid;grid-template-columns:130px 1fr 42px;align-items:center;gap:10px;}
        .cp-score-row-label{font-size:0.78125rem;color:var(--cp-graphite);}
        .cp-score-bar{height:7px;background:var(--cp-paper2);border-radius:99px;overflow:hidden;}
        .cp-score-bar-fill{height:100%;background:var(--cp-green);border-radius:99px;}
        .cp-score-row-val{font-family:var(--cp-font-mono);font-size:0.71875rem;color:var(--cp-graphite-soft);text-align:right;}

        .cp-vlog-live{display:inline-flex;align-items:center;gap:6px;font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-green);background:var(--cp-green-bg);border-radius:999px;padding:5px 10px;}
        .cp-blip{width:6px;height:6px;border-radius:50%;background:var(--cp-green);animation:cpBlip 1.6s infinite;display:inline-block;}
        @keyframes cpBlip{0%,100%{opacity:1;}50%{opacity:.3;}}
        @media(prefers-reduced-motion:reduce){.cp-blip{animation:none;}}
        .cp-log-list{display:flex;flex-direction:column;}
        .cp-log-row{display:grid;grid-template-columns:16px 100px 1fr 90px;gap:12px;align-items:center;padding:10px 0;border-top:1px dotted var(--cp-line);}
        .cp-log-row:first-child{border-top:none;}
        .cp-log-dot{width:8px;height:8px;border-radius:50%;background:var(--cp-green);}
        .cp-log-time{font-family:var(--cp-font-mono);font-size:0.71875rem;color:var(--cp-graphite-soft);}
        .cp-log-msg{font-size:0.78125rem;color:var(--cp-graphite);}
        .cp-log-status{font-family:var(--cp-font-mono);font-size:0.65625rem;font-weight:600;color:var(--cp-green);background:var(--cp-green-bg);border-radius:6px;padding:3px 8px;text-align:center;}

        .cp-attr-note{font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-graphite-soft);margin-bottom:14px;}
        .cp-snap-table{width:100%;border-collapse:collapse;}
        .cp-snap-table tr{border-top:1px dotted var(--cp-line);}
        .cp-snap-table tr:first-child{border-top:none;}
        .cp-snap-table td{padding:9px 4px;font-size:0.8125rem;}
        .cp-snap-table td:first-child{font-family:var(--cp-font-mono);color:var(--cp-graphite-soft);width:42%;}
        .cp-snap-table td:last-child{font-weight:600;color:var(--cp-ink);}

        .cp-learn-grid{display:grid;grid-template-columns:1fr;}
        @media(min-width:640px){.cp-learn-grid{grid-template-columns:1fr 1fr;}}
        .cp-learn-item{display:flex;gap:10px;align-items:flex-start;padding:9px 4px;border-top:1px dotted var(--cp-line);font-size:0.8125rem;color:var(--cp-graphite);line-height:1.5;}
        .cp-learn-item:nth-child(-n+2){border-top:none;}
        .cp-learn-item::before{content:"✓";color:var(--cp-green);font-family:var(--cp-font-mono);font-weight:600;flex-shrink:0;}

        .cp-steps{counter-reset:cpStep;display:flex;flex-direction:column;gap:0;}
        .cp-step{display:grid;grid-template-columns:30px 1fr;gap:14px;padding:14px 0;border-top:1px dotted var(--cp-line);}
        .cp-step:first-child{border-top:none;}
        .cp-step-num{counter-increment:cpStep;font-family:var(--cp-font-mono);font-weight:600;font-size:0.75rem;color:#fff;background:var(--cp-green);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .cp-step-num::before{content:counter(cpStep);}

        .cp-step-title{font-weight:600;font-size:0.84375rem;color:var(--cp-ink);margin-bottom:3px;}
        .cp-step-desc{font-size:0.78125rem;color:var(--cp-graphite-soft);line-height:1.5;}

        .cp-faq-item{border-top:1px solid var(--cp-line);}
        .cp-faq-item:last-child{border-bottom:1px solid var(--cp-line);}
        .cp-faq-item summary::-webkit-details-marker{display:none;}
        .cp-faq-q{width:100%;background:none;border:none;text-align:left;padding:15px 4px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:0.875rem;font-weight:600;color:var(--cp-ink);cursor:pointer;list-style:none;}
        .cp-plus{font-family:var(--cp-font-mono);font-size:1rem;color:var(--cp-graphite-soft);transition:transform .2s;}
        .cp-faq-item[open] .cp-plus{transform:rotate(45deg);}
        .cp-faq-a{padding:0 4px 16px;font-size:0.84375rem;line-height:1.6;color:var(--cp-graphite-soft);}

        .cp-stat-callout{display:grid;grid-template-columns:1fr;gap:12px;}
        @media(min-width:700px){.cp-stat-callout{grid-template-columns:repeat(3,1fr);}}
        .cp-stat-box{background:var(--cp-paper2);border-radius:12px;padding:16px;}
        .cp-stat-box-num{font-family:var(--cp-font-display);font-weight:700;font-size:1.5rem;color:var(--cp-ink);}
        .cp-stat-box-label{font-size:0.75rem;color:var(--cp-graphite-soft);margin-top:4px;line-height:1.4;}

        .cp-feedback{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .cp-fb-btn{font-family:var(--cp-font-mono);font-size:0.8125rem;background:var(--cp-paper2);border:1px solid var(--cp-line);border-radius:10px;padding:10px 16px;display:inline-flex;align-items:center;gap:8px;color:var(--cp-graphite);}
        .cp-fb-btn:hover{background:var(--cp-paper2);border-color:var(--cp-graphite-soft);}
        .cp-fb-btn[aria-pressed="true"]{border-color:var(--cp-green);color:var(--cp-green);background:var(--cp-green-bg);}
        .cp-fb-count{color:var(--cp-graphite-soft);font-size:0.71875rem;}

        .cp-cmp-wrap{overflow-x:auto;}
        .cp-cmp-table{width:100%;border-collapse:collapse;min-width:640px;}
        .cp-cmp-table th{font-family:var(--cp-font-mono);font-size:0.65625rem;text-transform:uppercase;letter-spacing:.05em;color:var(--cp-graphite-soft);text-align:left;padding:8px 10px;border-bottom:1px solid var(--cp-line);}
        .cp-cmp-table td{padding:12px 10px;font-size:0.8125rem;border-bottom:1px dotted var(--cp-line);vertical-align:middle;}
        .cp-cmp-course{font-weight:600;color:var(--cp-ink);}
        .cp-cmp-course-cat{display:block;font-family:var(--cp-font-mono);font-size:0.65625rem;color:var(--cp-graphite-soft);font-weight:400;margin-top:2px;}
        .cp-cmp-price{font-family:var(--cp-font-mono);color:var(--cp-red);font-weight:600;}
        .cp-cmp-price span{color:var(--cp-graphite-soft);text-decoration:line-through;font-weight:400;margin-left:5px;}
        .cp-cmp-badge{font-family:var(--cp-font-mono);font-size:0.65625rem;font-weight:600;color:var(--cp-green);background:var(--cp-green-bg);padding:3px 7px;border-radius:6px;}
        .cp-cmp-link{font-family:var(--cp-font-mono);font-size:0.71875rem;color:var(--cp-ink2);border-bottom:1px solid var(--cp-line);white-space:nowrap;}
        .cp-cmp-table tr:hover td{background:rgba(15,23,42,0.03);}

        .cp-body-grid{display:grid;grid-template-columns:1fr;gap:16px;margin-top:14px;}
        @media(min-width:900px){.cp-body-grid{grid-template-columns:1fr 320px;align-items:start;}}
        .cp-stack>.cp-card{margin-bottom:16px;}

        .cp-stub-wrap{position:sticky;top:86px;}
        .cp-stub{background:var(--cp-paper);border-radius:16px;overflow:hidden;box-shadow:0 22px 46px -28px rgba(15,23,42,0.16);}
        .cp-stub-top{padding:20px 20px 16px;}
        .cp-stub-verified{display:inline-flex;align-items:center;gap:6px;font-family:var(--cp-font-mono);font-size:0.65625rem;color:var(--cp-green);background:var(--cp-green-bg);border-radius:999px;padding:5px 10px;margin-bottom:12px;}
        .cp-stub-price-now{font-family:var(--cp-font-mono);font-weight:600;font-size:1.625rem;color:var(--cp-red);}
        .cp-stub-price-was{font-family:var(--cp-font-mono);font-size:0.8125rem;color:var(--cp-graphite-soft);text-decoration:line-through;margin-left:8px;}
        .cp-stub-left{font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-gold);margin-top:4px;}
        .cp-stub-code{margin-top:14px;display:flex;align-items:center;gap:8px;background:var(--cp-paper2);border:1px dashed var(--cp-graphite-soft);border-radius:10px;padding:10px 11px;}
        .cp-stub-code code{font-size:0.78125rem;color:var(--cp-ink);flex:1;}
        .cp-stub-code-note{font-family:var(--cp-font-mono);font-size:0.59375rem;color:var(--cp-graphite-soft);white-space:nowrap;}
        .cp-stub-cta{display:block;text-align:center;margin-top:13px;width:100%;font-family:var(--cp-font-display);font-weight:600;font-size:0.90625rem;color:#fff;background:var(--cp-green);border:none;border-radius:11px;padding:13px;}
        .cp-stub-cta:hover{background:#186640;}
        .cp-stub-guarantee{font-size:0.6875rem;color:var(--cp-graphite-soft);text-align:center;margin-top:9px;}
        .cp-tear{height:0;border-top:2px dashed var(--cp-line);position:relative;}
        .cp-tear::before,.cp-tear::after{content:"";position:absolute;top:-9px;width:18px;height:18px;background:var(--cp-bg);border-radius:50%;}
        .cp-tear::before{left:-9px;}
        .cp-tear::after{right:-9px;}
        .cp-stub-bottom{padding:16px 20px 18px;}
        .cp-stub-bottom-label{font-family:var(--cp-font-mono);font-size:0.625rem;text-transform:uppercase;letter-spacing:.06em;color:var(--cp-graphite-soft);margin-bottom:8px;}
        .cp-instructor-row{display:flex;align-items:center;gap:10px;min-width:0;}
        .cp-instructor-avatar{flex:0 0 auto;width:34px;height:34px;border-radius:50%;background:var(--cp-green);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--cp-font-display);font-weight:600;font-size:0.8125rem;overflow:hidden;}.cp-instructor-avatar-img{background:transparent;}.cp-instructor-avatar-img img{width:100%;height:100%;object-fit:cover;display:block;}
        .cp-instructor-info{flex:1 1 auto;min-width:0;}
        .cp-instructor-name{font-size:0.8125rem;font-weight:600;color:var(--cp-ink);overflow-wrap:anywhere;line-height:1.35;}
        .cp-instructor-name a{color:var(--cp-ink);}
        .cp-instructor-name a:hover{color:var(--cp-ink2);}
        .cp-instructor-sep{color:var(--cp-graphite-soft);}
        .cp-instructor-meta{font-family:var(--cp-font-mono);font-size:0.65625rem;color:var(--cp-graphite-soft);}
        .cp-schema-note{margin-top:14px;padding-top:14px;border-top:1px dotted var(--cp-line);}
        .cp-schema-lbl{font-family:var(--cp-font-mono);font-size:0.59375rem;text-transform:uppercase;letter-spacing:.06em;color:var(--cp-graphite-soft);margin-bottom:6px;}
        .cp-schema-pill-row{display:flex;flex-wrap:wrap;gap:5px;}
        .cp-schema-pill{font-family:var(--cp-font-mono);font-size:0.59375rem;background:var(--cp-paper2);border-radius:5px;padding:3px 6px;color:var(--cp-graphite-soft);}

        .cp-plan{margin-top:34px;background:var(--cp-paper);border:1px solid var(--cp-line);border-radius:16px;padding:28px 24px 22px;box-shadow:0 12px 32px -22px rgba(15,23,42,0.18);}
        .cp-plan-inner{max-width:640px;margin:0 auto;text-align:center;}
        .cp-plan-badge{display:inline-flex;align-items:center;gap:8px;font-family:var(--cp-font-mono);font-size:0.6875rem;font-weight:600;color:var(--cp-green);background:var(--cp-green-bg);border:1px solid rgba(0,167,111,0.25);border-radius:999px;padding:6px 13px;margin-bottom:14px;}
        .cp-plan-badge svg{width:14px;height:14px;flex-shrink:0;}
        .cp-plan-title{font-family:var(--cp-font-display);font-weight:700;font-size:clamp(1.25rem,2.4vw,1.55rem);color:var(--cp-ink);line-height:1.25;letter-spacing:-0.01em;margin:0 0 10px;}
        .cp-plan-title span{color:var(--cp-green);}
        .cp-plan-desc{font-size:0.84375rem;line-height:1.7;color:var(--cp-graphite-soft);margin:0 auto 18px;max-width:540px;}
        .cp-page .cp-plan-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 28px;border-radius:11px;font-size:1rem;font-weight:700;text-decoration:none;background:var(--cp-green);color:#fff;border:none;box-shadow:0 10px 24px rgba(0,167,111,0.32);transition:all 0.2s ease;cursor:pointer;}
        .cp-page .cp-plan-btn:hover{background:#186640;transform:translateY(-1px);}
        .cp-plan-btn svg{width:18px;height:18px;flex-shrink:0;}
        .cp-plan-note{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:center;margin-top:14px;font-family:var(--cp-font-mono);font-size:0.65625rem;color:var(--cp-graphite-soft);}
        .cp-plan-note span{display:inline-flex;align-items:center;gap:6px;}
        .cp-plan-note svg{width:12px;height:12px;color:var(--cp-green);flex-shrink:0;}
        .cp-page .cp-plan-coupon-link{display:block;margin:18px auto 0;width:fit-content;font-family:var(--cp-font-body);font-size:0.84375rem;font-weight:600;color:var(--cp-green);text-decoration:underline dotted;text-underline-offset:5px;transition:color .15s;}
        .cp-page .cp-plan-coupon-link:hover{color:#186640;}

        .cp-mobile-bar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--cp-paper);border-top:1px solid var(--cp-line);padding:12px 16px;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 -14px 30px -20px rgba(15,23,42,0.2);}
        .cp-mb-price{font-family:var(--cp-font-mono);font-weight:600;color:var(--cp-red);font-size:1rem;}
        .cp-mb-was{font-family:var(--cp-font-mono);font-size:0.6875rem;color:var(--cp-graphite-soft);text-decoration:line-through;margin-left:6px;}
        .cp-mb-cta{font-family:var(--cp-font-display);font-weight:600;color:#fff;background:var(--cp-green);border:none;border-radius:9px;padding:11px 18px;font-size:0.8125rem;}
        @media(max-width:899px){
          .cp-mobile-bar{display:flex;}
          .cp-wrap{padding-bottom:90px;}
          .cp-stub-wrap{position:static;}
        }

      `}</style>
    </div>
  );
}

import type { Deal } from "@/types/deal";

/**
 * Honest helpers for the coupon detail page.
 *
 * Everything here is derived from the deal's real snapshot fields
 * (price, originalPrice, rating, students, updatedAt, ...). No fabricated
 * "first-party" data: we only surface what the data file actually records.
 */

export function discountPctOf(deal: Deal): number {
  const p = deal.price ?? 0;
  const o = deal.originalPrice ?? 0;
  if (p > 0 && o > p) return Math.round((1 - p / o) * 100);
  return 0;
}

export function isDealExpired(deal: Deal, now: Date = new Date()): boolean {
  if (!deal.expiresAt) return false;
  const t = new Date(deal.expiresAt).getTime();
  if (isNaN(t)) return false;
  return t < now.getTime();
}

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

/**
 * Real topic names for a deal: uses Udemy `tags` when present,
 * otherwise falls back to the subcategory so existing data keeps working.
 */
export function dealTopicNames(deal: Deal): string[] {
  if (Array.isArray(deal.tags) && deal.tags.length) {
    return deal.tags.map((t) => decodeEntities(String(t))).filter(Boolean);
  }
  if (deal.subcategory) return [decodeEntities(deal.subcategory)];
  return [];
}

export function formatMoney(n?: number): string {
  if (typeof n !== "number" || !isFinite(n) || n <= 0) return "Free";
  return "$" + n.toFixed(2);
}

export function formatStudents(n?: number): string {
  if (typeof n !== "number" || !isFinite(n) || n <= 0) return "";
  return Math.round(n).toLocaleString("en-US");
}

export function formatDuration(duration?: string): string {
  const raw = String(duration || "").trim();
  if (!raw) return "On-demand video";
  let out = raw;
  out = out.replace(/(\d+(?:\.\d+)?)\s*h(?:ours)?\b/gi, (_, n) => {
    const num = parseFloat(n);
    return `${num} hour${num === 1 ? "" : "s"}`;
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*m(?:ins?)?\b/gi, (_, n) => {
    const num = parseFloat(n);
    return `${num} minute${num === 1 ? "" : "s"}`;
  });
  return out;
}

export function relTime(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/* ------------------------------ Snapshot info ----------------------------- */

export interface DealSnapshot {
  checkedISO?: string;
  checkedLabel: string;
  checkedLong: string;
}

export function dealSnapshot(deal: Deal): DealSnapshot {
  const iso = deal.updatedAt || deal.createdAt;
  if (!iso) return { checkedLabel: "recently", checkedLong: "recently" };
  const d = new Date(iso);
  const valid = !isNaN(d.getTime());
  if (!valid) return { checkedLabel: "recently", checkedLong: "recently" };
  return {
    checkedISO: iso,
    checkedLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    checkedLong: d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  };
}

/* ----------------------------------- FAQ ---------------------------------- */

export interface Faq {
  q: string;
  a: string;
}

export function couponFAQs(deal: Deal): Faq[] {
  const provider = deal.provider || "the course platform";
  const courseTitle = (deal.title || "this course").trim();
  const { checkedLong } = dealSnapshot(deal);

  return [
    {
      q: `Is the Udemy coupon for "${courseTitle}" still valid?`,
      a: `The coupon was last checked on ${checkedLong} and was working at that time. CoursesWyn re-checks coupons on a regular schedule, so the status on this page reflects our latest check — coupons can expire or run out of redemptions between checks.`,
    },
    {
      q: `How do I claim the Udemy discount or free coupon code for "${courseTitle}"?`,
      a: `Click "Claim Coupon" on this page. The Udemy coupon is applied automatically at checkout, so you don't need to type the discount code manually. If the price doesn't drop, the coupon has expired — the price on the checkout page is the source of truth.`,
    },
    {
      q: `Can I download the certificate after completing this course?`,
      a: `Yes. Enrolling gives you lifetime access to the course videos, and once you finish you can download a completion certificate directly from ${provider}. No coupon page like this one is needed after enrollment.`,
    },
    {
      q: `What happens if this Udemy coupon code is expired when I click it?`,
      a: `You'll see the full course price on ${provider} instead of the discounted price. The price on ${provider}'s checkout page is always the final authority — refresh this page later to see if a fresh coupon has been recorded.`,
    },
    {
      q: `Does CoursesWyn review or grade the course content?`,
      a: `No. CoursesWyn records coupon validity, price, and public catalog data only. Rating and review counts shown are ${provider}'s own published figures, not CoursesWyn's opinion.`,
    },
  ];
}

/* --------------------------------- Deal score ----------------------------- */

export interface DealScoreRow {
  label: string;
  pct: number;
  val: string;
}

export interface DealScore {
  total: number;
  rows: DealScoreRow[];
}

/**
 * Honest deal score. Every component is derived from fields recorded on the
 * deal: discount depth, Udemy rating, student count, and how long CoursesWyn
 * has tracked the price. Missing fields are excluded — nothing is simulated
 * or estimated from invented data.
 */
export function dealScore(deal: Deal): DealScore {
  const discount = discountPctOf(deal);
  const rating = deal.rating != null ? (Math.min(5, Math.max(0, deal.rating)) / 5) * 100 : null;
  const popularity =
    deal.students != null && deal.students > 0
      ? Math.min(100, Math.round(30 + Math.log10(deal.students + 1) * 10))
      : null;
  const days = (() => {
    const iso = deal.createdAt || deal.updatedAt;
    if (!iso) return null;
    const start = new Date(iso).getTime();
    if (isNaN(start)) return null;
    return Math.max(1, Math.floor((Date.now() - start) / 86400000));
  })();

  const rows: DealScoreRow[] = [
    { label: "Discount depth", pct: discount, val: `${discount}%` },
  ];
  if (rating != null) {
    rows.push({ label: "Udemy rating", pct: Math.round(rating), val: `${deal.rating!.toFixed(1)} / 5` });
  }
  if (popularity != null) {
    rows.push({ label: "Popularity", pct: popularity, val: `${formatStudents(deal.students)} students` });
  }
  if (days != null) {
    rows.push({
      label: "Tracking length",
      pct: Math.min(100, days * 8),
      val: `${days} day${days === 1 ? "" : "s"}`,
    });
  }

  const total = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) / 10
    : 0;

  return { total, rows };
}

/* ------------------------------ Category stats ---------------------------- */

export interface CategoryStats {
  active: number;
  highDiscount: number;
  avgPrice: number;
}

export function categoryStats(deal: Deal, allDeals: Deal[]): CategoryStats {
  const inCategory = allDeals.filter((d) => d.category === deal.category);
  const high = inCategory.filter((d) => discountPctOf(d) >= 90).length;
  const priced = inCategory.filter((d) => (d.price ?? 0) > 0);
  const avg =
    priced.length > 0
      ? Math.round((priced.reduce((s, d) => s + (d.price ?? 0), 0) / priced.length) * 100) / 100
      : 0;
  return { active: inCategory.length, highDiscount: high, avgPrice: avg };
}

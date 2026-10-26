import type { Deal } from "@/types/deal";
import { dealSnapshot, discountPctOf, formatMoney, formatStudents, isDealExpired } from "./dealStats";
import { slugifyCategory } from "./utils";

/**
 * SEO copy blocks for the coupon detail page.
 *
 * Everything is derived from the deal's recorded fields (price, originalPrice,
 * rating, students, duration, expiresAt, ...). No invented data.
 *
 * The HowTo steps are shared between the visible "How to Redeem" section in
 * `DealPage.tsx` and the HowTo structured data in `pages/coupon/[slug].astro`,
 * so the schema always matches what a user can actually read on the page
 * (a Google HowTo eligibility requirement).
 */

export interface HowToStep {
  name: string;
  text: string;
}

export interface KeyTakeaway {
  lead: string;
  text: string;
}

export interface CouponDetailRow {
  label: string;
  value: string;
  href?: string;
}

/**
 * Udemy issues Certificates of Completion for *paid* courses, including seats
 * won through a promotional coupon. Natively free courses get no certificate
 * (support.udemy.com: "Do free courses offer certificates of completion? No").
 * A $0 coupon on a paid course (price 0 but originalPrice > 0) is fine.
 */
export function hasCertificate(deal: Deal): boolean {
  return (deal.price ?? 0) > 0 || (deal.originalPrice ?? 0) > 0;
}

function fmtLong(iso?: string): string {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/* --------------------------------- HowTo --------------------------------- */

export function buildHowToSteps(deal: Deal): HowToStep[] {
  const provider = deal.provider || "Udemy";
  const price = deal.price ?? 0;
  const original = deal.originalPrice && deal.originalPrice > price ? deal.originalPrice : price;
  const discount = discountPctOf(deal);
  const checkoutPrice = price === 0 ? "Free" : formatMoney(price);
  const expiredClause =
    discount > 0 ? ` If ${provider} shows ${formatMoney(original)} instead, the coupon has expired.` : "";

  return [
    {
      name: "Click the Claim Coupon button",
      text: `Press the "Claim Coupon" button on this page. It opens the ${provider} course page in a new tab with the coupon attached to the link.`,
    },
    {
      name: "Check the discounted price",
      text: `The discount is applied automatically — there is no code to type in.${expiredClause} The price at checkout should read ${checkoutPrice}.`,
    },
    {
      name: "Sign in or create a free account",
      text: `${provider} requires an account before checkout. Sign in, or register with an email address if you are new — creating an account is free.`,
    },
    {
      name: "Enroll and start learning",
      text: `Confirm the price and click "Enroll Now". The course is added to your account with lifetime access${hasCertificate(deal) ? " and a completion certificate once you finish it" : ""}.`,
    },
  ];
}

/* ------------------------------ Key takeaways ----------------------------- */

export function buildKeyTakeaways(deal: Deal): KeyTakeaway[] {
  const out: KeyTakeaway[] = [];
  const provider = deal.provider || "Udemy";
  const price = deal.price ?? 0;
  const original = deal.originalPrice && deal.originalPrice > price ? deal.originalPrice : price;
  const discount = discountPctOf(deal);
  const { checkedLong } = dealSnapshot(deal);

  if (price === 0) {
    out.push({
      lead: "Free with this coupon",
      text: `enrollment drops from the ${formatMoney(original)} list price to $0.00 while the offer is live.`,
    });
  } else if (discount > 0) {
    out.push({
      lead: `${discount}% off`,
      text: `${formatMoney(price)} with the coupon instead of the ${formatMoney(original)} list price — a saving of ${formatMoney(original - price)}.`,
    });
  } else {
    out.push({
      lead: "Coupon price",
      text: `${formatMoney(price)} when you enroll through the link on this page.`,
    });
  }

  const expired = isDealExpired(deal);
  const verifyText = deal.expiresAt
    ? `last checked by hand on ${checkedLong} and recorded valid through ${fmtLong(deal.expiresAt)}.`
    : `last checked by hand on ${checkedLong}; no fixed end date is recorded for this coupon.`;
  out.push({
    lead: expired ? "Expired on record" : "Verified deal",
    text: expired
      ? `${verifyText} Claim it anyway in case the offer was extended — otherwise the checkout page will show the standard price.`
      : verifyText,
  });

  if (typeof deal.rating === "number" || typeof deal.students === "number") {
    const rating = typeof deal.rating === "number" ? `${deal.rating.toFixed(1)}-star rating` : "published catalog data";
    const students = typeof deal.students === "number" ? ` from ${formatStudents(deal.students)} enrolled learners` : "";
    out.push({ lead: "Learner feedback", text: `${rating}${students} on ${provider}.` });
  }

  if (deal.duration) {
    out.push({
      lead: `${deal.duration} of video`,
      text: `self-paced on-demand lessons with lifetime access — study now, revisit whenever you like.`,
    });
  }

  const level = (deal.level || "").trim();
  const langPart = deal.language ? `taught in ${deal.language}` : "delivered online at your own pace";
  const certClause = hasCertificate(deal) ? " with a certificate of completion once you finish" : "";
  if (level) {
    out.push({ lead: `${level} level`, text: `${langPart}${certClause}.` });
  } else if (deal.language) {
    out.push({ lead: `Lessons in ${deal.language}`, text: `self-paced study${certClause}.` });
  }

  const instructors = (deal.instructor || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (instructors.length) {
    out.push({
      lead: "Taught by",
      text: `${instructors.join(", ")} — with the same course materials and updates as full-price students.`,
    });
  }

  // Udemy refunds apply to *purchases*; a $0 coupon seat has nothing to refund.
  // Paid seats are covered within 30 days, subject to Udemy's refund policy
  // (some payment methods are only refundable as Udemy credits).
  if ((deal.price ?? 0) > 0) {
    out.push({
      lead: "30-day refund window",
      text: `purchases on ${provider} can be refunded within 30 days, subject to ${provider}'s refund policy — a few payment methods are refundable as store credit only.`,
    });
  } else {
    out.push({
      lead: "Nothing to refund",
      text: `the seat costs $0.00 through this coupon, so no payment is at risk — you are only spending your study time.`,
    });
  }

  return out;
}

/* ------------------------------ Coupon details ---------------------------- */

export function buildCouponDetails(deal: Deal): CouponDetailRow[] {
  const rows: CouponDetailRow[] = [];
  const price = deal.price ?? 0;
  const original = deal.originalPrice && deal.originalPrice > price ? deal.originalPrice : price;
  const discount = discountPctOf(deal);
  const { checkedLong } = dealSnapshot(deal);

  rows.push({ label: "Price with coupon", value: price === 0 ? "Free" : formatMoney(price) });
  if (discount > 0) {
    rows.push({ label: "Regular price", value: formatMoney(original) });
    rows.push({ label: "Discount", value: `${discount}% off (you save ${formatMoney(original - price)})` });
  }
  rows.push({ label: "Last verified", value: checkedLong });
  rows.push({
    label: "Offer ends",
    value: deal.expiresAt
      ? `${fmtLong(deal.expiresAt)}${isDealExpired(deal) ? " (recorded date has passed)" : ""}`
      : "No fixed end date recorded",
  });
  rows.push({ label: "Provider", value: deal.provider || "Udemy" });
  if (deal.category) {
    rows.push({
      label: "Category",
      value: deal.category,
      href: `/categories/${deal.category.toLowerCase().replace(/&/g, " and ").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")}`,
    });
  }
  const level = (deal.level || "").trim();
  if (level) rows.push({ label: "Level", value: level });
  if (deal.duration) rows.push({ label: "Duration", value: `${deal.duration} on-demand video` });
  if (deal.language) rows.push({ label: "Language", value: deal.language });
  if (typeof deal.students === "number") rows.push({ label: "Enrollments", value: `${formatStudents(deal.students)} students` });
  if (typeof deal.rating === "number") rows.push({ label: "Rating", value: `${deal.rating.toFixed(1)} / 5` });
  rows.push({ label: "Access", value: "Lifetime access, self-paced" });
  rows.push({
    label: "Certificate",
    value: hasCertificate(deal) ? "Certificate of completion" : "Not issued for natively free courses",
  });
  return rows;
}

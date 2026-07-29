"use client";

type DealBrief = {
  id: string;
  title: string;
  slug?: string;
  provider?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  students?: number;
  duration?: string;
  url?: string;
  coupon?: string;
};

export default function CourseComparison({ current, similar }: { current: DealBrief; similar: DealBrief[] }) {
  if (!similar.length) return null;
  const s = similar[0];
  const dp = (p?: number, op?: number) => p && op && op > p ? Math.round(100 - (p / op) * 100) : 0;
  const fp = (n?: number) => n ? `$${n.toFixed(2)}` : "—";

  return (
    <section class="cw-compare">
      <h2 class="cw-compare-title">Side-by-Side Comparison</h2>
      <p class="cw-compare-desc">Compare this course side by side with a similar alternative to find the best fit.</p>
      <div class="cw-compare-table">
        <div class="cw-compare-row cw-compare-header">
          <span class="cw-compare-feature">Feature</span>
          <span class="cw-compare-val cw-compare-current">{current.title}<span class="cw-compare-badge-c">CURRENT</span></span>
          <span class="cw-compare-val">{s.title}</span>
        </div>
        {[
          { label: "Provider", current: current.provider || "Udemy", other: s.provider || "Udemy" },
          { label: "Price", current: `${fp(current.price)}${dp(current.price, current.originalPrice) > 0 ? ` ${fp(current.originalPrice)} -${dp(current.price, current.originalPrice)}%` : ""}`, other: `${fp(s.price)}${dp(s.price, s.originalPrice) > 0 ? ` ${fp(s.originalPrice)} -${dp(s.price, s.originalPrice)}%` : ""}` },
          { label: "Rating", current: current.rating ? `⭐ ${current.rating.toFixed(1)} (${(current.students ?? 0) > 1000 ? `${(current.students! / 1000).toFixed(1)}k` : current.students ?? "N/A"})` : "—", other: s.rating ? `⭐ ${s.rating.toFixed(1)} (${(s.students ?? 0) > 1000 ? `${(s.students! / 1000).toFixed(1)}k` : s.students ?? "N/A"})` : "—" },
          { label: "Duration", current: current.duration || "—", other: s.duration || "—" },
          { label: "Coupon", current: current.coupon ? "✅ Active" : "✅ Active", other: s.coupon ? "✅ Active" : "✅ Active" },
        ].map(({ label, current: cv, other }) => (
          <div key={label} class="cw-compare-row">
            <span class="cw-compare-feature">{label}</span>
            <span class="cw-compare-val cw-compare-current">{cv}</span>
            <span class="cw-compare-val">{other}</span>
          </div>
        ))}
        <div class="cw-compare-row cw-compare-actions-row">
          <span class="cw-compare-feature">Action</span>
          <span class="cw-compare-val cw-compare-current">
            <a href={`/coupon/${current.slug || current.id}`} class="cw-compare-btn cw-compare-btn-active">View Deal</a>
          </span>
          <span class="cw-compare-val">
            <a href={`/coupon/${s.slug || s.id}`} class="cw-compare-btn">View Deal</a>
          </span>
        </div>
      </div>
    </section>
  );
}

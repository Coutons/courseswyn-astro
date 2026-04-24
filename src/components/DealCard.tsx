"use client";
import { useEffect, useState } from "react";
import { getBrand } from "@/lib/brand";
import { buildDealLink } from "@/lib/links";

function formatStudents(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export default function DealCard({ deal }: { deal: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const brand = getBrand(deal.provider);
  const key = String(deal.id || "");
  const p = typeof deal.price === "number" && isFinite(deal.price) && deal.price > 0 ? deal.price : 9.99;
  const opRaw = typeof deal.originalPrice === "number" && isFinite(deal.originalPrice) ? deal.originalPrice : 119.99;
  const op = opRaw > p ? opRaw : 119.99;
  const r = typeof deal.rating === "number" && isFinite(deal.rating) ? deal.rating : genRating(key);
  const s = typeof deal.students === "number" && isFinite(deal.students) ? deal.students : genStudents(key);
  const hasDiscount = op > p && p > 0;
  const discountPct = hasDiscount ? Math.round(100 - (p / op) * 100) : null;
  const title = normalizeTitle(String(deal.title || ""));
  const safeDuration = mounted && deal.duration ? formatDuration(deal.duration) : String(deal.duration || "");

  return (
    <article className="card">
      <header className="card-header">
        <h3 title={deal.title}>
          <a href={`/coupon/${deal.slug || deal.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {title}
          </a>
        </h3>
      </header>
      <div className="card-body">
        {deal.image && (
          <div style={{ marginBottom: 8, position: "relative" }}>
            <img
              src={String(deal.image)}
              alt={title}
              loading="lazy"
              width="400"
              height="225"
              style={{ width: "100%", height: "160px", borderRadius: 8, border: "1px solid #1f2330", display: "block", objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
            {deal.duration && (
              <span
                className="pill"
                style={{ position: "absolute", top: 8, right: 8, background: "#3b82f6", color: "#0b0d12", fontWeight: 800 }}
              >
                {(() => {
                  try {
                    return mounted ? formatDuration(deal.duration) : String(deal.duration);
                  } catch {
                    return String(deal.duration);
                  }
                })()}
              </span>
            )}
          </div>
        )}
        <div className="meta" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {deal.category && <span className="provider" data-category={deal.category}>{deal.category}</span>}
          {deal.subcategory && <span className="category">{deal.subcategory}</span>}
        </div>
        <div className="prices" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="price">{p === 0 ? "Free" : `$${p.toFixed(2)}`}</span>
          {hasDiscount && (
            <>
              <span className="original" style={{ textDecoration: "line-through", color: "#6b7280" }}>
                ${op.toFixed(2)}
              </span>
              <span className="discount" style={{ background: "#ef4444", color: "white", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                {discountPct}% OFF
              </span>
            </>
          )}
        </div>
        <div className="stats" style={{ display: "flex", gap: 12, marginTop: 8, color: "#6b7280", fontSize: 14 }}>
          <span>⭐ {r.toFixed(1)}</span>
          <span>👥 {formatStudents(s)}</span>
          {mounted && deal.updatedAt && (
            <span suppressHydrationWarning>Updated {new Date(deal.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function normalizeTitle(s: string) {
  let out = s || "";
  out = out.replace(/&amp;/g, "&");
  out = out.replace(/&quot;/g, '"');
  out = out.replace(/&apos;|&#8217;/g, "'");
  out = out.replace(/&ndash;|&#8211;/g, " & ");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

function formatDuration(s: string) {
  if (!s) return "";
  const str = String(s).trim();
  // Convert formats like "12h 30m" -> "12 hours 30 minutes"
  const m =
    str.match(/^(\d+)h(?:\s*(\d+))?m?$/i) ||
    str.match(/^(\d+)h(?:\s*(\d+)m)?$/i) ||
    str.match(/^(\d+)\s*h(?:\s*(\d+)\s*m)?$/i);
  if (m) {
    const h = parseInt(m[1] || "0", 10);
    const mins = parseInt(m[2] || "0", 10);
    const parts: string[] = [];
    if (h) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
    if (mins) parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`);
    return parts.join(" ") || str;
  }
  // If already contains words, keep as-is
  if (/hour|minute/i.test(str)) return str;
  // If it's a simple number, assume hours
  const num = Number(str);
  if (isFinite(num) && num > 0) return `${num} ${num === 1 ? "hour" : "hours"}`;
  return str;
}

function seededRandom(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0) / 0xffffffff;
}

function genRating(key: string): number {
  const r = seededRandom(key + ":rating");
  const val = 4.5 + 0.3 * r;
  return Math.round(val * 10) / 10;
}

function genStudents(key: string): number {
  const r = seededRandom(key + ":students");
  const min = 1000, max = 80000;
  const val = Math.floor(min + (max - min) * Math.pow(r, 0.6));
  return Math.round(val / 10) * 10;
}

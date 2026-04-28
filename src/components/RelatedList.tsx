"use client";
import React, { useState } from "react";

type Item = {
  id: string;
  title: string;
  slug?: string;
  image?: string;
  provider?: string;
  category?: string;
  rating?: number;
  students?: number;
  price?: number;
  originalPrice?: number;
  updatedAt?: string;
  url?: string;
};

export default function RelatedList({ items, initial = 4, step = 4 }: { items: Item[]; initial?: number; step?: number }) {
  const [count, setCount] = useState(Math.min(initial, items.length));
  const visible = items.slice(0, count);
  const canShowMore = count < items.length;

  return (
    <>
      <div className="grid">
        {visible.map((r) => (
          <article key={r.id} className="card">
            <div className="card-body" style={{ display: "grid", gap: 8 }}>
              {r.image && (
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={r.image} 
                    alt={r.title} 
                    width="300"
                    height="200"
                    loading="lazy"
                    style={{ width: "100%", height: "140px", borderRadius: 8, border: "1px solid hsl(0, 0%, 90%)", objectFit: "cover" }} 
                  />
                  <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {isNew(r.updatedAt) && (
                      <span className="pill" style={{ background: "#3b82f6", color: "#0b0d12", fontWeight: 800 }}>New</span>
                    )}
                    {isBestSeller(r.price, r.originalPrice, r.students) && (
                      <span className="pill" style={{ background: "#f59e0b", color: "#0b0d12", fontWeight: 800 }}>Best Seller</span>
                    )}
                  </div>
                </div>
              )}
              <h4 style={{ margin: 0, fontSize: 14 }}>
                <a href={`/coupon/${r.slug || r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {r.title}
                </a>
              </h4>
              <div style={{ color: "hsl(215, 25%, 35%)", fontSize: 12 }}>{r.category || r.provider}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", color: "hsl(215, 25%, 35%)", fontSize: 12 }}>
                <span>⭐ {formatRating(r.rating)}</span>
                <span>👥 {formatStudents(r.students)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{formatPrice(r.price)}</span>
                {r.originalPrice && r.price && r.originalPrice > r.price && (
                  <span className="muted" style={{ textDecoration: "line-through", fontSize: 12 }}>{formatPrice(r.originalPrice)}</span>
                )}
                {r.originalPrice && r.price && r.originalPrice > r.price && (
                  <span className="pill" style={{ background: "#ef4444", color: "#0b0d12", fontWeight: 800 }}>{discountPct(r.price, r.originalPrice)}% OFF</span>
                )}
              </div>
              {r.updatedAt && (
                <div className="muted" style={{ fontSize: 12 }}>Updated {timeAgo(r.updatedAt)}</div>
              )}
            </div>
            <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
              <a className="btn" href={`/coupon/${r.slug || r.id}`}>View Deal</a>
            </div>
          </article>
        ))}
      </div>
      {canShowMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button className="pill" onClick={() => setCount(Math.min(items.length, count + step))}>Show more</button>
        </div>
      )}
    </>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day} ${day === 1 ? "day" : "days"} ago`;
  if (hr > 0) return `${hr} ${hr === 1 ? "hour" : "hours"} ago`;
  if (min > 0) return `${min} ${min === 1 ? "minute" : "minutes"} ago`;
  return `${sec} ${sec === 1 ? "second" : "seconds"} ago`;
}

function formatPrice(n?: number) {
  // Default to $9.99 when missing or zero (mass import fallback)
  if (typeof n !== "number" || !isFinite(n) || n <= 0) return "$9.99";
  return `$${n.toFixed(2)}`;
}
function formatRating(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "4.7";
  return n.toFixed(1);
}
function formatStudents(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "12.3k";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
function discountPct(price?: number, original?: number) {
  if (typeof price !== "number" || typeof original !== "number" || !isFinite(price) || !isFinite(original) || original <= price || price <= 0) return 0;
  return Math.round(100 - (price / original) * 100);
}

function isNew(updatedAt?: string) {
  if (!updatedAt) return false;
  const ms = Date.now() - new Date(updatedAt).getTime();
  if (!isFinite(ms) || ms < 0) return false;
  const hours = ms / 3600000;
  return hours < 48; // within 48 hours
}

function isBestSeller(price?: number, original?: number, students?: number) {
  const disc = discountPct(price, original);
  const many = typeof students === "number" && students >= 50000;
  return disc >= 80 || many;
}

"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function ActionsPanel({ deal }: { deal: { id: string; title: string; url: string } }) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    try {
      const key = wishlistKey();
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      setWishlisted(Boolean(data[deal.id]));
    } catch {}
  }, [deal.id]);

  const toggleWishlist = useCallback(() => {
    try {
      const key = wishlistKey();
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      if (data[deal.id]) {
        delete data[deal.id];
        setWishlisted(false);
      } else {
        data[deal.id] = { savedAt: Date.now(), title: deal.title, url: deal.url };
        setWishlisted(true);
      }
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }, [deal.id, deal.title, deal.url]);

  const share = useCallback(async () => {
    const shareData = {
      title: deal.title,
      text: deal.title,
      url: typeof window !== "undefined" ? window.location.href : deal.url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard");
      } catch {}
    }
  }, [deal.title, deal.url]);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={share} className="pill" style={{ cursor: "pointer" }}>Share</button>
      <button onClick={toggleWishlist} className="pill" style={{ cursor: "pointer", background: wishlisted ? "#151a28" : undefined }}>
        {wishlisted ? "Wishlisted" : "Add to wishlist"}
      </button>
    </div>
  );
}

function wishlistKey(){ return "courseswyn:wishlist"; }

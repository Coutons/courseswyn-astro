"use client";
import React, { useMemo, useState, useEffect } from "react";
import DealCard from "@/components/DealCard";

export default function DealsList({
  initialItems,
  initialPage,
  totalPages,
  baseParams,
  allDeals,
}: {
  initialItems: any[];
  initialPage: number;
  totalPages: number;
  baseParams: Record<string, string | undefined>;
  allDeals?: any[];
}) {
  const [isClient, setIsClient] = useState(false);
  const [items, setItems] = useState<any[]>(initialItems || []);
  const [page, setPage] = useState<number>(initialPage || 1);
  const [loading, setLoading] = useState(false);

  // Detect client environment to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const canShowMore = page < totalPages;

  function loadMore() {
    if (!canShowMore || loading) return;
    setLoading(true);
    
    try {
      const pageSize = parseInt(baseParams.pageSize || "12", 10);
      const nextPage = page + 1;
      const start = (nextPage - 1) * pageSize;
      
      // Use all deals passed from server
      let filteredDeals = allDeals || [];
      
      // Apply filters if any
      if (baseParams.category) {
        filteredDeals = filteredDeals.filter(d =>
          d.category?.toLowerCase() === baseParams.category?.toLowerCase() ||
          d.subcategory?.toLowerCase() === baseParams.category?.toLowerCase()
        );
      }

      if (baseParams.provider) {
        filteredDeals = filteredDeals.filter(d => 
          d.provider?.toLowerCase() === baseParams.provider?.toLowerCase()
        );
      }

      if (baseParams.q) {
        const query = baseParams.q.toLowerCase();
        filteredDeals = filteredDeals.filter(d =>
          d.title?.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query)
        );
      }

      // Get the next page of items
      const newItems = filteredDeals.slice(start, start + pageSize);
      
      // Add new items to existing items
      setItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid" suppressHydrationWarning={true}>
        {items.map((d: any) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
      {canShowMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button className="pill" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Show more"}
          </button>
        </div>
      )}
    </>
  );
}

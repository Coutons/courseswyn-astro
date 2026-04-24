"use client";

import React, { useState, useEffect } from "react";

export default function HeaderSearch() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  
  const searchTerms = [
    "JavaScript",
    "Python", 
    "React",
    "Web development",
    "100 days of code",
    "TypeScript",
    "Node.js",
    "Machine learning"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % searchTerms.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <form
      action="/search"
      method="get"
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <input
        type="search"
        name="q"
        placeholder={`${searchTerms[currentPlaceholder]}...`}
        aria-label="Search courses"
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid var(--brand-soft)",
          background: "rgba(15, 19, 32, 0.8)",
          color: "#e6e9f2",
          minWidth: 180,
          transition: "all 0.3s ease",
          boxShadow: "0 0 0 0 transparent",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.2)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--brand-soft)";
          e.target.style.boxShadow = "0 0 0 0 transparent";
        }}
      />
      <button
        type="submit"
        className="pill"
        style={{ 
          padding: "6px 14px",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          border: "1px solid #3b82f6",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #2563eb, #1e40af)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <span style={{ color: "#ffffff", fontWeight: 500 }}>Search</span>
      </button>
    </form>
  );
}

"use client";

import React, { useState, useEffect } from "react";

export default function HeaderSearch() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  
  const searchTerms = [
    "Python", 
    "JavaScript",
    "React 2026",
    "Web Dev",
    "AI Agents",
    "Cybersecurity",
    "Data Science",
    "Business"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % searchTerms.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <form
      action="/search"
      method="get"
      style={{ display: "flex", alignItems: "center", position: "relative" }}
      className="hidden md:flex"
    >
      <input
        type="search"
        name="q"
        placeholder={`Find ${searchTerms[currentPlaceholder]}...`}
        aria-label="Search courses"
        style={{
          padding: "8px 12px 8px 36px",
          borderRadius: "4px",
          border: "2px solid var(--border)",
          background: "white",
          color: "var(--text)",
          minWidth: "180px",
          width: "220px",
          fontSize: "0.85rem",
          fontWeight: 700,
          outline: "none",
          boxShadow: "2px 2px 0 var(--border)",
          fontFamily: "inherit",
          transition: "all 0.15s ease"
        }}
      />
      <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <button
        type="submit"
        style={{ 
          position: "absolute",
          right: "4px",
          background: "var(--accent)",
          color: "white",
          border: "1.5px solid var(--border)",
          borderRadius: "2px",
          padding: "4px 8px",
          fontSize: "0.65rem",
          fontWeight: 900,
          cursor: "pointer",
          letterSpacing: "0.05em"
        }}
      >
        GO
      </button>
    </form>
  );
}

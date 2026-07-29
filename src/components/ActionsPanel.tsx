"use client";
import { useState } from "react";

interface ActionsPanelProps {
  deal: {
    id: string;
    title: string;
    url: string;
  };
}

export default function ActionsPanel({ deal }: ActionsPanelProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.share({ title: deal.title, url: window.location.href });
    } catch {
      // fallback: copy url
      navigator.clipboard.writeText(window.location.href);
    }
    setShowMenu(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="More actions"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: "100%",
              marginBottom: "4px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "4px",
              zIndex: 100,
              minWidth: "140px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 12px",
                background: "none",
                border: "none",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "0.82rem",
                borderRadius: "4px",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMenu(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 12px",
                background: "none",
                border: "none",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "0.82rem",
                borderRadius: "4px",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}

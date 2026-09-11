import { type ReactNode } from "react";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  const isProduction = hostname.includes(".com") && !hostname.includes("localhost");

  if (isProduction) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b0e14",
        color: "#EDE9DC",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}>
        <div>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: ".85rem",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1rem",
            background: "rgba(255,201,77,.12)",
            border: "1px solid rgba(255,201,77,.30)",
            color: "#ffc94d",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
          </div>
          <h2 style={{ margin: "0 0 .5rem", fontSize: "1.5rem" }}>Admin Access Blocked</h2>
          <p style={{ margin: 0, color: "#868d9b" }}>Production admin access is disabled.</p>
          <small style={{ color: "#5a6472" }}>Hostname: {hostname}</small>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

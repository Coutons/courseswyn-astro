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
        backgroundColor: "#dc2626",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}>
        <div>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚫</div>
          <h2 style={{ margin: "0 0 .5rem", fontSize: "1.5rem" }}>Admin Access Blocked</h2>
          <p style={{ margin: 0 }}>Production admin access is disabled.</p>
          <small>Hostname: {hostname}</small>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

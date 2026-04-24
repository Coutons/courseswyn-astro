import { type ReactNode } from "react";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  // SIMPLIFIED: Just allow everything in development
  const hostname = typeof window !== "undefined" ? window.location.hostname : '';

  // Block only production
  const isProduction = hostname.includes('.com') && !hostname.includes('localhost');

  console.log('🔧 ADMIN GATE CHECK:', { hostname, isProduction });

  if (isProduction) {
    return (
      <div style={{
        padding: "4rem",
        textAlign: "center",
        backgroundColor: "#dc2626",
        color: "white",
        minHeight: "100vh"
      }}>
        <h2>🚫 Admin Access Blocked</h2>
        <p>Production admin access is disabled</p>
        <small>Hostname: {hostname}</small>
      </div>
    );
  }

  // Allow everything in development - no authentication needed
  console.log('✅ DEV MODE: Admin access allowed');
  return <>{children}</>;
}

// Keep the old functions for backward compatibility
export function useAdminAuth() {
  return {
    authenticated: true,
    refresh: async () => true,
    logout: async () => {}
  };
}

export function LogoutButton() {
  return null;
}

"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type Message = {
  type: "success" | "error";
  text: string;
};

const successMessages = [
  "You're in! We'll send the latest deals soon.",
  "Thanks for subscribing! Fresh coupons are on the way.",
  "Subscription confirmed. Watch your inbox for new Udemy coupons.",
];

export default function NewsletterSignupCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<Message | null>(null);

  const disabled = status === "loading";

  const pickSuccessMessage = () => {
    const idx = Math.floor(Math.random() * successMessages.length);
    return successMessages[idx];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    try {
      setStatus("loading");
      setMessage(null);
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Unable to subscribe right now." }));
        throw new Error(err.message || "Unable to subscribe right now.");
      }
      setStatus("success");
      setMessage({ type: "success", text: pickSuccessMessage() });
      setEmail("");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to subscribe. Please try again.";
      setStatus("error");
      setMessage({ type: "error", text });
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  };

  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(140deg, rgba(11, 13, 18, 0.98) 0%, rgba(18, 24, 40, 0.98) 55%, rgba(42, 64, 110, 0.38) 100%)",
        borderColor: "rgba(91, 140, 255, 0.24)",
        boxShadow: "0 12px 28px rgba(8, 12, 26, 0.45)",
        display: "grid",
        gap: 12,
      }}
    >
      <div className="card-body" style={{ gap: 12 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                background: "rgba(91, 140, 255, 0.18)",
                color: "var(--brand)",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Stay in the loop
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 20 }}>Get the freshest Udemy coupons</h3>
          <p className="muted" style={{ margin: 0 }}>
            Join 12,000+ learners receiving weekly Udemy free coupons, 100% off deals, and handpicked guides from CoursesWyn.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <label htmlFor="newsletter-email" className="muted" style={{ fontSize: 12 }}>
            Enter your email to subscribe
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={{
                flex: 1,
                minWidth: 220,
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(91, 140, 255, 0.32)",
                background: "rgba(11, 13, 18, 0.86)",
                color: "#eaf4ff",
              }}
              aria-label="Email address"
              disabled={disabled}
            />
            <button
              type="submit"
              className="btn"
              style={{
                background: "linear-gradient(135deg, #5b8cff 0%, #60efff 90%)",
                color: "#05060b",
                border: "none",
                minWidth: 140,
                boxShadow: "0 6px 16px rgba(91, 140, 255, 0.38)",
              }}
              disabled={disabled}
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
        </form>
        {message ? (
          <div
            role="status"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: message.type === "success" ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(248, 113, 113, 0.4)",
              background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(248, 113, 113, 0.1)",
              color: message.type === "success" ? "#bbf7d0" : "#fecaca",
              fontSize: 13,
            }}
          >
            {message.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}

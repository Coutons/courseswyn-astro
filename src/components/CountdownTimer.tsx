"use client";
import { useEffect, useState } from "react";

export default function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!countdown) return null;

  const boxes = [
    { val: countdown.days, label: "Days" },
    { val: countdown.hours, label: "Hrs" },
    { val: countdown.minutes, label: "Min" },
    { val: countdown.seconds, label: "Sec" },
  ];

  return (
    <div class="cd-box-wrap">
      <div class="cd-box-label">Limited Time Offer — Expires Soon</div>
      <div class="cd-box-grid">
        {boxes.map(({ val, label }) => (
          <div key={label} class="cd-box-item">
            <span class="cd-box-num">{String(val).padStart(2, "0")}</span>
            <span class="cd-box-lbl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

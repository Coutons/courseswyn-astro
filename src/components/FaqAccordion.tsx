"use client";
import { useState } from "react";

export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div class="cw-faq-list">
      {items.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} class={`cw-faq-item ${isOpen ? "cw-faq-open" : ""}`} itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
            <button
              class="cw-faq-q"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-a-${i}`}
              id={`faq-q-${i}`}
            >
              <span itemprop="name">{faq.q}</span>
              <svg class="cw-faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div
              id={`faq-a-${i}`}
              class="cw-faq-a"
              role="region"
              aria-labelledby={`faq-q-${i}`}
              hidden={!isOpen}
              itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"
            >
              <p itemprop="text">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

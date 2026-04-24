// Function to build deal links with Impact tracking for Udemy
export function buildDealLink(deal: { provider?: string; url?: string | null; impactUrl?: string | null; coupon?: string | null }) {
  const provider = String(deal.provider || "").toLowerCase().trim();

  // Prefer an explicit Impact tracking URL when present
  if (deal.impactUrl && /^https?:\/\//i.test(deal.impactUrl)) {
    return deal.impactUrl;
  }

  const rawUrl = typeof deal.url === "string" ? deal.url.trim() : "";
  if (!rawUrl) {
    return "";
  }

  // Normalise Udemy links so the Impact STAT tag can transform them client-side
  const baseUrl = (() => {
    if (/^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }
    if (provider === "udemy") {
      const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
      return `https://www.udemy.com${path}`;
    }
    return rawUrl;
  })();

  try {
    const url = new URL(baseUrl);

    if (provider === "udemy") {
      const paramsToRemove = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "irgwc",
        "clickid",
        "irclickid",
        "ir_adid",
        "ir_affiliate",
        "ir_pi",
      ];

      paramsToRemove.forEach((param) => {
        url.searchParams.delete(param);
      });

      if (deal.coupon) {
        if (!url.searchParams.has("coupon") && !url.searchParams.has("couponCode")) {
          url.searchParams.set("coupon", deal.coupon);
        }
      } else {
        const couponMatch = rawUrl.match(/[?&](?:couponCode|coupon)=([^&]+)/i);
        if (couponMatch && !url.searchParams.has("coupon") && !url.searchParams.has("couponCode")) {
          url.searchParams.set("coupon", decodeURIComponent(couponMatch[1]));
        }
      }
    }

    return url.toString();
  } catch {
    return baseUrl;
  }
}

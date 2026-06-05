interface CourseData {
  title: string;
  image: string;
  url: string;
}

function getActualUdemyUrl(link: HTMLAnchorElement): string | null {
  const href = link.href;
  // Direct Udemy link
  if (href.includes("udemy.com") && href.includes("/course/")) {
    return href;
  }
  // Affiliate link with u parameter (trk.udemy.com)
  try {
    const url = new URL(href);
    const uParam = url.searchParams.get("u");
    if (uParam) {
      const decoded = decodeURIComponent(uParam);
      if (decoded.includes("udemy.com")) return decoded;
    }
  } catch {}
  return null;
}

export async function fetchCourseInfo(url: string): Promise<CourseData | null> {
  try {
    const resp = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&timeout=5000&video=false`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const data = await resp.json();
    if (!data?.data) return null;
    const d = data.data;
    return {
      title: d.title || "",
      image: d.image?.url || d.logo?.url || "",
      url,
    };
  } catch {
    return null;
  }
}

export function extractUdemyLinks(
  container: HTMLElement,
): { link: HTMLAnchorElement; udemyUrl: string }[] {
  const links = container.querySelectorAll<HTMLAnchorElement>("a");
  const results: { link: HTMLAnchorElement; udemyUrl: string }[] = [];
  for (const a of Array.from(links)) {
    if (a.closest(".course-embed")) continue;
    const udemyUrl = getActualUdemyUrl(a);
    if (udemyUrl) results.push({ link: a, udemyUrl });
  }
  return results;
}

export function renderCard(
  data: CourseData,
  originalLink: HTMLAnchorElement,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "course-embed";
  card.style.cssText = `
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    margin: 1.5rem 0;
    background: var(--card);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  `;
  card.onmouseenter = () => {
    card.style.transform = "translateY(-2px)";
    card.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
  };
  card.onmouseleave = () => {
    card.style.transform = "";
    card.style.boxShadow = "";
  };
  card.onclick = () => {
    window.open(originalLink.href, "_blank");
  };

  const domain = data.url.replace(/^https?:\/\//, "").split("/")[0];

  card.innerHTML = `
    <div style="display:flex;text-decoration:none;color:inherit;">
      <div style="width:180px;min-height:130px;flex-shrink:0;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${
          data.image
            ? `<img src="${data.image}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />`
            : `<svg width="36" height="36" viewBox="0 0 24 24" fill="var(--muted)" opacity="0.3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
        }
      </div>
      <div style="flex:1;padding:1rem;display:flex;flex-direction:column;justify-content:center;min-width:0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="background:var(--brand-soft);color:var(--brand);font-size:0.6rem;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.04em;">UDEMY</span>
          <span style="color:var(--muted);font-size:0.7rem;">Course</span>
        </div>
        <div style="font-size:0.9rem;font-weight:600;color:var(--text);margin-bottom:4px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
          ${data.title}
        </div>
        <div style="font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:12px;margin-top:6px;">
          <span>${domain}</span>
          <span style="color:var(--brand);font-weight:600;">View Course →</span>
        </div>
      </div>
    </div>
  `;
  return card;
}

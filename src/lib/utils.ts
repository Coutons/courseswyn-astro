export function normName(raw?: string | null) {
  if (!raw) return undefined;
  let v = String(raw).trim();
  v = v.replace(/&amp;/gi, "&");
  v = v.replace(/\s+/g, " ");
  return v || undefined;
}

export function slugifyCategory(name: string) {
  if (name === "Uncategorized") return "uncategorized";
  let v = name.toLowerCase();
  v = v.replace(/&amp;/gi, "&");
  v = v.replace(/&/g, " and ");
  v = v.replace(/[^\w\s-]/g, "");
  v = v.trim();
  v = v.replace(/\s+/g, "-");
  v = v.replace(/-+/g, "-");
  return v;
}

export function slugifyTitle(title: string): string {
  let v = String(title).toLowerCase();
  v = v.replace(/&amp;/gi, "&");
  v = v.replace(/&/g, " and ");
  v = v.replace(/[^\w\s-]/g, "");
  v = v.trim();
  v = v.replace(/\s+/g, "-");
  v = v.replace(/-+/g, "-");
  return v.replace(/^-|-$/g, "");
}

export function slugifyTopic(name: string): string {
  return String(name).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function buildHeroFeed(deals: any[], now: Date, count = 3) {
  return [...deals]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
    .slice(0, count)
    .map((d) => {
      const t = new Date((d as any).updatedAt ?? (d as any).createdAt ?? 0).getTime();
      const mins = Math.max(1, Math.round((now.getTime() - t) / 60000));
      const timeLabel = mins < 60 ? mins + "m ago" : Math.round(mins / 60) + "h ago";
      const pct = d.price && d.originalPrice && d.originalPrice > d.price ? Math.round(100 - (d.price / d.originalPrice) * 100) : 0;
      return { title: String(d.title || ""), slug: String(d.slug), cat: String(d.category || "Udemy").toLowerCase(), pct, timeLabel };
    });
}

export function extractDifficultyLevel(title?: string, description?: string): "Beginner" | "Intermediate" | "Advanced" | "All Levels" {
  const text = `${title || ""} ${description || ""}`.toLowerCase();

  // Check for explicit difficulty keywords
  if (text.includes("beginner") || text.includes("starter") || text.includes("introduction") || text.includes("fundamentals")) {
    return "Beginner";
  }

  if (text.includes("advanced") || text.includes("expert") || text.includes("master") || text.includes("professional")) {
    return "Advanced";
  }

  if (text.includes("intermediate") || text.includes("mid-level") || text.includes("practical")) {
    return "Intermediate";
  }

  // Check for "to advanced" or "beginner to advanced" patterns
  if (text.includes("beginner to advanced") || text.includes("from beginner") || text.includes("basics to advanced")) {
    return "All Levels";
  }

  // Default based on keywords
  if (text.includes("complete guide") || text.includes("comprehensive") || text.includes("step by step")) {
    return "All Levels";
  }

  // If no clear indicators, default to All Levels for most courses
  return "All Levels";
}

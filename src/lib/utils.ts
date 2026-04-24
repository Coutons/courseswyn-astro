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

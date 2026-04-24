export function getBrand(provider?: string): { name: string; icon: string } | null {
  if (!provider) return null;
  const p = provider.toLowerCase();
  if (p.includes("udemy")) return { name: "Udemy", icon: "/brands/udemy.svg" };
  if (p.includes("coursera")) return { name: "Coursera", icon: "/brands/coursera.svg" };
  return null;
}

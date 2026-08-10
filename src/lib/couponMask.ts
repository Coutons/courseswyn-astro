export function maskCoupon(code?: string | null): string {
  const c = (code || "").trim();
  if (!c) return "AUTO-APPLY";
  if (c.length <= 4) return "····";
  if (c.length <= 8) return `${c.slice(0, 4)}···`;
  return `${c.slice(0, 4)}···${c.slice(-2)}`;
}

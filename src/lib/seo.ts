import type { Deal } from "@/types/deal";

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fmtMonthYear(iso: string | undefined, months: string[]): string {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{1,2})/);
  if (!m) return "";
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return "";
  return `${months[mo - 1]} ${m[1]}`;
}

function isSpanishCourse(deal: Deal): boolean {
  return /es\b|spanish|español/i.test(deal.language || "");
}

/**
 * Fully automatic SEO description generated at build time.
 * Format (Comidoc-style):
 *   Save on [title] with a verified Udemy coupon (checked [Month Year]). See current price, availability and course details.
 */
export function generateSeoDescription(deal: Deal): string {
  const es = isSpanishCourse(deal);
  const months = es ? MONTHS_ES : MONTHS_EN;
  const title = (deal.title || "This course").replace(/["“”‘’]/g, " ").replace(/\s+/g, " ").trim();
  const checked =
    fmtMonthYear(deal.updatedAt || deal.createdAt || deal.expiresAt, months) ||
    fmtMonthYear(new Date().toISOString(), months);

  if (es) {
    return `Ahorra en ${title} con un cupón de Udemy verificado (comprobado ${checked}). Consulta el precio actual, la disponibilidad y los detalles del curso.`;
  }
  return `Save on ${title} with a verified Udemy coupon (checked ${checked}). See current price, availability and course details.`;
}

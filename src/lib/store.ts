import { promises as fs } from "fs";
import path from "path";
import { z } from "astro:content";
import type { Deal } from "@/types/deal";
import { toISODateWIB } from "@/lib/date";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "src", "data");

function resolveDealsFilePath(): string {
  const raw = process.env.DEALS_PATH?.trim();
  if (!raw) {
    return path.join(DEFAULT_DATA_DIR, "coupons.json");
  }
  let resolved = path.resolve(raw);
  if (!path.extname(resolved)) {
    resolved = path.join(resolved, "coupons.json");
  }
  return resolved;
}

const DEALS_FILE = resolveDealsFilePath();

let cachedDeals: Deal[] | null = null;
let cachedDealsMtime = 0;

/**
 * Deals are validated on read so invalid or duplicate records never reach
 * the build. Required fields keep every generated page data-complete;
 * optional fields are passed through untouched.
 */
const dealSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    originalPrice: z.number().optional(),
    discount: z.number().optional(),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    provider: z.string().min(1),
    image: z.string().optional(),
    url: z.string().min(1),
    coupon: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    students: z.number().min(0).optional(),
    instructor: z.string().optional(),
    duration: z.string().optional(),
    contentNotes: z.string().optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    learn: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoOgImage: z.string().optional(),
    expiresAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    priceHistory: z.array(z.object({ price: z.number().min(0), checkedAt: z.string() })).optional(),
  })
  .passthrough();

export { dealSchema };

function validateDeals(raw: unknown[]): Deal[] {
  const valid: Deal[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const parsed = dealSchema.safeParse(item);
    if (!parsed.success) {
      skipped.push(`invalid:${String((item as { slug?: string })?.slug ?? "?")}`);
      continue;
    }
    const deal = parsed.data;
    const key = deal.slug;
    if (seen.has(key)) {
      skipped.push(`duplicate:${key}`);
      continue;
    }
    seen.add(key);
    valid.push(deal as Deal);
  }

  if (skipped.length > 0) {
    console.warn(`[deals] ${skipped.length} invalid or duplicate record(s) filtered out: ${skipped.slice(0, 20).join(", ")}${skipped.length > 20 ? "..." : ""}`);
  }
  return valid;
}

export async function readDealsFromFile(): Promise<Deal[]> {
  try {
    const stat = await fs.stat(DEALS_FILE);
    if (cachedDeals && stat.mtimeMs === cachedDealsMtime) return cachedDeals;
    const buf = await fs.readFile(DEALS_FILE, "utf-8");
    const data = JSON.parse(buf) as unknown;
    if (Array.isArray(data)) {
      cachedDeals = validateDeals(data);
      cachedDealsMtime = stat.mtimeMs;
      return cachedDeals;
    }
  } catch (error) {
    console.error('Error reading deals file:', error);
    return [];
  }
  return [];
}

function sortByRecency(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => {
    const timeA = new Date(a.updatedAt ?? a.createdAt ?? a.expiresAt ?? 0).getTime();
    const timeB = new Date(b.updatedAt ?? b.createdAt ?? b.expiresAt ?? 0).getTime();
    return timeB - timeA;
  });
}

export async function readDeals(): Promise<Deal[]> {
  const deals = await readDealsFromFile();
  return sortByRecency(deals);
}

export async function getDealBySlug(slug: string): Promise<Deal | null> {
  const key = String(slug);
  const all = await readDealsFromFile();
  return all.find((deal) => deal.slug === key) ?? null;
}

export async function getAvailableDates(): Promise<string[]> {
  const deals = await readDealsFromFile();
  const dateSet = new Set<string>();
  for (const d of deals) {
    const t = d.updatedAt ?? d.createdAt ?? d.expiresAt;
    if (t) dateSet.add(toISODateWIB(new Date(t)));
  }
  return Array.from(dateSet).sort().reverse();
}

export async function getDeals(options: {
  date?: string;
  limit?: number;
  sortBy?: 'rating';
} = {}): Promise<Deal[]> {
  let deals = await readDealsFromFile();

  if (options.date) {
    deals = deals.filter(deal => {
      const dealDate = new Date(deal.updatedAt ?? deal.createdAt ?? deal.expiresAt ?? 0);
      return toISODateWIB(dealDate) === options.date;
    });
  }

  if (options.sortBy === 'rating') {
    deals = deals.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  if (options.limit) {
    deals = deals.slice(0, options.limit);
  }

  return deals;
}

/* ==================== WRITE OPERATIONS (admin / dev only) ==================== */

async function writeDealsToFile(all: Deal[]): Promise<void> {
  const dir = path.dirname(DEALS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DEALS_FILE, JSON.stringify(all, null, 2), "utf-8");
  cachedDeals = null;
}

export async function writeDeals(all: Deal[]): Promise<void> {
  await writeDealsToFile(all);
}

export async function createDeal(deal: Deal): Promise<Deal> {
  const all = await readDealsFromFile();
  if (all.some((item) => item.slug === deal.slug)) {
    throw new Error("Slug already exists");
  }
  const now = new Date().toISOString();
  const next: Deal = {
    ...deal,
    createdAt: deal.createdAt ?? now,
    updatedAt: deal.updatedAt ?? now,
    priceHistory: deal.priceHistory ?? (typeof deal.price === "number" ? [{ price: deal.price, checkedAt: now }] : undefined),
  };
  all.push(next);
  await writeDealsToFile(sortByRecency(all));
  return next;
}

export async function updateDeal(slug: string, patch: Partial<Deal>): Promise<Deal | null> {
  const all = await readDealsFromFile();
  const index = all.findIndex((d) => d.slug === slug);
  if (index === -1) return null;
  const updated: Deal = {
    ...all[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await writeDealsToFile(sortByRecency(all));
  return updated;
}

export async function deleteDeal(slug: string): Promise<boolean> {
  const all = await readDealsFromFile();
  const next = all.filter((d) => d.slug !== slug);
  if (next.length === all.length) return false;
  await writeDealsToFile(sortByRecency(next));
  return true;
}

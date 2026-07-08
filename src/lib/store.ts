import { promises as fs } from "fs";
import path from "path";
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

export async function readDealsFromFile(): Promise<Deal[]> {
  if (cachedDeals) return cachedDeals;
  try {
    const buf = await fs.readFile(DEALS_FILE, "utf-8");
    const data = JSON.parse(buf) as Deal[];
    if (Array.isArray(data)) {
      cachedDeals = data;
      return data;
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

export async function getDealById(idOrSlug: string): Promise<Deal | null> {
  const key = String(idOrSlug);
  const all = await readDealsFromFile();
  return all.find((deal) => deal.id === key || deal.slug === key) ?? null;
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

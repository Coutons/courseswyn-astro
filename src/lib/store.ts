import { promises as fs } from "fs";
import path from "path";
import type { Deal } from "@/types/deal";

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
const DEALS_DIR = path.dirname(DEALS_FILE);

export async function readDealsFromFile(): Promise<Deal[]> {
  try {
    const buf = await fs.readFile(DEALS_FILE, "utf-8");
    const data = JSON.parse(buf) as Deal[];
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.error('Error reading deals file:', error);
    return [];
  }
  // If data is not an array, return empty array
  return [];
}

async function writeDealsToFile(all: Deal[]): Promise<void> {
  await fs.mkdir(DEALS_DIR, { recursive: true });
  await fs.writeFile(DEALS_FILE, JSON.stringify(all, null, 2), "utf-8");
}

function sortByRecency(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => {
    // Match homepage sorting: updatedAt || createdAt || expiresAt
    const timeA = new Date(a.updatedAt ?? a.createdAt ?? a.expiresAt ?? 0).getTime();
    const timeB = new Date(b.updatedAt ?? b.createdAt ?? b.expiresAt ?? 0).getTime();
    return timeB - timeA;  // Newest first
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

export async function createDeal(deal: Deal): Promise<Deal> {
  const all = await readDealsFromFile();
  if (all.some((item) => item.id === deal.id)) {
    throw new Error("ID already exists");
  }
  if (deal.slug && all.some((item) => item.slug === deal.slug)) {
    throw new Error("Slug already exists");
  }
  const now = new Date().toISOString();
  const next: Deal = {
    ...deal,
    createdAt: deal.createdAt ?? now,
    updatedAt: deal.updatedAt ?? now,
  };
  all.unshift(next);
  const sortedAll = sortByRecency(all);
  await writeDealsToFile(sortedAll);
  return next;
}

export async function updateDeal(id: string, patch: Partial<Deal>): Promise<Deal | null> {
  try {
    console.log(`Updating deal ${id} with:`, patch);
    const deals = await readDealsFromFile();
    const index = deals.findIndex((d) => d.id === id);

    if (index === -1) {
      console.error(`Deal with id ${id} not found`);
      return null;
    }

    const updated = {
      ...deals[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };

    deals[index] = updated;
    const sortedDeals = sortByRecency(deals);
    await writeDealsToFile(sortedDeals);

    console.log('File write attempted. Checking if file updated:');
    const afterUpdate = await readDealsFromFile();
    const updatedDeal = afterUpdate.find(d => d.id === id);
    console.log('Deal in file after update:', JSON.stringify(updatedDeal, null, 2));
    console.log(`Successfully updated deal ${id}`);
    return updated;
  } catch (error) {
    console.error(`Error updating deal ${id}:`, error);
    throw error;
  }
}

export async function deleteDeal(id: string): Promise<void> {
  const all = await readDealsFromFile();
  const next = all.filter((deal) => deal.id !== id);
  if (next.length === all.length) {
    throw new Error("Not found");
  }
  const sortedDeals = sortByRecency(next);
  await writeDealsToFile(sortedDeals);
}

export async function writeDeals(all: Deal[]): Promise<void> {
  await writeDealsToFile(all);
}

// Helper function to filter and sort deals
export async function getDeals(options: {
  date?: string;
  limit?: number;
  sortBy?: 'rating';
} = {}): Promise<Deal[]> {
  let deals = await readDealsFromFile();

  // Filter by date (YYYY-MM-DD format)
  if (options.date) {
    const targetDate = new Date(options.date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    deals = deals.filter(deal => {
      const dealDate = new Date(deal.updatedAt ?? deal.createdAt ?? deal.expiresAt ?? 0);
      return dealDate >= targetDate && dealDate < nextDay;
    });
  }

  // Sort by rating if requested
  if (options.sortBy === 'rating') {
    deals = deals.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  // Apply limit
  if (options.limit) {
    deals = deals.slice(0, options.limit);
  }

  return deals;
}

/**
 * Get available dates for blog static generation.
 * Capped at MAX_BLOG_DAYS so the site never grows to thousands of pages:
 * - 1 year of daily updates without cap = 365 article pages + many index pages.
 * - With cap 90: at most 90 article pages + 8 index pages (build stays fast, output size fixed).
 * Dates are derived from deals (updatedAt/createdAt/expiresAt). Oldest dates beyond the cap are not generated.
 */
const MAX_BLOG_DAYS = 90;

export async function getAvailableDates(): Promise<string[]> {
  const deals = await readDealsFromFile();
  const dates = new Set<string>();

  deals.forEach(deal => {
    const date = new Date(deal.updatedAt ?? deal.createdAt ?? deal.expiresAt ?? 0);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dates.add(dateString);
  });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  dates.add(today);
  dates.add(yesterday);

  const sortedDates = Array.from(dates).sort().reverse().slice(0, MAX_BLOG_DAYS);
  return sortedDates;
}

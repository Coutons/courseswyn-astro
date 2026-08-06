import { readDeals, readDealsFromFile, createDeal, updateDeal, deleteDeal, dealSchema } from '../../lib/store.js';
import { slugifyTitle } from '../../lib/utils.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const MAX_PRICE_HISTORY = 60;

function uniqueSlug(base, deals, currentSlug) {
  let slug = base || 'coupon';
  let candidate = slug;
  let n = 2;
  while (deals.some((d) => d.slug === candidate && d.slug !== currentSlug)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

function buildPriceHistory(existing, patch) {
  if (patch.priceHistory) return Array.isArray(patch.priceHistory) ? patch.priceHistory.slice(-MAX_PRICE_HISTORY) : undefined;
  const newPrice = patch.price;
  if (typeof newPrice !== 'number') return existing.priceHistory;
  const history = Array.isArray(existing.priceHistory) ? [...existing.priceHistory] : [];
  const last = history[history.length - 1];
  if (last && last.price === newPrice) {
    last.checkedAt = new Date().toISOString();
  } else {
    history.push({ price: newPrice, checkedAt: new Date().toISOString() });
  }
  return history.slice(-MAX_PRICE_HISTORY);
}

export async function GET() {
  try {
    const deals = await readDeals();
    return json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return json({ error: 'Failed to fetch deals' }, 500);
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const deals = await readDealsFromFile();
      const created = [];
      const errors = [];
      for (const [index, item] of body.entries()) {
        try {
          if (!item || typeof item !== 'object') throw new Error('Invalid item');
          const base = item.slug || slugifyTitle(item.title || '');
          const slug = uniqueSlug(base, deals, base);
          const candidate = {
            ...item,
            slug,
            priceHistory: Array.isArray(item.priceHistory) && item.priceHistory.length ? item.priceHistory.slice(-MAX_PRICE_HISTORY) : (typeof item.price === 'number' ? [{ price: item.price, checkedAt: new Date().toISOString() }] : undefined),
          };
          const parsed = dealSchema.safeParse(candidate);
          if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
          const made = await createDeal(parsed.data);
          deals.push(made);
          created.push(made);
        } catch (err) {
          errors.push({ index, error: err.message || 'Failed to create' });
        }
      }
      return json({ created: created.length, errors, deals: created }, 201);
    }

    const deals = await readDealsFromFile();

    const base = body.slug || slugifyTitle(body.title || '');
    const slug = uniqueSlug(base, deals, base);
    delete body.discount;

    const candidate = {
      ...body,
      slug,
      priceHistory: Array.isArray(body.priceHistory) && body.priceHistory.length ? body.priceHistory.slice(-MAX_PRICE_HISTORY) : (typeof body.price === 'number' ? [{ price: body.price, checkedAt: new Date().toISOString() }] : undefined),
    };

    const parsed = dealSchema.safeParse(candidate);
    if (!parsed.success) {
      return json({ error: 'Invalid coupon data', issues: parsed.error.issues }, 400);
    }

    const created = await createDeal(parsed.data);
    return json(created, 201);
  } catch (error) {
    console.error('[API] Error creating coupon:', error);
    return json({ error: error.message || 'Failed to create coupon' }, 500);
  }
}

export async function PUT({ request, params }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || params?.id;
    if (!id) return json({ error: 'Coupon slug is required' }, 400);

    const body = await request.json();
    const deals = await readDealsFromFile();
    const existing = deals.find((d) => d.slug === id);
    if (!existing) return json({ error: 'Coupon not found' }, 404);

    if (Array.isArray(body?.ids) && body.expiresAt) {
      let updatedCount = 0;
      const errors = [];
      for (const target of body.ids) {
        const targetDeal = deals.find((d) => d.slug === target);
        if (!targetDeal) {
          errors.push({ id: target, error: 'not found' });
          continue;
        }
        const res = await updateDeal(targetDeal.slug, { expiresAt: body.expiresAt });
        if (res) updatedCount++;
      }
      return json({ updated: updatedCount, errors });
    }

    if (url.searchParams.get('check') === '1') {
      const history = Array.isArray(existing.priceHistory) ? [...existing.priceHistory] : [];
      const last = history[history.length - 1];
      const currentPrice = existing.price ?? 0;
      if (last && last.price === currentPrice) {
        last.checkedAt = new Date().toISOString();
      } else {
        history.push({ price: currentPrice, checkedAt: new Date().toISOString() });
      }
      const updated = await updateDeal(existing.slug, { priceHistory: history.slice(-MAX_PRICE_HISTORY) });
      return json(updated);
    }

    delete body.discount;
    const patch = { ...body };
    patch.slug = uniqueSlug(body.slug || existing.slug || slugifyTitle(body.title || existing.title || ''), deals, existing.slug);
    patch.priceHistory = buildPriceHistory(existing, body);

    const candidate = { ...existing, ...patch };
    const parsed = dealSchema.safeParse(candidate);
    if (!parsed.success) {
      return json({ error: 'Invalid coupon data', issues: parsed.error.issues }, 400);
    }

    const updated = await updateDeal(existing.slug, parsed.data);
    return json(updated);
  } catch (error) {
    console.error('[API] Error updating coupon:', error);
    return json({ error: error.message || 'Failed to update coupon' }, 500);
  }
}

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Coupon slug is required' }, 400);

    const ok = await deleteDeal(id);
    if (!ok) return json({ error: 'Coupon not found' }, 404);

    return json({ success: true, message: 'Coupon deleted successfully', deletedId: id });
  } catch (error) {
    console.error('[API] Error deleting coupon:', error);
    return json({ error: error.message || 'Failed to delete coupon' }, 500);
  }
}

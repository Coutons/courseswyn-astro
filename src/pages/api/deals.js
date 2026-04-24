import { readDeals, writeDeals } from '../../lib/store.js';

export async function GET() {
  try {
    const deals = await readDeals();
    return new Response(JSON.stringify(deals), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch deals' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST({ request }) {
  try {
    console.log('[API] POST /api/deals - Starting request');

    const deals = await readDeals();
    console.log('[API] Current deals count:', deals.length);

    const newDeal = await request.json();
    console.log('[API] Received new deal data:', JSON.stringify(newDeal, null, 2));

    // Generate unique 4-digit ID if not provided
    if (!newDeal.id) {
      const existingIds = deals.map(deal => deal.id);
      let newId;

      // Keep generating until we find a unique ID
      do {
        newId = Math.floor(1000 + Math.random() * 9000).toString();
      } while (existingIds.includes(newId));

      newDeal.id = newId;
    }
    console.log('[API] Generated unique ID:', newDeal.id);

    // Set timestamps
    const now = new Date().toISOString();
    newDeal.createdAt = now;
    newDeal.updatedAt = now;

    console.log('[API] Adding deal to array...');
    // Add to deals array
    deals.push(newDeal);

    console.log('[API] Writing to file...');
    // Save to file
    await writeDeals(deals);
    console.log('[API] Successfully wrote to file');

    return new Response(JSON.stringify(newDeal), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[API] Error creating deal:', error);
    console.error('[API] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Failed to create deal', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE({ request }) {
  try {
    console.log('[API] DELETE /api/deals - Starting request');

    const url = new URL(request.url);
    const dealId = url.searchParams.get('id');

    if (!dealId) {
      return new Response(JSON.stringify({ error: 'Deal ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[API] Deleting deal with ID:', dealId);

    const deals = await readDeals();
    console.log('[API] Current deals count:', deals.length);

    const initialLength = deals.length;
    const filteredDeals = deals.filter(deal => deal.id !== dealId);

    if (filteredDeals.length === initialLength) {
      console.log('[API] Deal not found with ID:', dealId);
      return new Response(JSON.stringify({ error: 'Deal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[API] Writing updated deals to file...');
    await writeDeals(filteredDeals);
    console.log('[API] Successfully deleted deal, new count:', filteredDeals.length);

    return new Response(JSON.stringify({
      success: true,
      message: 'Deal deleted successfully',
      deletedId: dealId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API] Error deleting deal:', error);
    console.error('[API] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Failed to delete deal', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
import { readDeals } from '../../lib/store.js';

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

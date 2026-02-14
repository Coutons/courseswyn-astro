import type { APIRoute } from 'astro';
import coupons from '../../data/coupons.json';

export const GET: APIRoute = async () => {
  const items = (coupons as any[])
    .slice()
    .sort((a, b) => (Number(b.students) || 0) - (Number(a.students) || 0))
    .slice(0, 12)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      image: c.image,
      category: c.category,
      subcategory: c.subcategory || c.subCategory,
      rating: c.rating,
      students: c.students,
      price: c.price,
      originalPrice: c.originalPrice,
      discount: c.discount,
      provider: c.provider,
      instructor: c.instructor,
      expiresAt: c.expiresAt,
      url: c.url,
      verified: Boolean(c.verified),
    }));

  return new Response(JSON.stringify({ items }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });
};

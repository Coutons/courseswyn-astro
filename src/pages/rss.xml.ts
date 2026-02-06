import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog');
  const site = context.site?.origin ?? 'https://courseswyn.com';

  const items = blogPosts
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${site.replace(/\/$/, '')}/${post.slug}/`,
    }));

  return rss({
    title: 'CoursesWyn · Udemy AI Picks',
    description: 'Roundups of the best Udemy prompt engineering, RAG, and generative AI courses.',
    site,
    items,
  });
}

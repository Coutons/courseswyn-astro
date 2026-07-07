import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const allPosts = await getCollection('blog');
  const posts = allPosts.sort((a, b) => {
    const dateA = a.data.updatedAt || a.data.pubDate;
    const dateB = b.data.updatedAt || b.data.pubDate;
    return dateB.getTime() - dateA.getTime();
  });

  return rss({
    title: 'CoursesWyn Blog - Free Udemy Courses & Verified Coupons',
    description: 'Expert-reviewed guides to the best Udemy courses with verified 100% off coupon codes. Find free programming, AI, data science, cloud certification courses and more.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.updatedAt || post.data.pubDate,
      link: `/blog/${post.data.slug || post.id}/`,
      categories: post.data.tags || [],
    })),
    customData: '<language>en-us</language>',
    trailingSlash: true,
  });
}

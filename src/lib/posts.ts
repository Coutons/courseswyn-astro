import { getCollection, type CollectionEntry } from 'astro:content';

export async function fetchPosts() {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export const PAGE_SIZE = 4;

export function paginate(posts: CollectionEntry<'blog'>[], page: number) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    totalPages,
    currentPage,
    slice: posts.slice(start, start + PAGE_SIZE),
  };
}

export function tagToLabel(tag: string) {
  return tag
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getRelatedPosts(
  posts: CollectionEntry<'blog'>[],
  current: CollectionEntry<'blog'>,
  limit = 3,
) {
  const related = posts.filter((post) => {
    if (post.id === current.id) return false;
    return post.data.tags.some((tag) => current.data.tags.includes(tag));
  });

  return related.slice(0, limit);
}

export function postsByTag(posts: CollectionEntry<'blog'>[], tag: string) {
  return posts.filter((post) => post.data.tags.includes(tag));
}

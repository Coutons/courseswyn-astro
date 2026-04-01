import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ 
    pattern: "**/*.{md,mdx}", 
    base: "./src/content/blog",
    generateId: ({ entry }) => {
  const normalizedPath = entry.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const filename = parts[parts.length - 1];
  if ((filename === 'index.md' || filename === 'index.mdx') && parts.length > 1) {
    return parts[parts.length - 2];
  }
  return normalizedPath.replace(/\.(md|mdx)$/, '').split('/').pop() || '';
},
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedAt: z.date().optional(),
    tags: z.array(z.string()),
    image: image(),
    affiliate_links: z.array(
      z.object({
        url: z.string().url(),
        text: z.string(),
      }),
    ).optional().default([]),
  }),
});

export const collections = { blog };

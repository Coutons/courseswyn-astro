import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ 
    pattern: "**/*.md", 
    base: "./src/content/blog",
    generateId: ({ entry }) => {
      // e.g. "best-excel-courses-udemy-2026/index.md"
      const normalizedPath = entry.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      // If it's an index.md, the ID should be the parent folder name
      if (parts[parts.length - 1] === 'index.md' && parts.length > 1) {
        return parts[parts.length - 2];
      }
      return normalizedPath.replace(/\.md$/, '').split('/').pop() || '';
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

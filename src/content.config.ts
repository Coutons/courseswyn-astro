import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const deals = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    url: z.string().optional(),
    image: z.string().optional(),
    category: z.string(),
    subcategory: z.string().optional(),
    price: z.string(),
    originalPrice: z.string().optional(),
    rating: z.number().optional(),
    students: z.string().optional(),
    duration: z.string().optional(),
    instructor: z.string().optional(),
    language: z.string().optional(),
    level: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    slug: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    expiresAt: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { deals, blog };

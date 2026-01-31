import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
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

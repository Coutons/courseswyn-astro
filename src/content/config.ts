import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    image: z.string(),
    affiliate_links: z.array(
      z.object({
        url: z.string().url(),
        text: z.string(),
      }),
    ),
  }),
});

export const collections = { blog };

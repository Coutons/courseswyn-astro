import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Helper function to get blog post dates for the sitemap
const getBlogDates = () => {
  const blogDir = "src/content/blog";
  const dates = {};
  if (!fs.existsSync(blogDir)) return dates;

  const entries = fs.readdirSync(blogDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const indexPath = path.join(blogDir, entry.name, "index.md");
      if (fs.existsSync(indexPath)) {
        try {
          const file = fs.readFileSync(indexPath, "utf-8");
          const { data } = matter(file);
          // Use updatedAt if available, otherwise pubDate
          const date = data.updatedAt || data.pubDate;
          if (date) {
            dates[entry.name] = new Date(date).toISOString();
          }
        } catch (e) {
          console.error(`Error parsing ${indexPath}:`, e);
        }
      }
    }
  }
  return dates;
};

const blogDates = getBlogDates();

export default defineConfig({
  site: "https://courseswyn.com",
  base: "/",
  output: "static",
  integrations: [
    tailwind(),
    preact(),
    sitemap({
      changefreq: "weekly",
      priority: 0.8,
      entryLimit: 5000,
      serialize(item) {
        // Extract the slug from the URL: https://courseswyn.com/blog/[slug]/
        const match = item.url.match(/\/blog\/([^\/]+)\/?$/);
        if (match && match[1]) {
          const slug = match[1];
          if (blogDates[slug]) {
            item.lastmod = blogDates[slug];
          }
        } else if (item.url === "https://courseswyn.com/" || item.url === "https://courseswyn.com") {
          // Keep homepage with latest update if possible, or build date
          item.lastmod = new Date().toISOString();
        }
        return item;
      },
    }),
  ],
  markdown: {
    remarkPlugins: [
      [
        remarkToc,
        {
          heading: "Table of Contents",
          maxDepth: 3,
          tight: true,
        },
      ],
    ],
  },
  experimental: {
    svgo: true,
  },
});


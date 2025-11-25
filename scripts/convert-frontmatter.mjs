#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)\s*---\s*/;

const slugify = (value) =>
  value
    ?.toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();

const getField = (front, key) => {
  if (!front) return null;
  const regex = new RegExp(`^${key}:\s*(.+)$`, 'mi');
  const match = front.match(regex);
  return match ? match[1].trim() : null;
};

const stripQuotes = (value) => (value ? value.replace(/^['"]|['"]$/g, '') : value);

const parseList = (value) => {
  if (!value) return [];
  const cleaned = value.trim();
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    try {
      return JSON.parse(cleaned.replace(/'/g, '"'));
    } catch {
      // noop
    }
  }
  return cleaned
    .split(',')
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
};

const toDateValue = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const stripJsonLd = (content) =>
  content.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '').trim();

const toPlainText = (content) =>
  content
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractAffiliateLinks = (raw) => {
  const seen = new Set();
  const results = [];

  const push = (text, url) => {
    if (!text || !url) return;
    if (!/trk\.udemy\.com/i.test(url)) return;
    if (seen.has(url)) return;
    results.push({ text: text.trim(), url });
    seen.add(url);
  };

  const mdRegex = /\*?\*?\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
  let match;
  while ((match = mdRegex.exec(raw))) {
    push(match[1], match[2]);
  }

  const htmlRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  while ((match = htmlRegex.exec(raw))) {
    const text = match[2]?.replace(/<[^>]+>/g, '').trim() || 'Enroll now';
    push(text, match[1]);
  }

  return results.slice(0, 8);
};

const discoverMarkdownFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await discoverMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(entryPath);
    }
  }
  return files;
};

const buildFrontmatter = (frontText, body, slug) => {
  const title = stripQuotes(getField(frontText, 'title')) || slug.replace(/-/g, ' ');
  const description =
    stripQuotes(getField(frontText, 'description')) ||
    stripQuotes(getField(frontText, 'seo_description')) ||
    toPlainText(body).slice(0, 240) ||
    'Latest Udemy course insights.';

  const tags = parseList(getField(frontText, 'tags'));
  const categories = parseList(getField(frontText, 'categories'));
  const image = stripQuotes(getField(frontText, 'image')) || `/images/${slug}.jpg`;
  const pubDateSource =
    stripQuotes(getField(frontText, 'publishDate')) ||
    stripQuotes(getField(frontText, 'date')) ||
    stripQuotes(getField(frontText, 'lastmod'));

  return {
    title,
    description,
    pubDate: toDateValue(pubDateSource),
    tags: tags.length ? tags : categories.length ? categories : ['udemy'],
    image,
  };
};

const processFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  const dirName = path.basename(path.dirname(filePath));
  const slug = slugify(dirName || path.basename(filePath, '.md')) || 'post';

  const match = raw.match(FRONTMATTER_REGEX);
  const frontText = match ? match[1] : '';
  const body = match ? raw.slice(match[0].length) : raw;

  const cleanedBody = stripJsonLd(body).trimStart();
  const metadata = buildFrontmatter(frontText, cleanedBody, slug);
  const affiliateLinks = extractAffiliateLinks(cleanedBody);

  const nextFrontmatter = {
    ...metadata,
    affiliate_links: affiliateLinks,
  };

  if (!nextFrontmatter.affiliate_links.length) {
    nextFrontmatter.affiliate_links = [];
  }

  const output = matter.stringify(`${cleanedBody}\n`, nextFrontmatter, { lineWidth: 1000 });
  await fs.writeFile(filePath, output, 'utf-8');
  console.log(`Converted ${filePath}`);
};

const run = async () => {
  const files = await discoverMarkdownFiles(BLOG_DIR);
  for (const file of files) {
    await processFile(file);
  }
  console.log('Frontmatter conversion complete.');
};

run().catch((error) => {
  console.error('Conversion failed:', error);
  process.exit(1);
});

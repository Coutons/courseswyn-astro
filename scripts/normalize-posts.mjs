#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const REQUIRED_FIELDS = ['title', 'description', 'pubDate', 'tags', 'image', 'affiliate_links'];

const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)\s*---/;

const getLineValue = (frontmatter, key) => {
  const regex = new RegExp(`^${key}:\s*(.+)$`, 'mi');
  const match = frontmatter.match(regex);
  return match ? match[1].trim() : null;
};

const stripQuotes = (value) => (value ? value.replace(/^['"]|['"]$/g, '') : value);

const parseArray = (value) => {
  if (!value) return [];
  let normalized = value.trim();
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    try {
      return JSON.parse(normalized.replace(/'/g, '"'));
    } catch {
      // fall through
    }
  }
  return normalized
    .split(',')
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
};

const toDate = (value) => {
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

  const pushLink = (text, url) => {
    if (!text || !url) return;
    if (!/trk\.udemy\.com/i.test(url)) return;
    if (seen.has(url)) return;
    results.push({ text: text.trim(), url });
    seen.add(url);
  };

  const mdRegex = /\*\*?\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
  let match;
  while ((match = mdRegex.exec(raw))) {
    pushLink(match[1], match[2]);
  }

  const htmlRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  while ((match = htmlRegex.exec(raw))) {
    const text = match[2]?.replace(/<[^>]+>/g, '').trim() || 'Enroll now';
    pushLink(text, match[1]);
  }

  return results.slice(0, 8);
};

const buildFrontmatter = (frontmatterRaw, fallbackDescription, fallbackImage) => {
  const title = stripQuotes(getLineValue(frontmatterRaw, 'title')) || 'Untitled Post';
  const description = stripQuotes(getLineValue(frontmatterRaw, 'description')) || fallbackDescription;
  const image = stripQuotes(getLineValue(frontmatterRaw, 'image')) || fallbackImage;
  const tags = parseArray(getLineValue(frontmatterRaw, 'tags'));
  const categories = parseArray(getLineValue(frontmatterRaw, 'categories'));
  const publishDate = stripQuotes(getLineValue(frontmatterRaw, 'publishDate'));
  const date = stripQuotes(getLineValue(frontmatterRaw, 'date'));
  const lastmod = stripQuotes(getLineValue(frontmatterRaw, 'lastmod'));

  return {
    title,
    description,
    pubDate: toDate(publishDate || date || lastmod),
    tags: tags.length ? tags : categories.length ? categories : ['udemy'],
    image,
  };
};

const normalizeFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  const slug = path.basename(filePath, '.md');
  const frontmatterMatch = raw.match(FRONTMATTER_REGEX);
  const frontmatterRaw = frontmatterMatch ? frontmatterMatch[1] : '';
  const body = frontmatterMatch ? raw.replace(FRONTMATTER_REGEX, '') : raw;

  const cleanedContent = stripJsonLd(body).trim();
  const fallbackDescription = toPlainText(cleanedContent).slice(0, 240) || 'Latest Udemy course insights.';
  const fallbackImage = `/images/${slug}.jpg`;

  const fm = buildFrontmatter(frontmatterRaw, fallbackDescription, fallbackImage);
  const affiliateLinks = extractAffiliateLinks(cleanedContent) || [];

  const nextFrontmatter = {
    ...fm,
    affiliate_links: affiliateLinks,
  };

  REQUIRED_FIELDS.forEach((field) => {
    if (!nextFrontmatter[field]) {
      if (field === 'affiliate_links') nextFrontmatter[field] = [];
      if (field === 'tags') nextFrontmatter[field] = ['udemy'];
      if (field === 'image') nextFrontmatter[field] = fallbackImage;
      if (field === 'description') nextFrontmatter[field] = fallbackDescription;
      if (field === 'pubDate') nextFrontmatter[field] = toDate();
    }
  });

  const output = matter.stringify(`${cleanedContent}\n`, nextFrontmatter, { lineWidth: 1000 });
  await fs.writeFile(filePath, output.trim() + '\n', 'utf-8');
  console.log(`Normalized ${path.basename(filePath)}`);
};

const run = async () => {
  const entries = await fs.readdir(BLOG_DIR);
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    await normalizeFile(path.join(BLOG_DIR, entry));
  }
  console.log('All posts normalized.');
};

run().catch((error) => {
  console.error('Normalization failed:', error);
  process.exit(1);
});

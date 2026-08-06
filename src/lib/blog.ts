import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

export interface BlogPostMeta {
  slug: string;
  file: string;
  title: string;
  description?: string;
  pubDate?: string;
  updatedAt?: string;
  draft?: boolean;
  tags?: string[];
  author?: string;
  image?: string;
}

export interface BlogPost extends BlogPostMeta {
  data: Record<string, unknown>;
  body: string;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function flattenImage(v: unknown): string | undefined {
  if (!v) return undefined;
  if (isObject(v) && typeof v.src === "string") return v.src;
  return typeof v === "string" ? v : undefined;
}

export function slugifyBlogTitle(title: string): string {
  let v = String(title || "").toLowerCase();
  v = v.replace(/&/g, " and ");
  v = v.replace(/[^\w\s-]/g, "");
  v = v.trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  return v.replace(/^-|-$/g, "");
}

function safeSlug(slug: string): string {
  return String(slug || "").trim().replace(/[\\/]/g, "").replace(/\s+/g, "-");
}

async function postPathFor(slug: string): Promise<string | null> {
  const dir = path.join(BLOG_DIR, safeSlug(slug));
  for (const name of ["index.md", "index.mdx"]) {
    const file = path.join(dir, name);
    try {
      await fs.access(file);
      return file;
    } catch {}
  }
  return null;
}

export async function listBlogPosts(): Promise<BlogPostMeta[]> {
  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true }).catch(() => []);
  const posts: BlogPostMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = await postPathFor(slug);
    if (!file) continue;
    try {
      const raw = await fs.readFile(file, "utf-8");
      const { data } = matter(raw);
      posts.push({
        slug,
        file,
        title: asString(data.title) || slug,
        description: data.description ? asString(data.description) : undefined,
        pubDate: data.pubDate ? asString(data.pubDate) : undefined,
        updatedAt: data.updatedAt ? asString(data.updatedAt) : undefined,
        draft: !!data.draft,
        tags: Array.isArray(data.tags) ? data.tags.map(asString).filter(Boolean) : undefined,
        author: data.author ? asString(data.author) : undefined,
        image: flattenImage(data.image),
      });
    } catch (err) {
      console.error(`[blog] failed to read ${slug}:`, err);
    }
  }

  posts.sort((a, b) => {
    const ta = new Date(a.pubDate ?? 0).getTime();
    const tb = new Date(b.pubDate ?? 0).getTime();
    return tb - ta;
  });
  return posts;
}

export async function readBlogPost(slug: string): Promise<BlogPost | null> {
  const file = await postPathFor(slug);
  if (!file) return null;
  try {
    const raw = await fs.readFile(file, "utf-8");
    const { data, content } = matter(raw);
    const meta: Record<string, unknown> = data as Record<string, unknown>;
    return {
      slug: safeSlug(slug),
      file,
      title: asString(meta.title) || safeSlug(slug),
      description: meta.description ? asString(meta.description) : undefined,
      pubDate: meta.pubDate ? asString(meta.pubDate) : undefined,
      updatedAt: meta.updatedAt ? asString(meta.updatedAt) : undefined,
      draft: !!meta.draft,
      tags: Array.isArray(meta.tags) ? meta.tags.map(asString).filter(Boolean) : undefined,
      author: meta.author ? asString(meta.author) : undefined,
      image: flattenImage(meta.image),
      data: meta,
      body: content,
    };
  } catch {
    return null;
  }
}

export async function writeBlogPost(opts: {
  slug: string;
  prevSlug?: string;
  data: Record<string, unknown>;
  body: string;
}): Promise<{ slug: string }> {
  const slug = safeSlug(opts.slug) || "untitled";
  const dir = path.join(BLOG_DIR, slug);
  await fs.mkdir(dir, { recursive: true });

  const frontmatter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(opts.data)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    frontmatter[key] = value;
  }

  const file = path.join(dir, "index.md");
  await fs.writeFile(file, matter.stringify(opts.body, frontmatter), "utf-8");

  if (opts.prevSlug && opts.prevSlug !== slug) {
    await fs.rm(path.join(BLOG_DIR, safeSlug(opts.prevSlug)), { recursive: true, force: true });
  }
  return { slug };
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const file = await postPathFor(slug);
  if (!file) return false;
  await fs.rm(path.dirname(file), { recursive: true, force: true });
  return true;
}

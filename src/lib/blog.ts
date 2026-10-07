import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";

// Minimal frontmatter parser/stringifier compatible with gray-matter's
// basic behaviour, backed by `yaml` v2 (safe by default).
// This avoids gray-matter@4 which calls `yaml.safeLoad` — an API removed
// in js-yaml v4 (forced via package.json overrides) and crashes on save.
function parseMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const text = String(raw ?? "");
  if (!text.startsWith("---")) return { data: {}, content: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, content: text };
  const yamlText = text.slice(3, end).replace(/^\r?\n/, "");
  let data: Record<string, unknown> = {};
  try {
    const parsed = YAML.parse(yamlText) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    data = {};
  }
  let content = text.slice(end + 4);
  if (content.startsWith("\r\n")) content = content.slice(2);
  else if (content.startsWith("\n")) content = content.slice(1);
  return { data, content };
}

function stringifyMatter(body: string, data: Record<string, unknown>): string {
  const yamlText = YAML.stringify(data ?? {}).trimEnd();
  return yamlText ? `---\n${yamlText}\n---\n${String(body ?? "")}` : String(body ?? "");
}

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
  // Prefer .mdx when both exist: MDX is a superset of Markdown and the
  // canonical format in this repo (supports `import` + components).
  for (const name of ["index.mdx", "index.md"]) {
    const file = path.join(dir, name);
    try {
      await fs.access(file);
      return file;
    } catch {}
  }
  return null;
}

// Detect MDX-only syntax (imports, JSX components) that would render as
// literal text if saved as plain .md.
function looksLikeMdx(body: string): boolean {
  const text = String(body ?? "");
  if (/^\s*import\s+.+\sfrom\s+['"][^'"]+['"];?\s*$/m.test(text)) return true;
  if (/<[A-Z][A-Za-z0-9]*(?:\s[^<>]*)?\/?>/.test(text)) return true;
  return false;
}

async function extInDir(dir: string): Promise<"mdx" | "md" | null> {
  for (const name of ["index.mdx", "index.md"]) {
    try {
      await fs.access(path.join(dir, name));
      return name.endsWith("mdx") ? "mdx" : "md";
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
      const { data } = parseMatter(raw);
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
    const { data, content } = parseMatter(raw);
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

  // Preserve the original extension: an .mdx post contains `import`
  // statements and components (e.g. DealEmbed) that render as literal text
  // if saved as plain .md. Bodies with MDX syntax are upgraded to .mdx.
  let ext: "mdx" | "md" = "mdx";
  if (!looksLikeMdx(opts.body)) {
    const prevDir = path.join(BLOG_DIR, safeSlug(opts.prevSlug ?? slug));
    ext = (await extInDir(prevDir)) ?? (await extInDir(dir)) ?? "mdx";
  }

  const file = path.join(dir, `index.${ext}`);
  await fs.writeFile(file, stringifyMatter(opts.body, frontmatter), "utf-8");

  // Remove a stale sibling with the other extension (created by older saves
  // that always wrote index.md) so the content loader never sees duplicates.
  const stale = path.join(dir, ext === "mdx" ? "index.md" : "index.mdx");
  await fs.rm(stale, { force: true });

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

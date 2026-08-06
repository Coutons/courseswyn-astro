import { listBlogPosts, readBlogPost, writeBlogPost, deleteBlogPost, slugifyBlogTitle } from '../../lib/blog.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function cleanSlug(s) {
  return String(s || '').trim().replace(/[\\/]/g, '').replace(/\s+/g, '-');
}

function buildData(body, existing) {
  const data = existing ? { ...existing.data } : {};
  if (body.title != null) data.title = String(body.title).trim();
  if (body.description != null) data.description = String(body.description).trim();
  if (body.pubDate) data.pubDate = body.pubDate;
  if (body.updatedAt) data.updatedAt = body.updatedAt;
  if (Array.isArray(body.tags)) {
    const tags = body.tags.map((t) => String(t).trim()).filter(Boolean);
    if (tags.length) data.tags = tags;
    else delete data.tags;
  }
  if (body.author != null) {
    const author = String(body.author).trim();
    if (author) data.author = author;
    else delete data.author;
  }
  if (body.image != null) {
    const image = String(body.image).trim();
    if (image) data.image = image;
    else delete data.image;
  }
  if (body.draft != null) {
    if (body.draft) data.draft = true;
    else delete data.draft;
  }
  return data;
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const slug = cleanSlug(url.searchParams.get('slug'));
    if (slug) {
      const post = await readBlogPost(slug);
      if (!post) return json({ error: 'Post not found' }, 404);
      return json(post);
    }
    const posts = await listBlogPosts();
    return json(posts);
  } catch (error) {
    console.error('[API] Error reading blog posts:', error);
    return json({ error: error.message || 'Failed to read blog posts' }, 500);
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    if (!body?.title || !String(body.title).trim()) return json({ error: 'Title is required' }, 400);
    if (!body?.description || !String(body.description).trim()) return json({ error: 'Description is required' }, 400);

    const slug = cleanSlug(body.slug) || slugifyBlogTitle(body.title);
    if (!slug) return json({ error: 'Could not generate a slug' }, 400);
    const existing = await readBlogPost(slug);
    if (existing) return json({ error: 'A post with that slug already exists' }, 409);

    const data = buildData(body, null);
    data.pubDate = body.pubDate || new Date().toISOString();

    const created = await writeBlogPost({ slug, data, body: String(body.body ?? '') });
    return json(created, 201);
  } catch (error) {
    console.error('[API] Error creating blog post:', error);
    return json({ error: error.message || 'Failed to create blog post' }, 500);
  }
}

export async function PUT({ request }) {
  try {
    const url = new URL(request.url);
    const prevSlug = cleanSlug(url.searchParams.get('slug'));
    if (!prevSlug) return json({ error: 'Post slug is required' }, 400);

    const existing = await readBlogPost(prevSlug);
    if (!existing) return json({ error: 'Post not found' }, 404);

    const body = await request.json();
    const slug = cleanSlug(body.slug) || existing.slug;
    if (slug !== prevSlug) {
      const clash = await readBlogPost(slug);
      if (clash) return json({ error: 'A post with that slug already exists' }, 409);
    }

    const data = buildData(body, existing);
    data.updatedAt = body.updatedAt || new Date().toISOString();

    await writeBlogPost({
      slug,
      prevSlug,
      data,
      body: typeof body.body === 'string' ? body.body : existing.body,
    });
    return json({ slug });
  } catch (error) {
    console.error('[API] Error updating blog post:', error);
    return json({ error: error.message || 'Failed to update blog post' }, 500);
  }
}

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const slug = cleanSlug(url.searchParams.get('slug'));
    if (!slug) return json({ error: 'Post slug is required' }, 400);

    const existing = await readBlogPost(slug);
    if (!existing) return json({ error: 'Post not found' }, 404);

    await deleteBlogPost(slug);
    return json({ success: true, deletedSlug: slug });
  } catch (error) {
    console.error('[API] Error deleting blog post:', error);
    return json({ error: error.message || 'Failed to delete blog post' }, 500);
  }
}

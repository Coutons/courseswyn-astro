import { listInstructors, getInstructorProfile, setInstructorImage } from '../../lib/instructorProfiles.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function cleanSlug(s) {
  return String(s || '').trim().replace(/[\\/]/g, '').replace(/\s+/g, '-');
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const slug = cleanSlug(url.searchParams.get('slug'));
    if (slug) {
      const profile = await getInstructorProfile(slug);
      return json(profile || {});
    }
    const instructors = await listInstructors();
    return json(instructors);
  } catch (error) {
    console.error('[API] Error reading instructors:', error);
    return json({ error: error.message || 'Failed to read instructors' }, 500);
  }
}

export async function PUT({ request }) {
  try {
    const body = await request.json();
    const slug = cleanSlug(body.slug);
    if (!slug) return json({ error: 'Instructor slug is required' }, 400);

    const image = typeof body.image === 'string' ? body.image.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (image && !/^https?:\/\//i.test(image)) {
      return json({ error: 'Image must be a valid http(s) URL' }, 400);
    }

    const profile = await setInstructorImage(slug, image, name);
    return json(profile);
  } catch (error) {
    console.error('[API] Error updating instructor:', error);
    return json({ error: error.message || 'Failed to update instructor' }, 500);
  }
}

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { readDeals } from './store';
import { parseInstructors, createInstructorSlug } from './instructors';

export interface InstructorProfile {
  name?: string;
  image?: string;
}

const profilesFile = fileURLToPath(new URL('../data/instructors.json', import.meta.url));

export async function readInstructorProfiles(): Promise<Record<string, InstructorProfile>> {
  try {
    const raw = await fs.readFile(profilesFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export async function getInstructorProfile(slug: string): Promise<InstructorProfile | undefined> {
  const profiles = await readInstructorProfiles();
  return profiles[slug];
}

export async function getInstructorImage(slug: string): Promise<string | undefined> {
  const profile = await getInstructorProfile(slug);
  const image = profile?.image;
  return image ? image : undefined;
}

export async function setInstructorImage(slug: string, image: string, name?: string): Promise<InstructorProfile> {
  const profiles = await readInstructorProfiles();
  const existing = profiles[slug] || {};
  if (image) existing.image = image;
  else delete existing.image;
  if (name) existing.name = name;
  if (!existing.image && !existing.name) delete profiles[slug];
  else profiles[slug] = existing;
  await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2) + '\n', 'utf8');
  return profiles[slug] || {};
}

export interface InstructorEntry {
  slug: string;
  name: string;
  count: number;
  image?: string;
}

export async function listInstructors(): Promise<InstructorEntry[]> {
  const [deals, profiles] = await Promise.all([readDeals(), readInstructorProfiles()]);

  const map = new Map<string, InstructorEntry>();
  for (const deal of deals) {
    if (!deal.instructor) continue;
    for (const name of parseInstructors(deal.instructor)) {
      const slug = createInstructorSlug(name);
      if (!slug) continue;
      const existing = map.get(slug);
      if (existing) existing.count += 1;
      else map.set(slug, { slug, name, count: 1, image: profiles[slug]?.image });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

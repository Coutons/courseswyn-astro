/**
 * Helper: Parse multiple instructors from comma-separated string
 */
export function parseInstructors(instructorField: string | undefined): string[] {
  if (!instructorField) return [];
  return instructorField
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Helper: Create slug from instructor name
 */
export function createInstructorSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}
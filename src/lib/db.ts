// Simple in-memory store for demonstration
// In a production app, replace this with your actual database calls

interface Deal {
  id: string;
  title: string;
  // Add other deal properties as needed
}

// In-memory store for demo purposes
const deals: Record<string, Deal> = {};

export async function getDeal(id: string): Promise<Deal | null> {
  // In a real app, this would query your database
  return deals[id] || null;
}

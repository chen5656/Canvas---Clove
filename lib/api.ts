import { RecipeItem } from './group-by-month';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export async function fetchRecipes(userId: string): Promise<RecipeItem[]> {
  const res = await fetch(`${API_BASE}/api/recipes?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const data = await res.json();
  return data.recipes;
}

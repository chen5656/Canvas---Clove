/**
 * Group recipes by month for the home feed.
 * Recipes should be pre-sorted by created_at DESC.
 */

export interface RecipeItem {
  id: string;
  title: string;
  coverImageUrl: string | null;
  category: string;
  createdAt: string; // ISO datetime string
}

export interface MonthGroup {
  label: string;      // e.g. "FEBRUARY 2026"
  yearMonth: string;  // e.g. "2026-02" for keying
  recipes: RecipeItem[];
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export function getYearMonth(dateStr: string): string {
  // Handle both "2026-02-23 04:46:12" and "2026-02-23T04:46:12Z"
  return dateStr.slice(0, 7); // "2026-02"
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function groupByMonth(recipes: RecipeItem[]): MonthGroup[] {
  if (recipes.length === 0) return [];

  const groups: Map<string, RecipeItem[]> = new Map();
  const order: string[] = [];

  for (const recipe of recipes) {
    const ym = getYearMonth(recipe.createdAt);
    if (!groups.has(ym)) {
      groups.set(ym, []);
      order.push(ym);
    }
    groups.get(ym)!.push(recipe);
  }

  return order.map(ym => ({
    label: formatMonthLabel(ym),
    yearMonth: ym,
    recipes: groups.get(ym)!,
  }));
}

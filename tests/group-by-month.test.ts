import { describe, it, expect } from '@jest/globals';
import {
  groupByMonth,
  getYearMonth,
  formatMonthLabel,
  RecipeItem,
} from '../lib/group-by-month';

const makeRecipe = (id: string, title: string, createdAt: string): RecipeItem => ({
  id,
  title,
  coverImageUrl: null,
  category: 'test',
  createdAt,
});

describe('getYearMonth', () => {
  it('extracts year-month from datetime string', () => {
    expect(getYearMonth('2026-02-23 04:46:12')).toBe('2026-02');
  });

  it('handles ISO format', () => {
    expect(getYearMonth('2025-12-05T03:31:32Z')).toBe('2025-12');
  });
});

describe('formatMonthLabel', () => {
  it('formats as "MONTH YEAR"', () => {
    expect(formatMonthLabel('2026-02')).toBe('FEBRUARY 2026');
    expect(formatMonthLabel('2025-10')).toBe('OCTOBER 2025');
  });

  it('handles January', () => {
    expect(formatMonthLabel('2026-01')).toBe('JANUARY 2026');
  });

  it('handles December', () => {
    expect(formatMonthLabel('2025-12')).toBe('DECEMBER 2025');
  });
});

describe('groupByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('groups a single recipe', () => {
    const recipes = [makeRecipe('1', 'Test', '2026-02-01 00:00:00')];
    const groups = groupByMonth(recipes);
    expect(groups).toHaveLength(1);
    expect(groups[0].yearMonth).toBe('2026-02');
    expect(groups[0].label).toBe('FEBRUARY 2026');
    expect(groups[0].recipes).toHaveLength(1);
  });

  it('groups recipes into correct months', () => {
    const recipes = [
      makeRecipe('1', 'A', '2026-02-23 04:46:12'),
      makeRecipe('2', 'B', '2026-02-15 07:52:33'),
      makeRecipe('3', 'C', '2026-01-25 00:14:07'),
      makeRecipe('4', 'D', '2025-12-21 18:22:02'),
      makeRecipe('5', 'E', '2025-12-05 03:31:32'),
    ];

    const groups = groupByMonth(recipes);
    expect(groups).toHaveLength(3);
    expect(groups[0].yearMonth).toBe('2026-02');
    expect(groups[0].recipes).toHaveLength(2);
    expect(groups[1].yearMonth).toBe('2026-01');
    expect(groups[1].recipes).toHaveLength(1);
    expect(groups[2].yearMonth).toBe('2025-12');
    expect(groups[2].recipes).toHaveLength(2);
  });

  it('preserves order within groups (assumes pre-sorted DESC)', () => {
    const recipes = [
      makeRecipe('1', 'Newer', '2026-02-23 04:46:12'),
      makeRecipe('2', 'Older', '2026-02-15 07:52:33'),
    ];
    const groups = groupByMonth(recipes);
    expect(groups[0].recipes[0].title).toBe('Newer');
    expect(groups[0].recipes[1].title).toBe('Older');
  });

  it('preserves group order (newest month first)', () => {
    const recipes = [
      makeRecipe('1', 'A', '2026-02-01 00:00:00'),
      makeRecipe('2', 'B', '2025-10-01 00:00:00'),
    ];
    const groups = groupByMonth(recipes);
    expect(groups[0].yearMonth).toBe('2026-02');
    expect(groups[1].yearMonth).toBe('2025-10');
  });
});

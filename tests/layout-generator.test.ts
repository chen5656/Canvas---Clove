import { describe, it, expect } from '@jest/globals';
import {
  generateLayout,
  getTileTypes,
  getTodaySeed,
  LayoutItem,
  TileType,
} from '../lib/layout-generator';

describe('getTileTypes', () => {
  it('returns 4 types for 3 columns', () => {
    const types = getTileTypes(3);
    expect(types).toEqual(['small', 'wide', 'tall', 'hero']);
  });

  it('returns 5 types for 4 columns (includes feature)', () => {
    const types = getTileTypes(4);
    expect(types).toContain('feature');
    expect(types).not.toContain('panorama');
  });

  it('returns 6 types for 5+ columns (includes feature and panorama)', () => {
    const types = getTileTypes(5);
    expect(types).toContain('feature');
    expect(types).toContain('panorama');
  });
});

describe('generateLayout', () => {
  it('returns empty array for 0 items', () => {
    expect(generateLayout(0, 3, 20260308)).toEqual([]);
  });

  it('returns correct number of items', () => {
    const layout = generateLayout(16, 3, 20260308);
    expect(layout).toHaveLength(16);
  });

  it('preserves source order (indices 0..n-1)', () => {
    const layout = generateLayout(10, 3, 12345);
    const indices = layout.map((l) => l.index);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('is deterministic with same seed', () => {
    const a = generateLayout(16, 3, 20260308);
    const b = generateLayout(16, 3, 20260308);
    expect(a).toEqual(b);
  });

  it('produces different layouts with different seeds', () => {
    const a = generateLayout(16, 3, 20260308);
    const b = generateLayout(16, 3, 20260309);
    const typesA = a.map((l) => l.tileType);
    const typesB = b.map((l) => l.tileType);
    // Very unlikely to be identical with different seeds
    expect(typesA).not.toEqual(typesB);
  });

  it('never produces 3 consecutive tall tiles', () => {
    // Test with many different seeds
    for (let seed = 1; seed <= 100; seed++) {
      const layout = generateLayout(20, 3, seed);
      for (let i = 2; i < layout.length; i++) {
        const lastThree = [layout[i - 2], layout[i - 1], layout[i]];
        const allTall = lastThree.every((l) => l.tileType === 'tall');
        expect(allTall).toBe(false);
      }
    }
  });

  it('never produces hero immediately after hero', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const layout = generateLayout(20, 4, seed);
      for (let i = 1; i < layout.length; i++) {
        const isBig = (t: TileType) => t === 'hero' || t === 'feature';
        if (isBig(layout[i - 1].tileType)) {
          expect(isBig(layout[i].tileType)).toBe(false);
        }
      }
    }
  });

  it('never produces 3 consecutive wide tiles', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const layout = generateLayout(20, 3, seed);
      for (let i = 2; i < layout.length; i++) {
        const lastThree = [layout[i - 2], layout[i - 1], layout[i]];
        const allWide = lastThree.every((l) => l.tileType === 'wide');
        expect(allWide).toBe(false);
      }
    }
  });

  it('assigns a big tile (hero/feature) within every 8 items when enough items', () => {
    const layout = generateLayout(16, 4, 42);
    const isBig = (t: TileType) => t === 'hero' || t === 'feature';
    // Check first 8 items have at least one big
    const first8 = layout.slice(0, 8);
    expect(first8.some((l) => isBig(l.tileType))).toBe(true);
    // Check second 8 items have at least one big
    const second8 = layout.slice(8, 16);
    expect(second8.some((l) => isBig(l.tileType))).toBe(true);
  });

  it('all colSpan values fit within column count', () => {
    for (const cols of [3, 4, 5, 6]) {
      const layout = generateLayout(16, cols, 99);
      for (const item of layout) {
        expect(item.colSpan).toBeLessThanOrEqual(cols);
        expect(item.colSpan).toBeGreaterThan(0);
        expect(item.rowSpan).toBeGreaterThan(0);
      }
    }
  });

  it('handles single item', () => {
    const layout = generateLayout(1, 3, 1);
    expect(layout).toHaveLength(1);
    expect(layout[0].index).toBe(0);
  });

  it('handles 2 items', () => {
    const layout = generateLayout(2, 3, 1);
    expect(layout).toHaveLength(2);
  });
});

describe('getTodaySeed', () => {
  it('returns a number in YYYYMMDD format', () => {
    const seed = getTodaySeed();
    expect(seed).toBeGreaterThan(20200101);
    expect(seed).toBeLessThan(21000101);
  });
});

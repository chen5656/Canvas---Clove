/**
 * Constrained random layout generator for recipe grid.
 *
 * Given a list of items, a column count, and a seed (e.g. today's date as number),
 * assigns each item a tile type (small, wide, tall, hero, etc.) while enforcing
 * visual constraints so the grid looks balanced but not repetitive.
 *
 * CSS Grid with `grid-auto-flow: dense` fills gaps automatically.
 */

export type TileType = 'small' | 'wide' | 'tall' | 'hero' | 'feature' | 'panorama' | 'poster' | 'cinema';

export interface TileSize {
  colSpan: number;
  rowSpan: number;
}

export interface LayoutItem {
  index: number;
  tileType: TileType;
  colSpan: number;
  rowSpan: number;
}

// --- Tile type menus per column count ---

const TILE_SIZES: Record<TileType, TileSize> = {
  small: { colSpan: 1, rowSpan: 1 },
  wide: { colSpan: 2, rowSpan: 1 },
  tall: { colSpan: 1, rowSpan: 2 },
  hero: { colSpan: 2, rowSpan: 2 },
  feature: { colSpan: 3, rowSpan: 2 },
  panorama: { colSpan: 3, rowSpan: 1 },
  poster: { colSpan: 2, rowSpan: 3 },
  cinema: { colSpan: 4, rowSpan: 2 },
};

export function getTileTypes(cols: number): TileType[] {
  if (cols <= 3) {
    return ['small', 'wide', 'tall', 'hero'];
  }
  if (cols === 4) {
    return ['small', 'wide', 'tall', 'hero', 'feature'];
  }
  // 5+ columns
  return ['small', 'hero', 'feature', 'panorama', 'poster', 'cinema'];
}

// --- Seeded PRNG (mulberry32) ---

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Weighted random pick ---

interface WeightedChoice {
  type: TileType;
  weight: number;
}

function weightedPick(choices: WeightedChoice[], rand: () => number): TileType {
  const total = choices.reduce((sum, c) => sum + c.weight, 0);
  let r = rand() * total;
  for (const c of choices) {
    r -= c.weight;
    if (r <= 0) return c.type;
  }
  return choices[choices.length - 1].type;
}

// --- Constraint checks ---

function countConsecutiveTrailing(types: TileType[], target: TileType): number {
  let count = 0;
  for (let i = types.length - 1; i >= 0; i--) {
    if (types[i] === target) count++;
    else break;
  }
  return count;
}

function isBigTile(type: TileType): boolean {
  return type === 'hero' || type === 'feature';
}

/**
 * Check if placing a big tile at this position would leave unfillable gaps
 * at the end of a group. Returns true if the big tile should be downgraded.
 */
function shouldDowngradeBigTile(
  remainingAfter: number,
  cols: number,
  tileType: TileType,
): boolean {
  const size = TILE_SIZES[tileType];
  // Cells occupied by the big tile
  const bigCells = size.colSpan * size.rowSpan;
  // The big tile itself takes up space in rows, leaving gaps around it.
  // If remaining items can't fill enough cells (allow at most 1 empty cell), downgrade.
  const gapCols = cols - size.colSpan;
  const gapCells = gapCols * size.rowSpan;
  // Total cells needing fill = the gap cells around the big tile
  // Plus any remaining rows after the big tile rows
  // Simplified: if remaining items < gap cells needed - 1, downgrade
  if (remainingAfter < gapCells - 1) {
    return true;
  }
  return false;
}

// --- Main layout generator ---

export function generateLayout(
  itemCount: number,
  cols: number,
  seed: number,
): LayoutItem[] {
  if (itemCount === 0) return [];
  if (cols < 1) cols = 3;

  const rand = mulberry32(seed);
  const availableTypes = getTileTypes(cols);
  const result: LayoutItem[] = [];
  const assignedTypes: TileType[] = [];

  for (let i = 0; i < itemCount; i++) {
    const remaining = itemCount - i - 1;
    let chosen: TileType;

    // Every 8th item (0-indexed: positions 0, 8, 16...) should be a big tile
    const isBigPosition = i % 8 === 0 && itemCount >= 3;

    if (isBigPosition) {
      // Pick hero or feature if available
      const bigTypes = availableTypes.filter(t => isBigTile(t));
      if (bigTypes.length > 0) {
        chosen = bigTypes[Math.floor(rand() * bigTypes.length)];

        // Check end-of-group downgrade
        if (shouldDowngradeBigTile(remaining, cols, chosen)) {
          chosen = 'wide'; // downgrade
        }

        // No hero right after hero
        if (assignedTypes.length > 0 && isBigTile(assignedTypes[assignedTypes.length - 1])) {
          chosen = 'wide';
        }
      } else {
        chosen = 'wide';
      }
    } else {
      // Normal position: weighted random from small types
      const weights: WeightedChoice[] = [];

      for (const t of availableTypes) {
        if (isBigTile(t)) continue; // big tiles only at designated positions

        // Check constraints before adding as candidate
        if (t === 'tall' && countConsecutiveTrailing(assignedTypes, 'tall') >= 2) {
          continue; // no 3 consecutive tall
        }
        if (t === 'wide' && countConsecutiveTrailing(assignedTypes, 'wide') >= 2) {
          continue; // no 3 consecutive wide
        }

        // Check tile fits in column count
        const size = TILE_SIZES[t];
        if (size.colSpan > cols) continue;

        // Assign weights
        switch (t) {
          case 'small': weights.push({ type: t, weight: 5 }); break;
          case 'wide': weights.push({ type: t, weight: 3 }); break;
          case 'tall': weights.push({ type: t, weight: 2 }); break;
          case 'panorama': weights.push({ type: t, weight: 1 }); break;
          default: weights.push({ type: t, weight: 1 }); break;
        }
      }

      if (weights.length === 0) {
        chosen = 'small'; // fallback
      } else {
        chosen = weightedPick(weights, rand);
      }
    }

    const size = TILE_SIZES[chosen];
    result.push({
      index: i,
      tileType: chosen,
      colSpan: size.colSpan,
      rowSpan: size.rowSpan,
    });
    assignedTypes.push(chosen);
  }

  return result;
}

/**
 * Get today's seed as YYYYMMDD number.
 */
export function getTodaySeed(): number {
  return Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
}

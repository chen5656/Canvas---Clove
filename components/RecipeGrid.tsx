import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MonthGroup, RecipeItem } from '../lib/group-by-month';
import { generateLayout, getTodaySeed, LayoutItem } from '../lib/layout-generator';
import { RecipeTile } from './RecipeTile';

interface RecipeGridProps {
  monthGroups: MonthGroup[];
  cols: number;
}

export function RecipeGrid({ monthGroups, cols }: RecipeGridProps) {
  const seed = getTodaySeed();
  const gap = 10;

  return (
    <View style={styles.container}>
      {monthGroups.map((group) => {
        const layout = generateLayout(group.recipes.length, cols, seed);

        const gridStyle = Platform.select({
          web: {
            display: 'grid' as any,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridAutoRows: '120px',
            gridAutoFlow: 'dense',
            gap,
          } as any,
          default: {
            flexDirection: 'row' as const,
            flexWrap: 'wrap' as const,
            gap,
          },
        });

        return (
          <View key={group.yearMonth} style={styles.monthSection}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthLabel}>{group.label}</Text>
              <Text style={styles.recipeCount}>
                {group.recipes.length} RECIPE{group.recipes.length !== 1 ? 'S' : ''}
              </Text>
            </View>
            <View style={gridStyle}>
              {group.recipes.map((recipe: RecipeItem, i: number) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  tile={layout[i]}
                  baseSize={120}
                  gap={gap}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 28,
  },
  monthSection: {
    gap: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthLabel: {
    color: '#8A93A8',
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  recipeCount: {
    color: '#5F687A',
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 1.2,
  },
});

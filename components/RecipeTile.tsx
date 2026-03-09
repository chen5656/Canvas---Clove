import React from 'react';
import { View, Image, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { LayoutItem } from '../lib/layout-generator';
import { RecipeItem } from '../lib/group-by-month';

interface RecipeTileProps {
  recipe: RecipeItem;
  tile: LayoutItem;
  baseSize: number;
  gap: number;
}

export function RecipeTile({ recipe, tile, baseSize, gap }: RecipeTileProps) {
  const width = baseSize * tile.colSpan + gap * (tile.colSpan - 1);
  const height = baseSize * tile.rowSpan + gap * (tile.rowSpan - 1);

  const webGridStyle = Platform.select({
    web: {
      gridColumn: `span ${tile.colSpan}`,
      gridRow: `span ${tile.rowSpan}`,
    } as any,
    default: {
      width,
      height,
    },
  });

  return (
    <Pressable style={[styles.tile, webGridStyle]}>
      {recipe.coverImageUrl ? (
        <Image
          source={{ uri: recipe.coverImageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text style={styles.category}>{recipe.category}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#16161A',
    ...Platform.select({
      web: {
        aspectRatio: undefined,
        minHeight: 120,
      } as any,
      default: {},
    }),
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#2A2A2E',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
      } as any,
      default: {
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
    }),
  },
  title: {
    color: '#FAFAF9',
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  category: {
    color: '#8A93A8',
    fontFamily: 'System',
    fontSize: 11,
    marginTop: 2,
  },
});

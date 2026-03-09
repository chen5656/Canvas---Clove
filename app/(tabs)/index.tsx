import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { RecipeGrid } from '../../components/RecipeGrid';
import { RecipeItem, MonthGroup, groupByMonth } from '../../lib/group-by-month';
import { fetchRecipes } from '../../lib/api';
import { useColumns } from '../../lib/use-columns';

const TEST_USER_ID = 'user_test_123456';

const TAG_FILTERS = ['Lunch', 'Beef', 'Quick', 'Family', 'Dinner'];

export default function HomeScreen() {
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cols = useColumns();

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      setLoading(true);
      const recipes = await fetchRecipes(TEST_USER_ID);
      const groups = groupByMonth(recipes);
      setMonthGroups(groups);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>M8X Table</Text>
          <View style={styles.headerActions}>
            <Text style={styles.headerIcon}>🔍</Text>
            <Text style={styles.headerIcon}>⚙️</Text>
            <Text style={styles.headerIconAccent}>＋</Text>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmented}>
          <View style={styles.menuRow}>
            <View style={[styles.menuBtn, styles.menuBtnActive]}>
              <Text style={styles.menuBtnText}>Collections</Text>
            </View>
            <View style={styles.menuBtn}>
              <Text style={styles.menuBtnText}>All</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            {TAG_FILTERS.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#32D583" />
          </View>
        )}
        {error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the Worker is running: npm run worker:dev
            </Text>
          </View>
        )}
        {!loading && !error && (
          <RecipeGrid monthGroups={monthGroups} cols={cols} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    marginBottom: 12,
  },
  appTitle: {
    color: '#FAFAF9',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 18,
    color: '#6B6B70',
  },
  headerIconAccent: {
    fontSize: 20,
    color: '#32D583',
    fontWeight: '700',
  },
  segmented: {
    gap: 12,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    gap: 12,
  },
  menuBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#0E152A',
  },
  menuBtnActive: {
    backgroundColor: '#1F2A44',
  },
  menuBtnText: {
    color: '#E6EDF8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0F1626',
  },
  tagText: {
    color: '#9DA7C2',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: '#E85A4F',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorHint: {
    color: '#6B6B70',
    fontSize: 13,
  },
});

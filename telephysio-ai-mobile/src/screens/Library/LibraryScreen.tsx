/**
 * LibraryScreen — UC4: view and filter assigned exercises.
 *
 * FlatList 2 columns + FilterChips + ExerciseCards
 */

import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { FilterChips } from '../../components/library/FilterChips';
import { ExerciseCard } from '../../components/library/ExerciseCard';
import { colors, spacing } from '../../theme';
import { exerciseLibrary } from '../../mocks/workout.mock';

export const LibraryScreen: React.FC = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');

  const exerciseCategories = useMemo(() => [
    { id: 'all',      label: t('library.filterAll') },
    { id: 'assigned', label: t('library.filterAssigned') },
    { id: 'ref',      label: t('library.filterRef') },
    { id: 'upper',    label: t('library.filterUpper') },
    { id: 'lower',    label: t('library.filterLower') },
    { id: 'core',     label: t('library.filterCore') },
  ], [t]);

  const filteredExercises = useMemo(() => {
    if (activeFilter === 'all') return exerciseLibrary;
    if (activeFilter === 'assigned')
      return exerciseLibrary.filter((e) => e.category === 'assigned');
    if (activeFilter === 'ref')
      return exerciseLibrary.filter((e) => e.category === 'reference');
    return exerciseLibrary;
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="headlineLg">{t('library.title')}</AppText>
      </View>

      <FilterChips
        chips={exerciseCategories.map((c) => ({ id: c.id, label: c.label }))}
        activeId={activeFilter}
        onSelect={setActiveFilter}
      />

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} onPress={() => {}} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
              {t('library.noExercises')}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.gutter,
  },
  header: {
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.md,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
});

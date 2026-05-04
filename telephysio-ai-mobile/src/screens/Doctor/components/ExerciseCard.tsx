import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../../../components/ui';
import { colors, spacing, typography } from '../../../theme';
import type { Exercise, ExerciseDifficulty } from '../../../services/firebase/types';

const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: '#166534', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#b45309', bg: '#fef3c7' },
  hard: { label: 'Hard', color: '#991b1b', bg: '#fef2f2' },
};

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  onRemove,
  showRemove = true,
}) => {
  const diffConfig = exercise.difficulty ? DIFFICULTY_CONFIG[exercise.difficulty] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: (exercise.color || colors.primary) + '1A' }]}>
          <Ionicons name={(exercise.icon || 'barbell-outline') as any} size={20} color={exercise.color || colors.primary} />
        </View>
        <View style={styles.info}>
          <AppText variant="labelMd" style={styles.name}>{exercise.name}</AppText>
          <AppText variant="bodySm" style={styles.meta}>
            {exercise.sets} sets x {exercise.reps} reps{exercise.duration ? ` - ${exercise.duration}` : ''}
          </AppText>
          <View style={styles.tagsRow}>
            {exercise.category && (
              <View style={styles.categoryTag}>
                <AppText variant="labelSm" style={styles.categoryText}>{exercise.category}</AppText>
              </View>
            )}
            {diffConfig && (
              <View style={[styles.diffTag, { backgroundColor: diffConfig.bg }]}>
                <AppText variant="labelSm" style={[styles.diffText, { color: diffConfig.color }]}>{diffConfig.label}</AppText>
              </View>
            )}
          </View>
        </View>
        {showRemove && onRemove && (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Ionicons name="close-circle" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  meta: {
    color: '#64748b',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  diffTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 4,
  },
});

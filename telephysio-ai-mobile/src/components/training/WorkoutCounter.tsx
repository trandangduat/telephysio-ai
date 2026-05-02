/**
 * WorkoutCounter — hiển thị số lần tập + progress bar bên dưới.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, ProgressBar } from '../ui';
import { colors, spacing } from '../../theme';

interface WorkoutCounterProps {
  currentRep: number;
  totalReps: number;
  currentSet: number;
  totalSets: number;
}

export const WorkoutCounter: React.FC<WorkoutCounterProps> = ({
  currentRep,
  totalReps,
  currentSet,
  totalSets,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="labelMd" color={colors.onSurfaceVariant}>
        HIỆP {currentSet}/{totalSets}
      </AppText>
      <View style={styles.repRow}>
        <AppText
          variant="headlineXl"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {currentRep}
        </AppText>
        <AppText variant="headlineMd" color={colors.onSurfaceVariant}>
          /{totalReps}
        </AppText>
      </View>
      <ProgressBar progress={currentRep / totalReps} variant="standard" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
});

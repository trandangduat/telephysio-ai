/**
 * TodayCard — Level 2 floating card showing today's workout.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, AppText, AppButton, Badge } from '../ui';
import { colors, spacing } from '../../theme';

interface TodayCardProps {
  onStart: () => void;
  name?: string;
  duration?: string;
  sets?: number;
  reps?: number;
  phase?: string;
}

export const TodayCard: React.FC<TodayCardProps> = ({ 
  onStart,
  name = 'Daily Workout',
  duration = '15 min',
  sets = 3,
  reps = 10,
  phase
}) => {
  const { t } = useTranslation();

  return (
    <Card level={2} onPress={onStart}>
      <Badge variant="primary" label={t('home.todayBadge')} />
      <View style={styles.body}>
        <AppText variant="headlineMd">{name}</AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant}>
          {duration} · {t('home.setsReps', {
            sets: sets,
            reps: reps,
          })}
        </AppText>
        {phase && (
          <AppText variant="labelSm" color={colors.onSurfaceVariant} style={styles.phase}>
            {phase}
          </AppText>
        )}
      </View>
      <AppButton label={t('home.startWorkout')} size="lg" onPress={onStart} />
    </Card>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  phase: {
    marginTop: spacing.xs,
  },
});

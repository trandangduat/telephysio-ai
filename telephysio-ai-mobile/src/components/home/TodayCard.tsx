/**
 * TodayCard — Level 2 floating card showing today's workout.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, AppText, AppButton, Badge } from '../ui';
import { colors, spacing } from '../../theme';
import { todayWorkout } from '../../mocks/workout.mock';

interface TodayCardProps {
  onStart: () => void;
}

export const TodayCard: React.FC<TodayCardProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <Card level={2} onPress={onStart}>
      <Badge variant="primary" label={t('home.todayBadge')} />
      <View style={styles.body}>
        <AppText variant="headlineMd">{todayWorkout.name}</AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant}>
          {todayWorkout.duration} · {t('home.setsReps', {
            sets: todayWorkout.sets,
            reps: todayWorkout.reps,
          })}
        </AppText>
        {todayWorkout.phase && (
          <AppText variant="labelSm" color={colors.onSurfaceVariant} style={styles.phase}>
            {todayWorkout.phase}
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

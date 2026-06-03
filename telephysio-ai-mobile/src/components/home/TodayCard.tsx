/**
 * @file TodayCard.tsx
 * @description Component thẻ (card) nổi mức 2 hiển thị thông tin về bài tập của ngày hôm nay.
 * Bao gồm tên bài tập, thời lượng, số hiệp (sets), số lần lặp (reps) và nút bắt đầu bài tập.
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

/**
 * Component thẻ hiển thị bài tập của ngày hôm nay.
 * 
 * @param {TodayCardProps} props Thuộc tính của component
 * @param {Function} props.onStart Hàm xử lý khi nhấn nút bắt đầu bài tập
 * @param {string} [props.name] Tên bài tập
 * @param {string} [props.duration] Thời lượng bài tập
 * @param {number} [props.sets] Số hiệp tập
 * @param {number} [props.reps] Số lần lặp lại mỗi hiệp
 * @param {string} [props.phase] Giai đoạn tập luyện
 * @return {React.FC<TodayCardProps>} Component thẻ bài tập hôm nay
 */
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

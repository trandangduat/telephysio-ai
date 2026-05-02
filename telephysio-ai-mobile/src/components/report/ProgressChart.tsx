/**
 * ProgressChart — simple bar/line chart visualising weekly scores.
 * Sử dụng View-based bars thay vì victory-native để giảm phụ thuộc.
 * Có thể thay thế bằng victory-native sau.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

interface ProgressChartProps {
  scores: number[];  // 7 values 0–100
  labels?: string[];
  height?: number;
}

const DEFAULT_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const ProgressChart: React.FC<ProgressChartProps> = ({
  scores,
  labels = DEFAULT_LABELS,
  height = 220,
}) => {
  const maxScore = Math.max(...scores, 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsRow}>
        {scores.map((score, idx) => {
          const barHeight = (score / maxScore) * (height - 40);
          return (
            <View key={idx} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor:
                        idx === scores.length - 1
                          ? colors.primary   // Today highlighted in primary
                          : colors.tertiary, // Success Green
                    },
                  ]}
                />
              </View>
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                {labels[idx]}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
  } as ViewStyle,
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '60%',
    borderRadius: radius.sm,
    minHeight: 4,
  } as ViewStyle,
});

/**
 * @file ProgressChart.tsx
 * @description Biểu đồ cột đơn giản để hiển thị điểm số hàng tuần.
 * Sử dụng View thay vì thư viện biểu đồ bên thứ ba (victory-native) để giảm sự phụ thuộc, có thể được thay thế sau này.
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

/**
 * Component hiển thị biểu đồ quá trình tập luyện trong tuần.
 * 
 * @param {ProgressChartProps} props Thuộc tính của component
 * @param {number[]} props.scores Danh sách điểm số (từ 0 đến 100), mặc định cho 7 ngày
 * @param {string[]} [props.labels] Nhãn hiển thị cho trục ngang (Mặc định: 'T2', 'T3',...)
 * @param {number} [props.height] Chiều cao của biểu đồ (Mặc định: 220)
 * @return {React.FC<ProgressChartProps>} Component biểu đồ tiến độ
 */
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

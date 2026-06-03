/**
 * @file WeekCalendar.tsx
 * @description Component lịch tuần dạng hàng ngang gồm 7 chip ngày (T2-CN).
 * Ngày đang chọn hiển thị nền màu primary, ngày đã hoàn thành hiển thị nền xanh lá,
 * các ngày còn lại hiển thị nền surfaceContainerHigh.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

/**
 * Props của component WeekCalendar.
 * @param activeIndex     Chỉ số ngày đang được chọn (0 = Thứ Hai; mặc định: ngày hiện tại).
 * @param completedDays   Mảng các chỉ số ngày đã hoàn thành tập luyện (mặc định: [0, 1, 2, 3]).
 */
interface WeekCalendarProps {
  activeIndex?: number; // 0 = Monday
  completedDays?: number[];
}

/**
 * Component hiển thị lịch tuần dạng hàng ngang.
 *
 * @param activeIndex     Chỉ số ngày đang được chọn (mặc định: ngày hiện tại).
 * @param completedDays   Danh sách chỉ số ngày đã hoàn thành.
 * @return                Hàng View gồm 7 TouchableOpacity chip ngày trong tuần.
 */
export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  activeIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
  completedDays = [0, 1, 2, 3],
}) => {
  const { t } = useTranslation();

  const DAYS = [
    t('weekDays.mon'),
    t('weekDays.tue'),
    t('weekDays.wed'),
    t('weekDays.thu'),
    t('weekDays.fri'),
    t('weekDays.sat'),
    t('weekDays.sun'),
  ];

  return (
    <View style={styles.container}>
      {DAYS.map((day, idx) => {
        const isActive = idx === activeIndex;
        const isCompleted = completedDays.includes(idx) && !isActive;
        return (
          <TouchableOpacity
            key={day}
            style={[
              styles.chip,
              isActive && styles.activeChip,
              isCompleted && styles.completedChip,
            ]}
            activeOpacity={0.7}
          >
            <AppText
              variant="labelMd"
              color={
                isActive
                  ? colors.onPrimary
                  : isCompleted
                    ? colors.tertiary
                    : colors.onSurfaceVariant
              }
            >
              {day}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
  completedChip: {
    backgroundColor: colors.tertiaryFixed,
  },
});

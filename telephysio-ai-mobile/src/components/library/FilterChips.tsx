/**
 * @file FilterChips.tsx
 * @description Component cung cấp danh sách các thẻ lọc (chips) có thể cuộn ngang.
 * Thẻ đang được chọn (active) sẽ có màu nền chính (primary), các thẻ khác có màu xám.
 */

import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

interface FilterChip {
  id: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Component hiển thị danh sách các thẻ lọc ngang có thể cuộn.
 * 
 * @param {FilterChipsProps} props Thuộc tính của component
 * @param {FilterChip[]} props.chips Danh sách các thẻ lọc
 * @param {string} props.activeId ID của thẻ đang được chọn
 * @param {Function} props.onSelect Hàm xử lý khi một thẻ được chọn
 * @return {React.FC<FilterChipsProps>} Component danh sách thẻ lọc cuộn ngang
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  activeId,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip) => {
        const isActive = chip.id === activeId;
        return (
          <TouchableOpacity
            key={chip.id}
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => onSelect(chip.id)}
            activeOpacity={0.7}
          >
            <AppText
              variant="labelMd"
              color={isActive ? colors.onPrimary : colors.onSurfaceVariant}
            >
              {chip.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
});

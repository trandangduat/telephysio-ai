/**
 * FilterChips — horizontal scrollable filter chips.
 * Active = primary bg, Inactive = surfaceContainerHigh.
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

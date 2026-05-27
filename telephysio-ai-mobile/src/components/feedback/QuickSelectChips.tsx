/**
 * QuickSelectChips — multi-select chips for feedback symptoms.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

interface QuickSelectOption {
  id: string;
  label: string;
  description?: string;
}

interface QuickSelectChipsProps {
  options: QuickSelectOption[];
  selected: string[];
  onToggle: (id: string) => void;
}

export const SYMPTOM_OPTIONS: QuickSelectOption[] = [
  { id: 'pain',     label: 'Đau nhức',     description: 'Cảm giác đau ở vùng tập' },
  { id: 'stiff',    label: 'Cứng khớp',    description: 'Khó cử động' },
  { id: 'swelling', label: 'Sưng',         description: 'Vùng tập bị sưng' },
  { id: 'tired',    label: 'Mệt mỏi',     description: 'Cảm giác kiệt sức' },
  { id: 'good',     label: 'Bình thường',  description: 'Không có triệu chứng' },
  { id: 'better',   label: 'Tốt hơn',     description: 'Cải thiện rõ rệt' },
];

export const QuickSelectChips: React.FC<QuickSelectChipsProps> = ({
  options,
  selected,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.chip,
              isSelected && styles.selectedChip,
            ]}
            onPress={() => onToggle(opt.id)}
            activeOpacity={0.7}
          >
            <AppText
              variant="labelMd"
              color={isSelected ? colors.onPrimaryContainer : colors.onSurface}
            >
              {opt.label}
            </AppText>
            {opt.description && (
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                {opt.description}
              </AppText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  } as ViewStyle,
  selectedChip: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
});

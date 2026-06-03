/**
 * @file QuickSelectChips.tsx
 * @description Component cung cấp danh sách các thẻ chọn nhanh (chips) cho phép người dùng chọn nhiều lựa chọn cùng lúc.
 * Thường được sử dụng để người dùng chọn nhanh các triệu chứng hoặc phản hồi.
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
  { id: 'pain',     label: 'Pain',     description: 'Feeling pain in the training area' },
  { id: 'stiff',    label: 'Stiffness',    description: 'Difficulty moving' },
  { id: 'swelling', label: 'Swelling',         description: 'Training area is swollen' },
  { id: 'tired',    label: 'Fatigue',     description: 'Feeling exhausted' },
  { id: 'good',     label: 'Normal',  description: 'No symptoms' },
  { id: 'better',   label: 'Better',     description: 'Clear improvement' },
];

/**
 * Component hiển thị danh sách các thẻ (chips) để chọn nhiều lựa chọn.
 * 
 * @param {QuickSelectChipsProps} props Thuộc tính của component
 * @param {QuickSelectOption[]} props.options Danh sách các tùy chọn
 * @param {string[]} props.selected Danh sách id của các tùy chọn đang được chọn
 * @param {Function} props.onToggle Hàm xử lý khi một thẻ được nhấn
 * @return {React.FC<QuickSelectChipsProps>} Component danh sách thẻ chọn
 */
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

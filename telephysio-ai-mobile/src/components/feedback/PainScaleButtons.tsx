/**
 * PainScaleButtons — grid 2×5 for pain scale 1–10.
 *
 * 1–3: green (tertiaryFixedDim)
 * 4–6: neutral (secondaryContainer)
 * 7–10: red (errorContainer)
 * Selected: primary bg
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

interface PainScaleButtonsProps {
  value: number | null;
  onSelect: (value: number) => void;
}

const getBaseColor = (n: number): string => {
  if (n <= 3) return colors.tertiaryFixedDim;
  if (n <= 6) return colors.secondaryContainer;
  return colors.errorContainer;
};

const getBorderColor = (n: number): string => {
  if (n <= 3) return colors.onTertiaryFixedVariant;
  if (n <= 6) return colors.outlineVariant;
  return colors.error;
};

export const PainScaleButtons: React.FC<PainScaleButtonsProps> = ({ value, onSelect }) => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const isSelected = value === n;
        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.btn,
              {
                backgroundColor: isSelected ? colors.primary : getBaseColor(n),
                borderColor: isSelected ? colors.primary : getBorderColor(n),
              },
            ]}
            onPress={() => onSelect(n)}
            activeOpacity={0.7}
          >
            <AppText
              variant="bodyMd"
              color={isSelected ? colors.onPrimary : colors.onSurface}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {n}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  btn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});

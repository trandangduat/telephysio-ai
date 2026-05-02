import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const bgColors = {
    primary: colors.primaryFixed,
    success: colors.tertiaryFixed,
    warning: '#ffeedd',
    error: colors.errorContainer,
    neutral: colors.surfaceContainerHighest,
  };
  const textColors = {
    primary: colors.onPrimaryFixedVariant,
    success: colors.onTertiaryFixedVariant,
    warning: '#7c3000',
    error: colors.onErrorContainer,
    neutral: colors.onSurfaceVariant,
  };

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bgColors[variant] },
      ]}
    >
      <Text
        style={[
          size === 'sm' ? styles.labelSm : styles.labelMd,
          { color: textColors[variant] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  labelSm: {
    ...typography.labelSm,
  },
  labelMd: {
    ...typography.labelMd,
  },
});

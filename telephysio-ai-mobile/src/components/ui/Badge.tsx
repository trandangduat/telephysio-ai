/**
 * Badge — success / primary / neutral / error pill.
 *
 * Usage:
 *   <Badge variant="success" label="Hoàn thành" />
 *   <Badge variant="primary" label="Tin mới" />
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../../theme';

type BadgeVariant = 'success' | 'primary' | 'neutral' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.tertiaryContainer,    text: colors.onTertiaryContainer },
  primary: { bg: colors.primaryContainer,     text: colors.onPrimaryContainer },
  neutral: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant },
  error:   { bg: colors.errorContainer,       text: colors.onErrorContainer },
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', label }) => {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AppText variant="labelMd" color={text}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  } as ViewStyle,
});

/**
 * AppText — Typography wrapper quanh React Native Text.
 *
 * Usage:
 *   <AppText variant="headlineLg">Buổi tập hôm nay</AppText>
 *   <AppText variant="bodyMd" color={colors.onSurfaceVariant}>15 phút</AppText>
 */

import React from 'react';
import { Text, TextProps, TextStyle, ColorValue } from 'react-native';
import { typography } from '../../theme';
import { colors } from '../../theme';

type TypographyVariant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorValue | string;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'bodyMd',
  color,
  style,
  children,
  ...rest
}) => {
  const variantStyle = typography[variant] as TextStyle;
  return (
    <Text
      style={[
        { color: color ?? colors.onSurface },
        variantStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

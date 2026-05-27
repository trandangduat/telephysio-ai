/**
 * AppButton — Primary / Secondary / Ghost button.
 *
 * Usage:
 *   <AppButton label="Bắt đầu tập" onPress={fn} />
 *   <AppButton label="Hủy" variant="ghost" size="sm" onPress={fn} />
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, typography, spacing, radius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'lg' | 'md' | 'sm';

interface AppButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
}

/* ────── variant styles ────── */
const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
    },
    text: { color: colors.onPrimary },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondaryContainer,
      borderRadius: radius.md,
    },
    text: { color: colors.primary },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: radius.md,
    },
    text: { color: colors.primary },
  },
};

/* ────── size styles ────── */
const sizeStyles: Record<ButtonSize, { container: ViewStyle; typo: keyof typeof typography }> = {
  lg: { container: { height: 52, paddingHorizontal: spacing.xl }, typo: 'bodyMd' },
  md: { container: { height: 44, paddingHorizontal: spacing.lg }, typo: 'bodySm' },
  sm: { container: { height: 36, paddingHorizontal: spacing.md }, typo: 'labelMd' },
};

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  disabled,
  style: overrideStyle,
  ...rest
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        disabled && styles.disabled,
        overrideStyle,
      ]}
      {...rest}
    >
      <AppText
        variant={sStyle.typo}
        color={vStyle.text.color}
        style={[disabled && styles.disabledText]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  } as ViewStyle,
  disabled: {
    opacity: 0.45,
  },
  disabledText: {
    opacity: 0.7,
  },
});

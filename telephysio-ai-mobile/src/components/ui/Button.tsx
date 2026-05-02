import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { colors, radius, typography, spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.onPrimary : colors.primary}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    ...typography.labelMd,
    letterSpacing: 0.3,
  },

  // Sizes
  size_sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: 17, paddingHorizontal: spacing.xl },

  // Label sizes
  labelSize_sm: { fontSize: 12, lineHeight: 16 },
  labelSize_md: { fontSize: 14, lineHeight: 20 },
  labelSize_lg: { fontSize: 16, lineHeight: 24 },

  // Variants
  variant_primary: {
    backgroundColor: colors.primary,
    boxShadow: '0px 4px 12px rgba(0, 71, 141, 0.24)',
  } as ViewStyle,
  variant_secondary: {
    backgroundColor: colors.secondaryContainer,
  },
  variant_outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  variant_ghost: {
    backgroundColor: colors.transparent,
  },
  variant_danger: {
    backgroundColor: colors.errorContainer,
  },

  // Label variants
  label_primary: { color: colors.onPrimary, fontWeight: '600' },
  label_secondary: { color: colors.primary, fontWeight: '600' },
  label_outline: { color: colors.primary, fontWeight: '600' },
  label_ghost: { color: colors.primary, fontWeight: '500' },
  label_danger: { color: colors.error, fontWeight: '600' },
});

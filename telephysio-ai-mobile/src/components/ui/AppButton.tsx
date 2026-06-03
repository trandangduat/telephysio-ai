/**
 * @file AppButton.tsx
 * @description Component nút bấm đa năng với ba biến thể (primary, secondary, ghost)
 * và ba kích thước (lg, md, sm). Được dùng xuyên suốt ứng dụng để thực hiện các hành động.
 *
 * Cách dùng:
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

/** Biến thể hiển thị của nút: primary (màu chính), secondary (màu phụ), ghost (trong suốt có viền). */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Kích thước của nút: lg (lớn 52px), md (vừa 44px), sm (nhỏ 36px). */
type ButtonSize = 'lg' | 'md' | 'sm';

/**
 * Props của component AppButton.
 * @param label   Văn bản hiển thị trên nút.
 * @param variant Biến thể kiểu dáng nút (mặc định: 'primary').
 * @param size    Kích thước nút (mặc định: 'md').
 * @param style   Style ghi đè bổ sung cho container nút.
 */
interface AppButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
}

/* ────── Bảng style theo biến thể nút ────── */
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

/* ────── Bảng style theo kích thước nút ────── */
const sizeStyles: Record<ButtonSize, { container: ViewStyle; typo: keyof typeof typography }> = {
  lg: { container: { height: 52, paddingHorizontal: spacing.xl }, typo: 'bodyMd' },
  md: { container: { height: 44, paddingHorizontal: spacing.lg }, typo: 'bodySm' },
  sm: { container: { height: 36, paddingHorizontal: spacing.md }, typo: 'labelMd' },
};

/**
 * Component nút bấm chính của ứng dụng.
 *
 * @param label         Văn bản hiển thị trên nút.
 * @param variant       Biến thể kiểu dáng: 'primary' | 'secondary' | 'ghost' (mặc định: 'primary').
 * @param size          Kích thước nút: 'lg' | 'md' | 'sm' (mặc định: 'md').
 * @param disabled      Trạng thái vô hiệu hóa nút (mặc định: false).
 * @param style         Style ViewStyle bổ sung ghi đè lên style mặc định.
 * @return              Phần tử TouchableOpacity hiển thị nút với kiểu dáng tương ứng.
 */
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

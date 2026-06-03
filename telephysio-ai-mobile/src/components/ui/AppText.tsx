/**
 * @file AppText.tsx
 * @description Component văn bản cơ sở của ứng dụng, bọc quanh React Native Text.
 * Hỗ trợ tất cả các biến thể typography từ hệ thống theme và cho phép ghi đè màu sắc.
 *
 * Cách dùng:
 *   <AppText variant="headlineLg">Buổi tập hôm nay</AppText>
 *   <AppText variant="bodyMd" color={colors.onSurfaceVariant}>15 phút</AppText>
 */

import React from 'react';
import { Text, TextProps, TextStyle, ColorValue } from 'react-native';
import { typography } from '../../theme';
import { colors } from '../../theme';

/** Khóa định danh biến thể typography tương ứng với các kiểu chữ trong hệ thống theme. */
type TypographyVariant = keyof typeof typography;

/**
 * Props của component AppText.
 * @param variant   Biến thể typography được dùng (mặc định: 'bodyMd').
 * @param color     Màu sắc chữ; nếu bỏ trống sẽ dùng colors.onSurface.
 * @param children  Nội dung văn bản hoặc phần tử con cần hiển thị.
 */
interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorValue | string;
  children: React.ReactNode;
}

/**
 * Component hiển thị văn bản theo hệ thống typography của ứng dụng.
 *
 * @param variant   Biến thể kiểu chữ (mặc định: 'bodyMd').
 * @param color     Màu chữ; nếu không truyền thì dùng colors.onSurface.
 * @param style     Style Text bổ sung.
 * @param children  Nội dung văn bản.
 * @return          Phần tử Text với style typography đã xử lý.
 */
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

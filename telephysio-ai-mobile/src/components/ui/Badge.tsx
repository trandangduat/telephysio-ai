/**
 * @file Badge.tsx
 * @description Component nhãn hiểu nhỏ (pill/badge) dùng để phân loại hoặc trạng thái.
 * Hỗ trợ bốn biến thể màu: success, primary, neutral, error.
 *
 * Cách dùng:
 *   <Badge variant="success" label="Hoàn thành" />
 *   <Badge variant="primary" label="Tin mới" />
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../../theme';

/** Biến thể màu sắc của Badge tương ứng với trạng thái: thành công, chính, trung lập, lỗi. */
type BadgeVariant = 'success' | 'primary' | 'neutral' | 'error';

/**
 * Props của component Badge.
 * @param variant   Biến thể màu sắc (mặc định: 'neutral').
 * @param label     Văn bản hiển thị bên trong nhãn.
 */
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

/**
 * Component Badge hiển thị nhãn hiểu dạng pill.
 *
 * @param variant   Biến thể màu: 'success' | 'primary' | 'neutral' | 'error' (mặc định: 'neutral').
 * @param label     Văn bản hiển thị bên trong nhãn.
 * @returns         Phần tử View dạng pill với màu nền và màu chữ tương ứng biến thể.
 */
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

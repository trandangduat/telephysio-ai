/**
 * @file ProgressBar.tsx
 * @description Component thanh tiến trình hỗ trợ hai kiểu hiển thị:
 * 'standard' (màu xanh Success) và 'ai' (gradient Primary → Success).
 * Tự động khả giá trị progress trong khoảng [0, 1].
 *
 * Cách dùng:
 *   <ProgressBar progress={0.6} />
 *   <ProgressBar progress={0.92} variant="ai" label="92%" />
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../../theme';

/**
 * Props của component ProgressBar.
 * @param progress  Tỷ lệ tiến trình từ 0 đến 1 (sẽ bị khả về [0, 1]).
 * @param variant   Kiểu hiển thị: 'standard' = màu xanh, 'ai' = màu gradient (mặc định: 'standard').
 * @param label     Nhãn văn bản hiển thị phía trên thanh (tùy chọn).
 * @param height    Chiều cao của thanh tiến trình tính bằng px (mặc định: 8).
 */
interface ProgressBarProps {
    /** 0 → 1 */
    progress: number;
    /** 'standard' = Success Green, 'ai' = Primary → Success gradient (simplified) */
    variant?: 'standard' | 'ai';
    label?: string;
    height?: number;
}

/**
 * Component thanh tiến trình hiển thị mức độ hoàn thành.
 *
 * @param progress  Tỷ lệ tiến trình [0, 1].
 * @param variant   Biến thể hiển thị: 'standard' hoặc 'ai' (mặc định: 'standard').
 * @param label     Nhãn hiển thị phía trên thanh (tùy chọn).
 * @param height    Chiều cao thanh (mặc định: 8px).
 * @returns         View chứa nhãn (nếu có) và thanh track + fill animation.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    variant = 'standard',
    label,
    height = 8,
}) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const fillColor = variant === 'ai' ? colors.primaryContainer : colors.tertiary;

    return (
        <View style={styles.container}>
            {label && (
                <View style={styles.labelRow}>
                    <AppText variant="labelMd" color={colors.onSurfaceVariant}>
                        {label}
                    </AppText>
                </View>
            )}
            <View style={[styles.track, { height }]}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${clampedProgress * 100}%`,
                            backgroundColor: fillColor,
                            height,
                        },
                    ]}
                />
                {/* Khi variant=ai thêm lớp gradient accent nhẹ phía phải */}
                {variant === 'ai' && clampedProgress > 0 && (
                    <View
                        style={[
                            styles.aiAccent,
                            {
                                left: `${Math.max(0, clampedProgress * 100 - 20)}%`,
                                width: `${Math.min(20, clampedProgress * 100)}%`,
                                height,
                            },
                        ]}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    track: {
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: radius.full,
        overflow: 'hidden',
    } as ViewStyle,
    fill: {
        borderRadius: radius.full,
        position: 'absolute',
        left: 0,
        top: 0,
    } as ViewStyle,
    aiAccent: {
        position: 'absolute',
        top: 0,
        backgroundColor: colors.tertiaryFixedDim,
        opacity: 0.5,
        borderRadius: radius.full,
    } as ViewStyle,
});

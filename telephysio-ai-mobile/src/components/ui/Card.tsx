/**
 * @file Card.tsx
 * @description Component thẻ nội dung với hai mức nổi (level 1 và level 2).
 * Level 1 dùng bóng tiêu chuẩn, Level 2 dùng bóng nổi (floating).
 * Hỗ trợ tương tác nếu truyền prop onPress.
 *
 * Cách dùng:
 *   <Card>...</Card>                   // Level 1
 *   <Card level={2}>...</Card>         // Level 2 floating shadow
 *   <Card onPress={fn}>...</Card>      // Card có thể nhấn
 */

import React from 'react';
import {
    View,
    ViewProps,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

/**
 * Props của component Card.
 * @param level     Mức nổi của thẻ: 1 (tiêu chuẩn) hoặc 2 (nổi), mặc định: 1.
 * @param onPress   Hàm gọi khi nhấn vào thẻ; nếu có sẽ dùng TouchableOpacity.
 * @param style     Style ViewStyle bổ sung ghi đè.
 * @param children  Các phần tử con bên trong thẻ.
 */
interface CardProps extends ViewProps {
    level?: 1 | 2;
    onPress?: () => void;
    style?: ViewStyle;
    children: React.ReactNode;
}

/**
 * Component Card hiển thị nội dung bên trong một khối nổi có bóng và góc bo.
 *
 * @param level     Mức nổi 1 (tiêu chuẩn) hoặc 2 (floating), mặc định: 1.
 * @param onPress   Hàm xử lý khi nhấn; nếu có sẽ render TouchableOpacity thay vì View.
 * @param style     Style ViewStyle bổ sung.
 * @param children  Phần tử con hiển thị bên trong thẻ.
 * @returns          View hoặc TouchableOpacity tùy thuộc vào prop onPress.
 */
export const Card: React.FC<CardProps> = ({
    level = 1,
    onPress,
    style,
    children,
    ...rest
}) => {
    const cardStyle: ViewStyle[] = [
        styles.base,
        level === 1 ? styles.level1 : styles.level2,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={cardStyle}
                {...rest}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle} {...rest}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.xxl,
        padding: spacing.lg,
        borderCurve: 'continuous',
    } as ViewStyle,
    level1: {
        ...shadows.card,
    } as ViewStyle,
    level2: {
        ...shadows.floating,
    } as ViewStyle,
});

/**
 * @file Input.tsx
 * @description Component ô nhập liệu văn bản có nhãn nổi (floating label).
 * Hiển thị viền sáng khi được focus và hỗ trợ toàn bộ props của TextInput.
 *
 * Cách dùng:
 *   <Input label="Tên bệnh nhân" value={v} onChangeText={setV} />
 */

import React, { useState } from 'react';
import {
    View,
    TextInput,
    TextInputProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, typography, radius, spacing } from '../../theme';

/**
 * Props của component Input.
 * @param label   Nhãn hiển thị phía trên ô nhập liệu (tùy chọn).
 */
interface InputProps extends TextInputProps {
    label?: string;
}

/**
 * Component ô nhập liệu văn bản có nhãn và hiệu ứng focus.
 *
 * @param label   Nhãn hiển thị phía trên (tùy chọn).
 * @param style   Style bổ sung cho TextInput.
 * @return        View bao gồm nhãn (nếu có) và TextInput có viền focus.
 */
export const Input: React.FC<InputProps> = ({ label, style, ...rest }) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.wrapper}>
            {label && (
                <AppText variant="labelMd" color={colors.onSurfaceVariant} style={styles.label}>
                    {label}
                </AppText>
            )}
            <TextInput
                placeholderTextColor={colors.outline}
                style={[
                    styles.input,
                    focused && styles.focused,
                    style,
                ]}
                onFocus={(e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    rest.onBlur?.(e);
                }}
                {...rest}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    label: {
        marginBottom: spacing.xs,
    },
    input: {
        ...typography.bodyMd,
        color: colors.onSurface,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        backgroundColor: colors.surfaceContainerLowest,
    } as ViewStyle,
    focused: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    } as ViewStyle,
});

/**
 * @file ExerciseCard.tsx
 * @description Component thẻ (card) mức 1 dùng để hiển thị thông tin tóm tắt về một bài tập.
 * Bao gồm hình ảnh thu nhỏ, tên bài tập, thời lượng, số hiệp, số lần lặp và nhãn phân loại.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card, AppText, Badge } from '../ui';
import { colors, radius, spacing } from '../../theme';
import type { Exercise } from '../../services/firebase/types';

interface ExerciseCardProps {
    exercise: Exercise;
    onPress?: () => void;
}

/**
 * Component thẻ hiển thị thông tin về bài tập trong thư viện.
 * 
 * @param {ExerciseCardProps} props Thuộc tính của component
 * @param {Exercise} props.exercise Dữ liệu chi tiết của bài tập
 * @param {Function} [props.onPress] Hàm xử lý khi nhấn vào thẻ
 * @return {React.FC<ExerciseCardProps>} Component thẻ bài tập
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
    return (
        <Card level={1} onPress={onPress} style={styles.card}>
            {/* Thumbnail placeholder */}
            <View style={styles.thumbnail}>
                <AppText variant="labelSm" color={colors.onSurfaceVariant}>
          📷
                </AppText>
            </View>

            <AppText variant="headlineMd" style={styles.name}>
                {exercise.name}
            </AppText>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                {exercise.duration} · {exercise.sets} sets × {exercise.reps} reps
            </AppText>
            <View style={styles.badgeRow}>
                <Badge
                    variant={exercise.category === 'assigned' ? 'success' : 'neutral'}
                    label={exercise.category === 'assigned' ? 'Được giao' : 'Tham khảo'}
                />
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: spacing.md,
    } as ViewStyle,
    thumbnail: {
        height: 80,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    name: {
        marginBottom: spacing.xs,
    },
    badgeRow: {
        marginTop: spacing.sm,
    },
});

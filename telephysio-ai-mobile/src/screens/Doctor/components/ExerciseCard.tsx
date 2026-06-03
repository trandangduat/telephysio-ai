/**
 * @file ExerciseCard.tsx
 * @description Component thẻ hiển thị thông tin một bài tập trong template.
 * Hiển thị tên, số sets/reps, danh mục, độ khó và cho phép xóa bài tập khỏi danh sách.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { AppText } from '../../../components/ui';
import { colors, spacing, typography } from '../../../theme';
import type { Exercise, ExerciseDifficulty } from '../../../services/firebase/types';

const DIFFICULTY_STYLES: Record<ExerciseDifficulty, { color: string; bg: string }> = {
  easy: { color: '#166534', bg: '#dcfce7' },
  medium: { color: '#b45309', bg: '#fef3c7' },
  hard: { color: '#991b1b', bg: '#fef2f2' },
};

/**
 * Props của component ExerciseCard.
 *
 * @property exercise - Đối tượng bài tập cần hiển thị.
 * @property onPress - Callback được gọi khi người dùng nhấn vào thẻ (tùy chọn).
 * @property onRemove - Callback được gọi khi người dùng nhấn nút xóa (tùy chọn).
 * @property showRemove - Cờ bật/tắt hiển thị nút xóa, mặc định là true.
 */
interface ExerciseCardProps {
    exercise: Exercise;
    onPress?: () => void;
    onRemove?: () => void;
    showRemove?: boolean;
}

/**
 * Component thẻ hiển thị thông tin một bài tập.
 * Hiển thị icon, tên, số sets x reps, thời gian, danh mục và độ khó của bài tập.
 * Hỗ trợ xóa bài tập khỏi danh sách thông qua prop onRemove.
 *
 * @param exercise - Dữ liệu bài tập cần hiển thị.
 * @param onPress - Hàm callback khi nhấn vào thẻ (tùy chọn).
 * @param onRemove - Hàm callback khi nhấn nút xóa (tùy chọn).
 * @param showRemove - Hiển thị nút xóa hay không, mặc định là true.
 * @return Component JSX hiển thị thẻ bài tập.
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    exercise,
    onPress,
    onRemove,
    showRemove = true,
}) => {
  const { t } = useTranslation();
  const diffStyle = exercise.difficulty ? DIFFICULTY_STYLES[exercise.difficulty] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: (exercise.color || colors.primary) + '1A' }]}>
          <Ionicons name={(exercise.icon || 'barbell-outline') as any} size={20} color={exercise.color || colors.primary} />
        </View>
        <View style={styles.info}>
          <AppText variant="labelMd" style={styles.name}>{exercise.name}</AppText>
          <AppText variant="bodySm" style={styles.meta}>
            {exercise.sets} {t('doctor.templateEditor.sets').toLowerCase()} x {exercise.reps} {t('doctor.templateEditor.reps').toLowerCase()}{exercise.duration ? ` - ${exercise.duration}` : ''}
          </AppText>
          <View style={styles.tagsRow}>
            {exercise.category && (
              <View style={styles.categoryTag}>
                <AppText variant="labelSm" style={styles.categoryText}>
                  {exercise.category === 'Lower Body' ? t('doctor.templateEditor.lowerBody') :
                   exercise.category === 'Upper Body' ? t('doctor.templateEditor.upperBody') :
                   exercise.category === 'Core' ? t('doctor.templateEditor.core') : exercise.category}
                </AppText>
              </View>
            )}
            {diffStyle && (
              <View style={[styles.diffTag, { backgroundColor: diffStyle.bg }]}>
                <AppText variant="labelSm" style={[styles.diffText, { color: diffStyle.color }]}>{t(`doctor.templateEditor.${exercise.difficulty}` as any)}</AppText>
              </View>
            )}
          </View>
        </View>
        {showRemove && onRemove && (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Ionicons name="close-circle" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#0f172a',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
    },
    meta: {
        color: '#64748b',
        marginBottom: 6,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    categoryTag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryText: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '600',
    },
    diffTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    diffText: {
        fontSize: 10,
        fontWeight: '600',
    },
    removeBtn: {
        padding: 4,
    },
});

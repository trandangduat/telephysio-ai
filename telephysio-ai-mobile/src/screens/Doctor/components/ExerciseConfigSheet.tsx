/**
 * @file ExerciseConfigSheet.tsx
 * @description Bottom sheet cho phép người dùng cấu hình chi tiết một bài tập trước khi thêm vào template.
 * Bao gồm các thông số: số sets, số reps, mức độ khó, thời gian nghỉ giữa các sets và ghi chú.
 */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../../../components/ui';
import { colors, spacing } from '../../../theme';
import type { Exercise, ExerciseDifficulty } from '../../../services/firebase/types';

/**
 * Danh sách các mức độ khó có thể chọn.
 */
const DIFFICULTIES: { key: ExerciseDifficulty; label: string; emoji: string }[] = [
  { key: 'easy', label: 'Easy', emoji: '😊' },
  { key: 'medium', label: 'Medium', emoji: '😐' },
  { key: 'hard', label: 'Hard', emoji: '🔥' },
];

/**
 * Các lựa chọn thời gian nghỉ giữa các sets (tính bằng giây).
 */
const REST_OPTIONS = [30, 60, 90, 120];

/**
 * Props của component ExerciseConfigSheet.
 *
 * @property visible - Trạng thái hiển thị/ẩn của sheet.
 * @property exercise - Bài tập cần cấu hình, hoặc null nếu chưa chọn.
 * @property onClose - Callback được gọi khi đóng sheet.
 * @property onSave - Callback được gọi khi người dùng xác nhận lưu cấu hình.
 */
interface ExerciseConfigSheetProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onSave: (configured: Exercise) => void;
}

/**
 * Component bottom sheet cấu hình bài tập.
 * Cho phép người dùng chỉnh sửa sets, reps, mức độ khó, thời gian nghỉ và ghi chú
 * của một bài tập trước khi thêm vào template.
 *
 * @param visible - Hiển thị sheet khi true.
 * @param exercise - Bài tập cần cấu hình.
 * @param onClose - Hàm callback khi đóng sheet.
 * @param onSave - Hàm callback với cấu hình đã chỉnh sửa khi người dùng xác nhận.
 * @return Component JSX bottom sheet cấu hình bài tập, hoặc null nếu exercise là null.
 */
export const ExerciseConfigSheet: React.FC<ExerciseConfigSheetProps> = ({
  visible,
  exercise,
  onClose,
  onSave,
}) => {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>('medium');
  const [restBetweenSets, setRestBetweenSets] = useState(60);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (exercise) {
      setSets(exercise.sets || 3);
      setReps(exercise.reps || 10);
      setDifficulty(exercise.difficulty || 'medium');
      setRestBetweenSets(exercise.restBetweenSets || 60);
      setNotes(exercise.notes || '');
    }
  }, [exercise]);

  if (!exercise) return null;

  /**
   * Xây dựng đối tượng bài tập đã cấu hình và gọi callback onSave.
   * Tính toán thời gian dựa trên số sets, sau đó đóng sheet.
   */
  const handleSave = () => {
    onSave({
      ...exercise,
      sets,
      reps,
      difficulty,
      restBetweenSets,
      notes,
      duration: `${sets * 2} mins`,
    });
    onClose();
  };

  /**
   * Tăng hoặc giảm số sets trong khoảng hợp lệ [1, 10].
   *
   * @param delta - Giá trị thay đổi (+1 hoặc -1).
   */
  const adjustSets = (delta: number) => {
    const newVal = sets + delta;
    if (newVal >= 1 && newVal <= 10) setSets(newVal);
  };

  /**
   * Tăng hoặc giảm số reps trong khoảng hợp lệ [1, 50].
   *
   * @param delta - Giá trị thay đổi (+1 hoặc -1).
   */
  const adjustReps = (delta: number) => {
    const newVal = reps + delta;
    if (newVal >= 1 && newVal <= 50) setReps(newVal);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="headlineMd" style={styles.title}>Configure: {exercise.name}</AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sets */}
            <View style={styles.section}>
              <AppText variant="labelMd" style={styles.label}>Sets</AppText>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustSets(-1)}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.counterValue}>
                  <AppText variant="headlineLg" style={styles.counterText}>{sets}</AppText>
                </View>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustSets(1)}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps */}
            <View style={styles.section}>
              <AppText variant="labelMd" style={styles.label}>Reps</AppText>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustReps(-1)}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.counterValue}>
                  <AppText variant="headlineLg" style={styles.counterText}>{reps}</AppText>
                </View>
                <TouchableOpacity style={styles.counterBtn} onPress={() => adjustReps(1)}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.section}>
              <AppText variant="labelMd" style={styles.label}>Difficulty</AppText>
              <View style={styles.diffRow}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.diffBtn, difficulty === d.key && styles.diffBtnActive]}
                    onPress={() => setDifficulty(d.key)}
                  >
                    <AppText style={styles.diffEmoji}>{d.emoji}</AppText>
                    <AppText variant="labelSm" style={{ color: difficulty === d.key ? colors.primary : '#475569', fontWeight: '600' }}>
                      {d.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rest Between Sets */}
            <View style={styles.section}>
              <AppText variant="labelMd" style={styles.label}>Rest Between Sets</AppText>
              <View style={styles.restRow}>
                {REST_OPTIONS.map(sec => (
                  <TouchableOpacity
                    key={sec}
                    style={[styles.restBtn, restBetweenSets === sec && styles.restBtnActive]}
                    onPress={() => setRestBetweenSets(sec)}
                  >
                    <AppText variant="labelSm" style={{ color: restBetweenSets === sec ? '#fff' : '#475569', fontWeight: '600' }}>
                      {sec}s
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <AppText variant="labelMd" style={styles.label}>Notes (optional)</AppText>
              <TextInput
                style={styles.textArea}
                placeholder="E.g. Keep back straight, avoid knee valgus..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <AppText variant="labelMd" style={{ color: '#475569' }}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>Add to Template</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    marginRight: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  counterValue: {
    width: 60,
    alignItems: 'center',
  },
  counterText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 28,
  },
  diffRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diffBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    gap: 4,
  },
  diffBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
  },
  diffEmoji: {
    fontSize: 24,
  },
  restRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  restBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  restBtnActive: {
    backgroundColor: colors.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 72,
    textAlignVertical: 'top',
    color: '#0f172a',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
});

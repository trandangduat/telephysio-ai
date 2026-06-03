/**
 * @file ExercisePickerSheet.tsx
 * @description Bottom sheet cho phép người dùng tìm kiếm và chọn bài tập từ danh sách toàn cầu.
 * Hỗ trợ lọc theo danh mục và tìm kiếm theo tên. Loại trừ các bài tập đã thêm vào template.
 */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { AppText } from '../../../components/ui';
import { colors, spacing } from '../../../theme';
import { getGlobalExercises } from '../../../services/firebase';
import type { Exercise } from '../../../services/firebase/types';

interface ExercisePickerSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
    excludeIds?: string[];
}

/**
 * Component bottom sheet chọn bài tập.
 * Hiển thị danh sách bài tập từ Firebase, hỗ trợ tìm kiếm và lọc theo danh mục.
 *
 * @param visible - Hiển thị sheet khi true.
 * @param onClose - Hàm callback khi đóng sheet.
 * @param onSelect - Hàm callback khi người dùng chọn một bài tập.
 * @param excludeIds - Danh sách ID bài tập được loại trừ.
 * @return Component JSX bottom sheet chọn bài tập.
 */
export const ExercisePickerSheet: React.FC<ExercisePickerSheetProps> = ({
    visible,
    onClose,
    onSelect,
    excludeIds = [],
}) => {
  const { t } = useTranslation();
  const CATEGORIES = [
    t('doctor.templateEditor.all'),
    t('doctor.templateEditor.lowerBody'),
    t('doctor.templateEditor.upperBody'),
    t('doctor.templateEditor.core')
  ];

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

    useEffect(() => {
        if (visible) {
            loadExercises();
        }
    }, [visible]);

    /**
   * Tải danh sách bài tập toàn cầu từ Firebase và cập nhật state exercises.
   */
    const loadExercises = async () => {
        setLoading(true);
        try {
            const data = await getGlobalExercises();
            setExercises(data);
        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === t('doctor.templateEditor.all') || 
      (activeCategory === t('doctor.templateEditor.lowerBody') && ex.category === 'Lower Body') ||
      (activeCategory === t('doctor.templateEditor.upperBody') && ex.category === 'Upper Body') ||
      (activeCategory === t('doctor.templateEditor.core') && ex.category === 'Core');
    const notExcluded = !excludeIds.includes(ex.id);
    return matchesSearch && matchesCategory && notExcluded;
  });

    /**
   * Xử lý khi người dùng chọn một bài tập.
   * Gọi callback onSelect và đóng sheet.
   *
   * @param exercise - Bài tập được người dùng chọn.
   */
    const handleSelect = (exercise: Exercise) => {
        onSelect(exercise);
        onClose();
    };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="headlineMd" style={styles.title}>{t('doctor.templateEditor.selectExercise')}</AppText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('doctor.templateEditor.searchExercises')}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filters */}
          <View style={styles.filtersBlock}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              contentContainerStyle={styles.chipsContent}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activeCategory === cat && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.85}
                >
                  <AppText variant="labelSm" style={{ color: activeCategory === cat ? '#fff' : '#475569', fontWeight: '600' }}>
                    {cat}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise List */}
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filtered.length > 0 ? filtered.map(ex => (
                <TouchableOpacity key={ex.id} style={styles.exerciseItem} onPress={() => handleSelect(ex)}>
                  <View style={[styles.exerciseIcon, { backgroundColor: (ex.color || colors.primary) + '1A' }]}>
                    <Ionicons name={(ex.icon || 'barbell-outline') as any} size={20} color={ex.color || colors.primary} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <AppText variant="labelMd" style={styles.exerciseName}>{ex.name}</AppText>
                    <AppText variant="bodySm" style={styles.exerciseMeta}>
                      {ex.category || t('doctor.templateEditor.general')} - {t('doctor.templateEditor.defaultSetsReps', { sets: ex.sets, reps: ex.reps })}
                    </AppText>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )) : (
                <AppText variant="bodyMd" style={{ color: '#64748b', textAlign: 'center', marginTop: spacing.xl }}>
                  {t('doctor.templateEditor.noExercisesFound')}
                </AppText>
              )}
            </ScrollView>
          )}
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
    height: '86%',
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 20,
    flex: 1,
    marginRight: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filtersBlock: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: spacing.md,
    zIndex: 1,
  },
  chipsRow: {
    flexGrow: 0,
  },
  chipsContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#0f172a',
    fontWeight: '600',
  },
  exerciseMeta: {
    color: '#64748b',
    fontSize: 12,
  },
});

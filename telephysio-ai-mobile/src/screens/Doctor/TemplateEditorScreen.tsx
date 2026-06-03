/**
 * @file TemplateEditorScreen.tsx
 * @description Màn hình tạo mới hoặc chỉnh sửa một template bài tập vật lý trị liệu.
 * Cho phép bác sĩ đặt tên, mô tả và thêm/xóa các bài tập trong template.
 */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { DoctorStackParamList } from '../../navigation/types';
import type { Exercise } from '../../services/firebase/types';
import {
    getExerciseTemplates,
    createExerciseTemplate,
    updateExerciseTemplate,
} from '../../services/firebase';
import { ExerciseCard } from './components/ExerciseCard';
import { ExercisePickerSheet } from './components/ExercisePickerSheet';
import { ExerciseConfigSheet } from './components/ExerciseConfigSheet';

type TemplateEditorNavProp = NativeStackNavigationProp<DoctorStackParamList, 'TemplateEditor'>;
type TemplateEditorRouteProp = RouteProp<DoctorStackParamList, 'TemplateEditor'>;

/**
 * Màn hình soạn thảo template bài tập.
 * Hỗ trợ cả chế độ tạo mới và chỉnh sửa template hiện có.
 * Sử dụng ExercisePickerSheet và ExerciseConfigSheet để thêm bài tập.
 *
 * @return Component màn hình TemplateEditor.
 */
export const TemplateEditorScreen: React.FC = () => {
    const navigation = useNavigation<TemplateEditorNavProp>();
    const route = useRoute<TemplateEditorRouteProp>();
    const { uid } = useAuth();

    const templateId = route.params?.templateId;
    const isEditing = !!templateId;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // Picker state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [configVisible, setConfigVisible] = useState(false);
    const [configExercise, setConfigExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        if (isEditing) {
            loadTemplate();
        }
    }, [templateId]);

    /**
   * Tải thông tin template hiện có từ Firebase theo templateId.
   * Chỉ được gọi khi đang ở chế độ chỉnh sửa (isEditing = true).
   */
    const loadTemplate = async () => {
        if (!uid || !templateId) return;
        setLoading(true);
        try {
            const templates = await getExerciseTemplates(uid);
            const template = templates.find(t => t.id === templateId);
            if (template) {
                setName(template.name);
                setDescription(template.description || '');
                setExercises(template.exercises || []);
            }
        } catch (error) {
            console.error('Error loading template:', error);
            Alert.alert('Error', 'Failed to load template.');
        } finally {
            setLoading(false);
        }
    };

    /**
   * Xử lý khi người dùng chọn một bài tập từ ExercisePickerSheet.
   * Mở ExerciseConfigSheet để cấu hình chi tiết bài tập vừa chọn.
   *
   * @param exercise - Bài tập được chọn từ danh sách.
   */
    const handleAddExercise = (exercise: Exercise) => {
        setConfigExercise(exercise);
        setConfigVisible(true);
    };

    /**
   * Lưu cấu hình bài tập và thêm vào danh sách bài tập của template.
   * Gán ID tạm thời cho bài tập dựa trên timestamp hiện tại.
   *
   * @param configured - Bài tập đã được cấu hình đầy đủ từ ExerciseConfigSheet.
   */
    const handleConfigSave = (configured: Exercise) => {
        setExercises(prev => [...prev, { ...configured, id: `ex-${Date.now()}` }]);
        setConfigExercise(null);
    };

    /**
   * Xóa bài tập khỏi danh sách bài tập của template theo chỉ số.
   *
   * @param index - Chỉ số (index) của bài tập cần xóa trong mảng exercises.
   */
    const handleRemoveExercise = (index: number) => {
        setExercises(prev => prev.filter((_, i) => i !== index));
    };

    /**
   * Tính tổng thời gian ước tính của template dựa trên danh sách bài tập.
   * Mỗi bài tập ước tính số phút theo trường duration nhân với số sets.
   *
   * @return Chuỗi tổng thời gian dạng "X min".
   */
    const calculateTotalDuration = (): string => {
        const totalMins = exercises.reduce((sum, ex) => {
            const mins = parseInt(ex.duration) || 2;
            return sum + mins * ex.sets;
        }, 0);
        return `${totalMins} min`;
    };

    /**
   * Xử lý lưu template lên Firebase.
   * Thực hiện validate tên template và danh sách bài tập trước khi lưu.
   * Gọi createExerciseTemplate hoặc updateExerciseTemplate tùy theo chế độ.
   * Điều hướng về màn hình trước sau khi lưu thành công.
   */
    const handleSave = async () => {
        if (!uid) return;
        if (!name.trim()) {
            Alert.alert('Validation', 'Please enter a template name.');
            return;
        }
        if (exercises.length === 0) {
            Alert.alert('Validation', 'Please add at least one exercise.');
            return;
        }

        setSaving(true);
        try {
            const totalDuration = calculateTotalDuration();

            if (isEditing && templateId) {
                await updateExerciseTemplate(templateId, {
                    name: name.trim(),
                    description: description.trim(),
                    exercises,
                    totalDuration,
                });
                Alert.alert('Success', 'Template updated successfully.');
            } else {
                await createExerciseTemplate({
                    doctorId: uid,
                    name: name.trim(),
                    description: description.trim(),
                    exercises,
                    totalDuration,
                });
                Alert.alert('Success', 'Template created successfully.');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error saving template:', error);
            Alert.alert('Error', 'Failed to save template. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <AppText variant="headlineMd" style={styles.headerTitle}>
                    {isEditing ? 'Edit Template' : 'Create Template'}
                </AppText>
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>Save</AppText>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Template Name */}
                <View style={styles.field}>
                    <AppText variant="labelMd" style={styles.label}>Template Name</AppText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. ACL Recovery - Phase 2"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Description */}
                <View style={styles.field}>
                    <AppText variant="labelMd" style={styles.label}>Description (optional)</AppText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Brief description of this exercise protocol..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Exercises Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <AppText variant="labelMd" style={styles.sectionLabel}>EXERCISES ({exercises.length})</AppText>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setPickerVisible(true)}>
                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                        <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>Add</AppText>
                    </TouchableOpacity>
                </View>

                {exercises.length > 0 ? (
                    exercises.map((ex, index) => (
                        <ExerciseCard
                            key={ex.id || index.toString()}
                            exercise={ex}
                            onRemove={() => handleRemoveExercise(index)}
                            showRemove
                        />
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="barbell-outline" size={40} color="#cbd5e1" />
                        <AppText variant="bodyMd" style={{ color: '#94a3b8', marginTop: spacing.sm }}>
              No exercises added yet.
                        </AppText>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setPickerVisible(true)}>
                            <AppText variant="labelMd" style={{ color: colors.primary }}>Add First Exercise</AppText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Total Duration */}
                {exercises.length > 0 && (
                    <View style={styles.totalRow}>
                        <Ionicons name="time-outline" size={18} color="#64748b" />
                        <AppText variant="bodyMd" style={{ color: '#475569' }}>
              Total Duration: <AppText variant="labelMd" style={{ color: colors.primary }}>{calculateTotalDuration()}</AppText>
                        </AppText>
                    </View>
                )}
            </ScrollView>

            {/* Sheets */}
            <ExercisePickerSheet
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onSelect={handleAddExercise}
                excludeIds={exercises.map(e => e.id)}
            />
            <ExerciseConfigSheet
                visible={configVisible}
                exercise={configExercise}
                onClose={() => { setConfigVisible(false); setConfigExercise(null); }}
                onSave={handleConfigSave}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafd' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18, flex: 1, textAlign: 'center' },
    saveHeaderBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    scroll: { flex: 1 },
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },
    field: {},
    label: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0f172a',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    sectionTitleRow: {},
    sectionLabel: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.8,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    emptyAddBtn: {
        marginTop: spacing.md,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
});

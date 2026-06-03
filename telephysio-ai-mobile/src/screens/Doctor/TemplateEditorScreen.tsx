/**
 * @file TemplateEditorScreen.tsx
 * @description Giao diện cho phép bác sĩ tạo mới hoặc chỉnh sửa các mẫu bài tập, quản lý danh sách bài tập và cấu hình chi tiết cho từng bài.
 */

import React, { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { DoctorStackParamList } from "../../navigation/types";
import type { Exercise } from "../../services/firebase/types";
import {
    getExerciseTemplates,
    createExerciseTemplate,
    updateExerciseTemplate,
} from "../../services/firebase";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExercisePickerSheet } from "./components/ExercisePickerSheet";
import { ExerciseConfigSheet } from "./components/ExerciseConfigSheet";

type TemplateEditorNavProp = NativeStackNavigationProp<
    DoctorStackParamList,
    "TemplateEditor"
>;
type TemplateEditorRouteProp = RouteProp<
    DoctorStackParamList,
    "TemplateEditor"
>;

/**
 * Màn hình chỉnh sửa mẫu bài tập.
 * Hỗ trợ tạo mới hoặc cập nhật mẫu có sẵn, thêm/bớt bài tập, và cấu hình thông số cho mỗi bài.
 * @returns Giao diện React Native của màn hình TemplateEditor.
 */
export const TemplateEditorScreen: React.FC = () => {
    const navigation = useNavigation<TemplateEditorNavProp>();
    const route = useRoute<TemplateEditorRouteProp>();
    const { uid } = useAuth();
    const { t } = useTranslation();

    const templateId = route.params?.templateId;
    const isEditing = !!templateId;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // Trạng thái của bộ chọn
    const [pickerVisible, setPickerVisible] = useState(false);
    const [configVisible, setConfigVisible] = useState(false);
    const [configExercise, setConfigExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        if (isEditing) {
            loadTemplate();
        }
    }, [templateId]);

    /**
     * Tải dữ liệu của mẫu bài tập đang được chỉnh sửa từ Firestore.
     * @returns Một Promise hoàn thành khi dữ liệu được tải xong.
     */
    const loadTemplate = async () => {
        if (!uid || !templateId) return;
        setLoading(true);
        try {
            const templates = await getExerciseTemplates(uid);
            const template = templates.find((t) => t.id === templateId);
            if (template) {
                setName(template.name);
                setDescription(template.description || "");
                setExercises(template.exercises || []);
            }
        } catch (error) {
            console.error("Error loading template:", error);
            Alert.alert(
                t("doctor.templateEditor.error"),
                "Failed to load template.",
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Bắt đầu tiến trình thêm một bài tập mới vào mẫu, mở màn hình cấu hình.
     * @param exercise - Thông tin bài tập được chọn từ thư viện.
     * @returns Không có giá trị trả về.
     */
    const handleAddExercise = (exercise: Exercise) => {
        setConfigExercise(exercise);
        setConfigVisible(true);
    };

    /**
     * Lưu bài tập đã được cấu hình vào danh sách của mẫu hiện tại.
     * @param configured - Thông tin bài tập đã qua chỉnh sửa thông số.
     * @returns Không có giá trị trả về.
     */
    const handleConfigSave = (configured: Exercise) => {
        setExercises((prev) => [
            ...prev,
            { ...configured, id: `ex-${Date.now()}` },
        ]);
        setConfigExercise(null);
    };

    /**
     * Xóa một bài tập khỏi danh sách của mẫu hiện tại dựa trên chỉ số.
     * @param index - Vị trí của bài tập trong danh sách.
     * @returns Không có giá trị trả về.
     */
    const handleRemoveExercise = (index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    /**
     * Tính toán tổng thời lượng ước tính cho toàn bộ mẫu bài tập.
     * @returns Chuỗi định dạng tổng thời gian (VD: "15 min").
     */
    const calculateTotalDuration = (): string => {
        const totalMins = exercises.reduce((sum, ex) => {
            const mins = parseInt(ex.duration) || 2;
            return sum + mins * ex.sets;
        }, 0);
        return `${totalMins} min`;
    };

    /**
     * Lưu lại toàn bộ mẫu bài tập lên Firestore (tạo mới hoặc cập nhật).
     * @returns Một Promise hoàn thành khi dữ liệu đã được lưu và màn hình đóng lại.
     */
    const handleSave = async () => {
        if (!uid) return;
        if (!name.trim()) {
            Alert.alert(
                t("doctor.templateEditor.validation"),
                t("doctor.templateEditor.errorNoName"),
            );
            return;
        }
        if (exercises.length === 0) {
            Alert.alert(
                t("doctor.templateEditor.validation"),
                t("doctor.templateEditor.errorNoExercises"),
            );
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
                Alert.alert(
                    t("doctor.templateEditor.success"),
                    t("doctor.templateEditor.updateSuccess"),
                );
            } else {
                await createExerciseTemplate({
                    doctorId: uid,
                    name: name.trim(),
                    description: description.trim(),
                    exercises,
                    totalDuration,
                });
                Alert.alert(
                    t("doctor.templateEditor.success"),
                    t("doctor.templateEditor.createSuccess"),
                );
            }
            navigation.goBack();
        } catch (error) {
            console.error("Error saving template:", error);
            Alert.alert(
                t("doctor.templateEditor.error"),
                t("doctor.templateEditor.saveError"),
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.safe,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Phần đầu trang */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={colors.primary}
                    />
                </TouchableOpacity>
                <AppText variant="headlineMd" style={styles.headerTitle}>
                    {isEditing
                        ? t("doctor.templateEditor.editTemplate")
                        : t("doctor.templateEditor.newTemplate")}
                </AppText>
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <AppText
                            variant="labelMd"
                            style={{ color: "#fff", fontWeight: "700" }}
                        >
                            {t("doctor.templateEditor.saveTemplate")}
                        </AppText>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Tên mẫu bài tập */}
                <View style={styles.field}>
                    <AppText variant="labelMd" style={styles.label}>
                        {t("doctor.templateEditor.templateName")}
                    </AppText>
                    <TextInput
                        style={styles.input}
                        placeholder={t("doctor.templateEditor.namePlaceholder")}
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Mô tả */}
                <View style={styles.field}>
                    <AppText variant="labelMd" style={styles.label}>
                        {t("doctor.templateEditor.description")}
                    </AppText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t("doctor.templateEditor.descPlaceholder")}
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Phần bài tập */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <AppText variant="labelMd" style={styles.sectionLabel}>
                            {t("doctor.templateEditor.exercisesTitle", {
                                count: exercises.length,
                            })}
                        </AppText>
                    </View>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setPickerVisible(true)}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color={colors.primary}
                        />
                        <AppText
                            variant="labelMd"
                            style={{ color: colors.primary, fontWeight: "700" }}
                        >
                            {t("doctor.templateEditor.addExercise")}
                        </AppText>
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
                        <Ionicons
                            name="barbell-outline"
                            size={40}
                            color="#cbd5e1"
                        />
                        <AppText
                            variant="bodyMd"
                            style={{ color: "#94a3b8", marginTop: spacing.sm }}
                        >
                            {t("doctor.templateEditor.noExercises")}
                        </AppText>
                        <TouchableOpacity
                            style={styles.emptyAddBtn}
                            onPress={() => setPickerVisible(true)}
                        >
                            <AppText
                                variant="labelMd"
                                style={{ color: colors.primary }}
                            >
                                {t("doctor.templateEditor.addFirstExerciseBtn")}
                            </AppText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tổng thời lượng */}
                {exercises.length > 0 && (
                    <View style={styles.totalRow}>
                        <Ionicons
                            name="time-outline"
                            size={18}
                            color="#64748b"
                        />
                        <AppText variant="bodyMd" style={{ color: "#475569" }}>
                            {t("doctor.templateEditor.totalDurationLabel")}{" "}
                            <AppText
                                variant="labelMd"
                                style={{ color: colors.primary }}
                            >
                                {calculateTotalDuration()}
                            </AppText>
                        </AppText>
                    </View>
                )}
            </ScrollView>

            {/* Các bottom sheet */}
            <ExercisePickerSheet
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onSelect={handleAddExercise}
                excludeIds={exercises.map((e) => e.id)}
            />
            <ExerciseConfigSheet
                visible={configVisible}
                exercise={configExercise}
                onClose={() => {
                    setConfigVisible(false);
                    setConfigExercise(null);
                }}
                onSave={handleConfigSave}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafd" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    backBtn: { padding: 4 },
    headerTitle: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 18,
        flex: 1,
        textAlign: "center",
    },
    saveHeaderBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 60,
        alignItems: "center",
    },
    scroll: { flex: 1 },
    content: {
        padding: spacing.gutter,
        gap: spacing.md,
        paddingBottom: spacing.xl * 2,
    },
    field: {},
    label: {
        color: "#475569",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: 15,
        color: "#0f172a",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.sm,
    },
    sectionTitleRow: {},
    sectionLabel: {
        color: "#475569",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.8,
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
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
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
});

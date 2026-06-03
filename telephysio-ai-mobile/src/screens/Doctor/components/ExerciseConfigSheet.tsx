/**
 * @file ExerciseConfigSheet.tsx
 * @description Màn hình bottom sheet cho phép bác sĩ thiết lập thông số chi tiết (số hiệp, số lần lặp, độ khó) cho bài tập trước khi thêm vào mẫu.
 */

/**
 * Component ExerciseConfigSheet
 * 
 * Mục đích: Hiển thị một bottom sheet để cấu hình chi tiết cho một bài tập
 * (số hiệp, số lần lặp, độ khó, thời gian nghỉ, và ghi chú).
 */
import React, { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTranslation } from "react-i18next";
import { AppText } from "../../../components/ui";
import { colors, spacing } from "../../../theme";
import type {
    Exercise,
    ExerciseDifficulty,
} from "../../../services/firebase/types";

const REST_OPTIONS = [30, 60, 90, 120];

interface ExerciseConfigSheetProps {
    visible: boolean;
    exercise: Exercise | null;
    onClose: () => void;
    onSave: (configured: Exercise) => void;
}

/**
 * Component Bottom Sheet cấu hình chi tiết bài tập.
 * Cho phép bác sĩ tùy chỉnh số hiệp (sets), số lần lặp (reps), mức độ khó, thời gian nghỉ và ghi chú bổ sung.
 * @param props Các thuộc tính truyền vào component.
 * @param props.visible Trạng thái hiển thị của bottom sheet.
 * @param props.exercise Đối tượng bài tập cần cấu hình.
 * @param props.onClose Hàm callback đóng bottom sheet.
 * @param props.onSave Hàm callback khi nhấn lưu cấu hình.
 * @returns Giao diện cấu hình bài tập, hoặc null nếu không có bài tập được chọn.
 */
export const ExerciseConfigSheet: React.FC<ExerciseConfigSheetProps> = ({
    visible,
    exercise,
    onClose,
    onSave,
}) => {
    const { t } = useTranslation();

    const DIFFICULTIES: {
        key: ExerciseDifficulty;
        label: string;
        emoji: string;
    }[] = [
        { key: "easy", label: t("doctor.templateEditor.easy"), emoji: "😊" },
        {
            key: "medium",
            label: t("doctor.templateEditor.medium"),
            emoji: "😐",
        },
        { key: "hard", label: t("doctor.templateEditor.hard"), emoji: "🔥" },
    ];

    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("medium");
    const [restBetweenSets, setRestBetweenSets] = useState(60);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (exercise) {
            setSets(exercise.sets || 3);
            setReps(exercise.reps || 10);
            setDifficulty(exercise.difficulty || "medium");
            setRestBetweenSets(exercise.restBetweenSets || 60);
            setNotes(exercise.notes || "");
        }
    }, [exercise]);

    if (!exercise) return null;

    /**
     * Cập nhật thông số bài tập và gọi callback lưu.
     * Tính toán tự động thời gian dựa trên số hiệp.
     * @returns Không có giá trị trả về.
     */
    const handleSave = () => {
        onSave({
            ...exercise,
            sets,
            reps,
            difficulty,
            restBetweenSets,
            notes,
            duration: `${sets * 2} ${t("doctor.templateEditor.mins")}`,
        });
        onClose();
    };

    /**
     * Điều chỉnh số hiệp tập tăng/giảm.
     * @param delta Giá trị thay đổi (thường là +1 hoặc -1).
     * @returns Không có giá trị trả về.
     */
    const adjustSets = (delta: number) => {
        const newVal = sets + delta;
        if (newVal >= 1 && newVal <= 10) setSets(newVal);
    };

    /**
     * Điều chỉnh số lần lặp trong một hiệp tăng/giảm.
     * @param delta Giá trị thay đổi (thường là +1 hoặc -1).
     * @returns Không có giá trị trả về.
     */
    const adjustReps = (delta: number) => {
        const newVal = reps + delta;
        if (newVal >= 1 && newVal <= 50) setReps(newVal);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Phần đầu trang */}
                    <View style={styles.header}>
                        <AppText variant="headlineMd" style={styles.title}>
                            {t("doctor.templateEditor.configure", {
                                name: exercise.name,
                            })}
                        </AppText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Số hiệp */}
                        <View style={styles.section}>
                            <AppText variant="labelMd" style={styles.label}>
                                {t("doctor.templateEditor.sets")}
                            </AppText>
                            <View style={styles.counterRow}>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => adjustSets(-1)}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                                <View style={styles.counterValue}>
                                    <AppText
                                        variant="headlineLg"
                                        style={styles.counterText}
                                    >
                                        {sets}
                                    </AppText>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => adjustSets(1)}
                                >
                                    <Ionicons
                                        name="add"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Số lần lặp */}
                        <View style={styles.section}>
                            <AppText variant="labelMd" style={styles.label}>
                                {t("doctor.templateEditor.reps")}
                            </AppText>
                            <View style={styles.counterRow}>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => adjustReps(-1)}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                                <View style={styles.counterValue}>
                                    <AppText
                                        variant="headlineLg"
                                        style={styles.counterText}
                                    >
                                        {reps}
                                    </AppText>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => adjustReps(1)}
                                >
                                    <Ionicons
                                        name="add"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Độ khó */}
                        <View style={styles.section}>
                            <AppText variant="labelMd" style={styles.label}>
                                {t("doctor.templateEditor.difficulty")}
                            </AppText>
                            <View style={styles.diffRow}>
                                {DIFFICULTIES.map((d) => (
                                    <TouchableOpacity
                                        key={d.key}
                                        style={[
                                            styles.diffBtn,
                                            difficulty === d.key &&
                                                styles.diffBtnActive,
                                        ]}
                                        onPress={() => setDifficulty(d.key)}
                                    >
                                        <AppText style={styles.diffEmoji}>
                                            {d.emoji}
                                        </AppText>
                                        <AppText
                                            variant="labelSm"
                                            style={{
                                                color:
                                                    difficulty === d.key
                                                        ? colors.primary
                                                        : "#475569",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {d.label}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Thời gian nghỉ giữa các hiệp */}
                        <View style={styles.section}>
                            <AppText variant="labelMd" style={styles.label}>
                                {t("doctor.templateEditor.restBetweenSets")}
                            </AppText>
                            <View style={styles.restRow}>
                                {REST_OPTIONS.map((sec) => (
                                    <TouchableOpacity
                                        key={sec}
                                        style={[
                                            styles.restBtn,
                                            restBetweenSets === sec &&
                                                styles.restBtnActive,
                                        ]}
                                        onPress={() => setRestBetweenSets(sec)}
                                    >
                                        <AppText
                                            variant="labelSm"
                                            style={{
                                                color:
                                                    restBetweenSets === sec
                                                        ? "#fff"
                                                        : "#475569",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {sec}
                                            {t("doctor.templateEditor.sec")}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Ghi chú */}
                        <View style={styles.section}>
                            <AppText variant="labelMd" style={styles.label}>
                                {t("doctor.templateEditor.notesOptional")}
                            </AppText>
                            <TextInput
                                style={styles.textArea}
                                placeholder={t(
                                    "doctor.templateEditor.notesPlaceholder",
                                )}
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={3}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>
                    </ScrollView>

                    {/* Hành động */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                        >
                            <AppText
                                variant="labelMd"
                                style={{ color: "#475569" }}
                            >
                                {t("doctor.templateEditor.cancel")}
                            </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSave}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#fff"
                            />
                            <AppText
                                variant="labelMd"
                                style={{ color: "#fff", fontWeight: "700" }}
                            >
                                {t("doctor.templateEditor.addToTemplate")}
                            </AppText>
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
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "85%",
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 18,
        flex: 1,
        marginRight: spacing.md,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    label: {
        color: "#475569",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    counterRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xl,
    },
    counterBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    counterValue: {
        width: 60,
        alignItems: "center",
    },
    counterText: {
        color: "#0f172a",
        fontWeight: "800",
        fontSize: 28,
    },
    diffRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    diffBtn: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        gap: 4,
    },
    diffBtnActive: {
        borderColor: colors.primary,
        backgroundColor: "#eff6ff",
        borderWidth: 2,
    },
    diffEmoji: {
        fontSize: 24,
    },
    restRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    restBtn: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.sm,
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
    },
    restBtnActive: {
        backgroundColor: colors.primary,
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        padding: spacing.md,
        minHeight: 72,
        textAlignVertical: "top",
        color: "#0f172a",
        fontSize: 14,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    cancelBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    saveBtn: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
    },
});

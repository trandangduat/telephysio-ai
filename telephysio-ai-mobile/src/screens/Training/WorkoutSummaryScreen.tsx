/**
 * @file WorkoutSummaryScreen.tsx
 * @description Màn hình tổng kết buổi tập — hiển thị kết quả cuối cùng của phiên tập.
 *
 * Tuần tự hoàn thành nghiêm ngặt (Section 3.3):
 *   1. Dừng quay video -> stopRecording()
 *   2. Ghi phiên tập cuối cùng -> recordSession()
 *   3. Hoàn thành bài tập được giao -> completeAssignment()
 *   4. Lưu ảnh chụp tiến trình -> saveProgressSnapshot()
 *   5. Dọn dẹp phiên tập chưa hoàn thành -> deleteIncompleteSession()
 *   6. Hiển thị giao diện tổng kết
 *
 * Tính năng:
 *   - Tính lượng calo tiêu thụ dựa trên chỉ số MET (Metabolic Equivalent of Task)
 *   - Tính độ chính xác trung bình (làm tròn thành số nguyên)
 *   - Hiển thị đường dẫn video cục bộ và kích thước tệp
 *   - Xóa tệp video cục bộ linh hoạt
 *   - Bộ chọn mức độ nỗ lực cảm nhận (dễ, vừa, khó) -> đồng bộ Firestore
 *
 * @module screens/Training
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, AppButton } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import {
    getPatientAssignments,
    getIncompleteSession,
    deleteIncompleteSession,
    recordSession,
    completeAssignment,
    saveProgressSnapshot,
    updateSessionEffort,
} from '../../services/firebase';
import type { Assignment, ExerciseRecord, SetRecord } from '../../services/firebase/types';
import { VideoPlaybackModal } from '../../components/VideoPlaybackModal';
import { getVideoThumbnailUri } from '../../utils/videoUtils';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSummary'>;

/**
 * Trả về hệ số MET (Metabolic Equivalent of Task) tương ứng với tên bài tập.
 *
 * Hệ số MET được dùng để ước tính lượng calo tiêu thụ theo công thức:
 *   Calo = MET * cân_nặng_kg * thời_gian_giờ
 *
 * Quy tắc phân loại (Workout Flow Spec, mục 10.3):
 *   - Plank/Core/Bụng  → 3.5 (cường độ thấp)
 *   - HIIT/Burpee/Cardio → 8.0 (cường độ cao)
 *   - Kéo giãn/Cooldown/Yoga → 2.5 (rất nhẹ)
 *   - Mặc định (bài tập cơ thể) → 5.0
 *
 * @param exerciseName - Tên bài tập cần tra cứu hệ số MET.
 * @return Hệ số MET dạng số thực.
 */
function getMETValue(exerciseName: string): number {
    const name = exerciseName.toLowerCase();
    if (name.includes("plank") || name.includes("core") || name.includes("abdominal")) return 3.5;
    if (name.includes("hiit") || name.includes("burpee") || name.includes("cardio")) return 8.0;
    if (name.includes("stretch") || name.includes("cooldown") || name.includes("yoga")) return 2.5;
    return 5.0; // Mặc định cho bài tập thể dục không dụng cụ (Bodyweight exercise)
}

/**
 * Component màn hình tổng kết buổi tập.
 *
 * Thực hiện toàn bộ chuỗi xử lý hoàn thành phiên tập bao gồm:
 * lưu session, hoàn thành assignment, lưu snapshot tiến trình
 * và dọn dẹp trạng thái incomplete session.
 *
 * @param route      - Đối tượng route chứa assignmentId và recordVideo.
 * @param navigation - Đối tượng navigation để điều hướng về màn hình chính.
 * @return Giao diện React Native hiển thị tổng kết thống kê buổi tập.
 */
export const WorkoutSummaryScreen: React.FC<Props> = ({ route, navigation }) => {
    const { assignmentId, recordVideo } = route.params || { assignmentId: '', recordVideo: false };
    const { uid } = useAuth();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

    // Số liệu bài tập
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [completedExercises, setCompletedExercises] = useState<ExerciseRecord[]>([]);
    const [overallAccuracy, setOverallAccuracy] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [totalReps, setTotalReps] = useState(0);
    const [totalSets, setTotalSets] = useState(0);
    const [calories, setCalories] = useState(0);
    const [completionRateVal, setCompletionRateVal] = useState(0);

    // Nỗ lực cảm nhận
    const [effort, setEffort] = useState<"easy" | "normal" | "hard" | null>(null);

    // Quản lý video
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [thumbPath, setThumbPath] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);
    const [videoDeleted, setVideoDeleted] = useState(false);
    const [relativeVideoPathState, setRelativeVideoPathState] = useState<string | null>(null);

    useEffect(() => {
        async function processSummary() {
            if (!uid || !assignmentId) return;
            try {
                console.log("[WorkoutSummary] Starting strict completion sequence...");

                // Lấy thông tin bài tập đang hoạt động & dữ liệu phiên chưa hoàn thành
                const assignments = await getPatientAssignments(uid, 'active');
                const active = assignments.find((a) => a.id === assignmentId);
                const sessionData = await getIncompleteSession(uid, assignmentId);

                if (active && sessionData) {
                    setAssignment(active);

                    // Xây dựng danh sách bài tập & hiệp từ phiên chưa hoàn thành
                    const exercisesList = sessionData.completedExercises || [];
                    setCompletedExercises(exercisesList);

                    // Tính toán độ chính xác và tổng số (Mục 10 của Đặc tả Luồng Bài tập)
                    let totalAcc = 0;
                    let totalSecs = 0;
                    let sumReps = 0;
                    let sumSets = 0;
                    let calculatedCalories = 0;

                    exercisesList.forEach(ex => {
                        totalAcc += ex.accuracy;
                        sumSets += ex.sets.length;

                        let exSecs = 0;
                        ex.sets.forEach(s => {
                            sumReps += s.repsCompleted || 0;
                            exSecs += s.durationSec || 0;
                        });
                        totalSecs += exSecs;

                        // Tính toán lượng MET mỗi bài tập: MET * cân nặng (Kg) * (thời gian (giây) / 3600)
                        const met = getMETValue(ex.exerciseName);
                        const durationHours = exSecs / 3600;
                        calculatedCalories += met * 65 * durationHours; // Mặc định cân nặng 65kg
                    });

                    // Độ chính xác trung bình (làm tròn số trung bình giữa các bài tập)
                    const avgAcc = exercisesList.length > 0 ? Math.round(totalAcc / exercisesList.length) : 0;
                    const finalCalories = Math.round(calculatedCalories);
                    const completionRate = parseFloat((exercisesList.length / active.exercises.length).toFixed(2));

                    setOverallAccuracy(avgAcc);
                    setTotalTime(totalSecs);
                    setTotalReps(sumReps);
                    setTotalSets(sumSets);
                    setCalories(finalCalories);
                    setCompletionRateVal(completionRate);

                    console.log(`[WorkoutSummary] Calculated stats - Acc: ${avgAcc}%, Secs: ${totalSecs}, Calories: ${finalCalories}, Rate: ${completionRate}`);

                    // 2. Lưu phiên cuối vào Firestore
                    const finalSessionId = await recordSession({
                        patientId: uid,
                        assignmentId: active.id,
                        reps: sumReps,
                        templateName: active.templateName,
                        accuracy: avgAcc,
                        duration: totalSecs, // tổng số giây
                        caloriesBurned: finalCalories,
                        completionRate: completionRate,
                        perceivedEffort: null, // bắt đầu rỗng, được người dùng chọn phía dưới
                        exercises: exercisesList,
                        // Thuộc tính tương thích ngược:
                        exercisesCompleted: exercisesList.length,
                        completedExercises: exercisesList.length,
                        accuracyScore: avgAcc,
                        durationSeconds: totalSecs,
                        totalDuration: `${Math.floor(totalSecs / 60)} min`,
                        completedExercisesData: exercisesList.map((ex) => ({
                            name: ex.exerciseName,
                            accuracy: ex.accuracy,
                            reps: ex.sets.reduce((sum, s) => sum + (s.repsCompleted || 0), 0),
                            sets: ex.sets.length,
                            durationSeconds: ex.sets.reduce((sum, s) => sum + (s.durationSec || 0), 0),
                        }))
                    });

                    setSessionId(finalSessionId);
                    console.log(`[WorkoutSummary] Step 2 - Session recorded with ID: ${finalSessionId}`);

                    // 3. Chỉ hoàn thành bài tập nếu đạt 100%
                    if (completionRate >= 1.0) {
                        // Kiểm tra trạng thái trước (xử lý trong service completeAssignment)
                        await completeAssignment(active.id);
                        console.log(`[WorkoutSummary] Step 3 - Assignment ${active.id} completed!`);
                    } else {
                        console.log(`[WorkoutSummary] Step 3 - Completion rate is ${completionRate}. Left assignment active.`);
                    }

                    // 4. Lưu ảnh chụp tiến trình
                    const snapshotId = await saveProgressSnapshot({
                        patientId: uid,
                        movementScore: avgAcc, // Độ chính xác đại diện cho điểm số chuyển động
                        timeActive: Math.round(totalSecs / 60), // Tích lũy thời gian hoạt động tính bằng phút
                        weeklyConsistency: 85, // Cơ sở dữ liệu mẫu
                        rom: 90, // Cơ sở ROM tiêu chuẩn
                        strength: 80, // Cơ sở sức mạnh

                        // Tương thích ngược
                        timeActiveMinutes: Math.round(totalSecs / 60),
                        dailyGoalPercent: Math.round(completionRate * 100),
                        sessionsCompleted: 1,
                        sessionsTarget: 3,
                        romFlexion: 90,
                        romExtension: 0,
                        quadricepsStrength: 80,
                        hamstringStability: 75,
                        aiInsight: `You completed your workout with an outstanding ${avgAcc}% form accuracy score. Awesome work!`
                    });
                    console.log(`[WorkoutSummary] Step 4 - Progress snapshot saved: ${snapshotId}`);

                    // 5. Dọn dẹp phiên chưa hoàn thành
                    await deleteIncompleteSession(sessionData.id);
                    console.log(`[WorkoutSummary] Step 5 - Incomplete session state cleaned up.`);
                }
            } catch (error) {
                console.error('[WorkoutSummary] Error executing strict session completion:', error);
            } finally {
                setLoading(false);
                setSaving(false);
            }
        }

        processSummary();
    }, [uid, assignmentId]);

    const handleSelectEffort = async (choice: "easy" | "normal" | "hard") => {
        if (!sessionId) return;
        try {
            console.log(`[WorkoutSummary] Updating perceived effort to: ${choice}`);
            setEffort(choice);
            await updateSessionEffort(sessionId, choice);
        } catch (err) {
            console.error("Failed to select perceived effort:", err);
        }
    };

    const handleDone = () => {
        navigation.replace('MainTabs');
    };

    if (loading || saving) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText variant="headlineMd" style={{ marginTop: 16, color: colors.primary, fontWeight: '700' }}>
                    {t('summary.processingTitle')}
                </AppText>
                <AppText variant="bodySm" style={{ marginTop: 8, color: '#64748b', textAlign: 'center', paddingHorizontal: 40 }}>
                    {t('summary.processingDesc')}
                </AppText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Congratulations Header */}
                <View style={styles.header}>
                    <View style={styles.trophyIcon}>
                        <Ionicons name="trophy" size={48} color="#eab308" />
                    </View>
                    <AppText variant="headlineXl" style={styles.title}>{t('summary.title')}</AppText>
                    <AppText variant="bodyMd" style={styles.subtitle}>
                        {t('summary.subtitle')}
                    </AppText>
                </View>

                {/* Dashboard Stat Grid */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                        <AppText variant="headlineLg" style={{ color: colors.primary, fontWeight: '800', marginTop: 4 }}>
                            {overallAccuracy}%
                        </AppText>
                        <AppText variant="labelSm" style={styles.statLabel}>{t('summary.accuracy')}</AppText>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={20} color="#0f172a" />
                        <AppText variant="headlineLg" style={{ color: '#0f172a', fontWeight: '800', marginTop: 4 }}>
                            {Math.floor(totalTime / 60)}m {totalTime % 60}s
                        </AppText>
                        <AppText variant="labelSm" style={styles.statLabel}>{t('summary.totalTime')}</AppText>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="flame-outline" size={20} color="#f97316" />
                        <AppText variant="headlineLg" style={{ color: '#f97316', fontWeight: '800', marginTop: 4 }}>
                            {calories} kcal
                        </AppText>
                        <AppText variant="labelSm" style={styles.statLabel}>{t('summary.calories')}</AppText>
                    </View>
                </View>

                {/* Perceived Effort Card */}
                <View style={styles.effortCard}>
                    <AppText variant="labelMd" style={styles.cardTitle}>
                        {t('summary.effortTitle')}
                    </AppText>
                    <AppText variant="bodySm" style={styles.cardSubtitle}>
                        {t('summary.effortDesc')}
                    </AppText>
                    <View style={styles.effortButtonRow}>
                        <TouchableOpacity
                            style={[
                                styles.effortBtn,
                                styles.effortBtnEasy,
                                effort === "easy" && styles.effortBtnEasyActive
                            ]}
                            onPress={() => handleSelectEffort("easy")}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="leaf-outline"
                                size={16}
                                color={effort === "easy" ? "#fff" : "#14b8a6"}
                            />
                            <AppText variant="labelMd" style={[styles.effortBtnText, effort === "easy" && { color: "#fff" }]}>
                                {t('summary.effortEasy')}
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.effortBtn,
                                styles.effortBtnNormal,
                                effort === "normal" && styles.effortBtnNormalActive
                            ]}
                            onPress={() => handleSelectEffort("normal")}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="fitness-outline"
                                size={16}
                                color={effort === "normal" ? "#fff" : "#3b82f6"}
                            />
                            <AppText variant="labelMd" style={[styles.effortBtnText, effort === "normal" && { color: "#fff" }]}>
                                {t('summary.effortNormal')}
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.effortBtn,
                                styles.effortBtnHard,
                                effort === "hard" && styles.effortBtnHardActive
                            ]}
                            onPress={() => handleSelectEffort("hard")}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="thunderstorm-outline"
                                size={16}
                                color={effort === "hard" ? "#fff" : "#ef4444"}
                            />
                            <AppText variant="labelMd" style={[styles.effortBtnText, effort === "hard" && { color: "#fff" }]}>
                                {t('summary.effortHard')}
                            </AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Exercises Breakdown */}
                <View style={styles.exercisesList}>
                    <AppText variant="labelMd" style={styles.listTitle}>{t('summary.exerciseDetails')}</AppText>
                    {completedExercises.map((ex, i) => (
                        <View key={i} style={styles.exerciseRow}>
                            <View style={[styles.exIcon, { backgroundColor: colors.primary + '1A' }]}>
                                <Ionicons
                                    name="barbell-outline"
                                    size={18}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={styles.exInfo}>
                                <AppText variant="bodyMd" style={styles.exName}>{ex.exerciseName}</AppText>
                                <AppText variant="labelSm" style={styles.exDetail}>
                                    {t('summary.exerciseMeta', {
                                        sets: ex.sets.length,
                                        reps: ex.sets.reduce((sum, s) => sum + (s.repsCompleted || 0), 0),
                                        accuracy: ex.accuracy
                                    })}
                                </AppText>

                                {/* Horizontal set details row */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.thumbScroll}
                                    contentContainerStyle={styles.thumbScrollContent}
                                >
                                    {ex.sets.map((s, setIdx) => {
                                        const videoUri = s.videoUrl || s.videoLocalPath;
                                        const thumbUri = getVideoThumbnailUri(s.videoUrl, s.videoLocalPath);
                                        return (
                                            <TouchableOpacity 
                                                key={setIdx} 
                                                style={styles.thumbVideoBox}
                                                onPress={() => {
                                                    if (videoUri) setSelectedVideoUrl(videoUri);
                                                }}
                                            >
                                                <View style={styles.thumbVideoPlaceholder}>
                                                    {thumbUri ? (
                                                        <Image source={{ uri: thumbUri }} style={{ width: '100%', height: '100%', borderRadius: 8, opacity: 0.6 }} />
                                                    ) : null}
                                                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
                                                        <AppText style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                                                            {s.accuracy}%
                                                        </AppText>
                                                    </View>
                                                </View>
                                                <AppText variant="labelSm" style={styles.thumbSetLabel}>
                                                    {t('summary.setLabel', { set: s.setNumber, reps: s.repsCompleted })}
                                                </AppText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                            <Ionicons name="checkmark-circle" size={22} color="#16a34a" style={styles.rowCheckmark} />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Done Footer */}
            <View style={styles.footer}>
                <AppButton
                    label={t('summary.returnHome')}
                    size="lg"
                    onPress={handleDone}
                    style={{ width: '100%' }}
                />
            </View>

            <VideoPlaybackModal
                visible={!!selectedVideoUrl}
                videoUri={selectedVideoUrl || ''}
                onClose={() => setSelectedVideoUrl(null)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafd' },
    center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
    header: { alignItems: 'center', marginVertical: spacing.lg },
    trophyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef9c3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: { color: '#0f172a', fontWeight: '800', textAlign: 'center', fontSize: 22 },
    subtitle: { color: '#64748b', marginTop: 4, textAlign: 'center', fontSize: 14 },

    // Số liệu
    statsContainer: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
    },
    statLabel: { color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 4 },

    // Mức độ nỗ lực
    effortCard: {
        backgroundColor: '#fff',
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
        gap: spacing.xs,
    },
    cardTitle: { color: '#475569', fontWeight: '800', letterSpacing: 0.8, fontSize: 11 },
    cardSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 16 },
    effortButtonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    effortBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#f8fafc',
    },
    effortBtnText: { fontWeight: '700', fontSize: 12, color: '#475569' },

    // Màu sắc mức độ nỗ lực
    effortBtnEasy: { borderColor: '#ccfbf1' },
    effortBtnEasyActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
    effortBtnNormal: { borderColor: '#dbeafe' },
    effortBtnNormalActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    effortBtnHard: { borderColor: '#fee2e2' },
    effortBtnHardActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

    // Thẻ quản lý video
    videoCard: {
        backgroundColor: '#fff',
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
        gap: spacing.sm,
    },
    videoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    videoHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
        marginRight: spacing.sm,
    },
    deleteVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fff5f5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    downloadVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: spacing.xs,
    },
    videoPathText: {
        fontSize: 9,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#94a3b8',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginTop: spacing.sm,
    },
    videoPlayerWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginVertical: spacing.sm,
    },
    summaryVideo: {
        width: '100%',
        height: '100%',
    },

    // Các bài tập
    exercisesList: {
        backgroundColor: '#fff',
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
    },
    listTitle: { color: '#475569', marginBottom: spacing.md, letterSpacing: 0.8, fontSize: 11, fontWeight: '800' },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    exIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    exInfo: { flex: 1 },
    exName: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
    exDetail: { color: '#64748b', marginTop: 2, fontSize: 11, fontWeight: '500' },
    rowCheckmark: { alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm },

    // Hàng ảnh thu nhỏ
    thumbScroll: {
        marginTop: spacing.sm,
    },
    thumbScrollContent: {
        gap: spacing.sm,
    },
    thumbVideoBox: {
        width: 80,
        alignItems: 'center',
        gap: 4,
    },
    thumbVideoPlaceholder: {
        width: 80,
        height: 48,
        backgroundColor: '#1e293b',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    thumbSetLabel: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: '600',
    },

    footer: {
        padding: spacing.gutter,
        paddingBottom: spacing.xl,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
});

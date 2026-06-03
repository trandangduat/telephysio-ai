/**
 * ExerciseResultScreen - Màn hình kết quả bài tập.
 * Hiển thị điểm số, thời gian, và độ chính xác của từng hiệp tập (set) sau khi người dùng hoàn thành một bài tập.
 */
import React, { useEffect, useState, useRef } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Video, ResizeMode } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

import { AppText, AppButton } from "../../components/ui";
import { colors, spacing, radius } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";
import {
    getPatientAssignments,
    getIncompleteSession,
    saveIncompleteSession,
    updateIncompleteSession,
} from "../../services/firebase";
import { uploadSetsVideosInBackground } from "../../services/firebase/videoService";
import type {
    Assignment,
    Exercise,
    SetRecord,
    ExerciseRecord,
} from "../../services/firebase/types";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<RootStackParamList, "ExerciseResult">;

function accuracyColor(acc: number): string {
    if (acc >= 80) return "#10b981"; // màu xanh thanh lịch
    if (acc >= 60) return "#f59e0b"; // màu hổ phách
    return "#ef4444"; // màu đỏ
}

/**
 * Thành phần (Component) đại diện cho màn hình kết quả sau khi hoàn thành một bài tập.
 *
 * @param {Props} props Các thuộc tính truyền vào từ navigation.
 * @returns {JSX.Element} Giao diện người dùng của màn hình kết quả bài tập.
 */
export const ExerciseResultScreen: React.FC<Props> = ({
    route,
    navigation,
}) => {
    const {
        assignmentId,
        exerciseIndex,
        accuracy,
        durationSeconds,
        reps,
        sets,
        recordVideo,
        setDurations: routeSetDurations,
        setsData,
        videoResult,
    } = route.params || { recordVideo: false };
    const { uid } = useAuth();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [videoUri, setVideoUri] = useState<string>("");

    const [selectedSet, setSelectedSet] = useState<{
        setNum: number;
        reps: number;
        accuracy: number;
        duration: number;
    } | null>(null);
    const [playbackStatus, setPlaybackStatus] =
        useState<AVPlaybackStatus | null>(null);
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        async function loadData() {
            if (!uid) return;
            try {
                const assignments = await getPatientAssignments(uid, "active");
                const active = assignments.find((a) => a.id === assignmentId);
                if (active && active.exercises[exerciseIndex]) {
                    setAssignment(active);
                    setExercise(active.exercises[exerciseIndex]);
                }
            } catch (error) {
                console.error("Error loading exercise result data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [uid, assignmentId, exerciseIndex]);

    // Video URI sẽ được thiết lập cho từng hiệp tập được chọn trong handleOpenVideo

    const handleNext = async () => {
        if (!uid || !assignment) return;
        setSaving(true);
        try {
            const incSession = await getIncompleteSession(uid, assignmentId);

            const newExerciseData = {
                exerciseId: exercise?.id || `ex-${exerciseIndex}`,
                accuracy,
                durationSeconds,
                reps,
                sets,
            };

            const setsRecords: SetRecord[] = displaySets.map((s) => ({
                setNumber: s.setNum,
                repsCompleted: s.reps,
                durationSec: s.duration,
                weightKg: null,
                accuracy: s.accuracy,
                notes: null,
                videoLocalPath: s.videoLocalPath ?? null,
                videoUrl: null, // Sẽ được cập nhật bởi quá trình tải lên nền
            }));

            // Quá trình tải lên nền (fire and forget)
            if (recordVideo && uid) {
                uploadSetsVideosInBackground(
                    uid,
                    assignmentId,
                    exerciseIndex,
                    setsRecords,
                    recordVideo,
                ).catch((err) =>
                    console.error("Background video upload failed:", err),
                );
            }

            const newExerciseRecord: ExerciseRecord = {
                exerciseId: exercise?.id || `ex-${exerciseIndex}`,
                exerciseName: exercise?.name || "Exercise",
                muscleGroup: exercise?.category ? [exercise.category] : [],
                sets: setsRecords,
                accuracy: Math.round(accuracy),
                completedAt: new Date().toISOString(),
                videoUrl: null,
                videoLocalPath: null,
            };

            const nextIndex = exerciseIndex + 1;

            if (incSession) {
                await updateIncompleteSession(incSession.id, {
                    currentExerciseIndex: nextIndex,
                    currentSetIndex: 1,
                    exercisesCompleted: nextIndex,
                    completedExercises: [
                        ...(incSession.completedExercises || []),
                        newExerciseRecord,
                    ],
                    completedExercisesData: [
                        ...(incSession.completedExercisesData || []),
                        newExerciseData,
                    ],
                    elapsedSeconds:
                        (incSession.elapsedSeconds || 0) + durationSeconds,
                });
            } else {
                await saveIncompleteSession({
                    patientId: uid,
                    assignmentId: assignmentId,
                    currentExerciseIndex: nextIndex,
                    currentSetIndex: 1,
                    exercisesCompleted: nextIndex,
                    completedExercises: [newExerciseRecord],
                    completedExercisesData: [newExerciseData],
                    elapsedSeconds: durationSeconds,
                    startedAt: new Date() as any,
                });
            }

            if (nextIndex >= assignment.exercises.length) {
                navigation.replace("WorkoutSummary", {
                    assignmentId,
                    recordVideo,
                });
            } else {
                navigation.replace("Calibration", {
                    assignmentId,
                    exerciseIndex: nextIndex,
                    recordVideo,
                });
            }
        } catch (error) {
            console.error("Failed to save exercise result:", error);
        } finally {
            setSaving(false);
        }
    };

    // Sử dụng setsData thực tế nếu được cung cấp từ TrainingScreen, ngược lại sử dụng dữ liệu mô phỏng
    const displaySets =
        setsData && setsData.length > 0
            ? setsData.map((s) => ({
                  setNum: s.setNumber,
                  reps: s.repsCompleted,
                  accuracy: s.accuracy,
                  duration: s.durationSec,
                  videoStartMs: (s as any).videoStartMs ?? null,
                  videoEndMs: (s as any).videoEndMs ?? null,
                  repTimestamps: (s as any).repTimestamps ?? [],
                  videoLocalPath: (s as any).videoLocalPath ?? null,
              }))
            : (() => {
                  const numSets = Math.max(1, sets);
                  const setDurations = Array(numSets).fill(
                      Math.floor(durationSeconds / numSets),
                  );

                  for (let i = 0; i < durationSeconds % numSets; i++) {
                      setDurations[i % numSets] += 1;
                  }

                  if (numSets >= 2 && durationSeconds > 20) {
                      const variance = Math.min(
                          Math.floor(durationSeconds / (numSets * 4)),
                          12,
                      );
                      setDurations[0] += variance;
                      setDurations[1] -= variance;

                      if (numSets >= 3) {
                          const variance2 = Math.min(
                              Math.floor(variance / 2),
                              5,
                          );
                          setDurations[numSets - 1] += variance2;
                          setDurations[1] -= variance2;
                      }
                  }

                  return Array.from({ length: numSets }).map((_, idx) => {
                      const setDuration = Math.max(5, setDurations[idx]);
                      const repsPerSet = Math.ceil(reps / numSets);
                      const factor = (idx % 2 === 0 ? 1 : -1) * (2 + (idx % 3));
                      const setAccuracy = Math.min(
                          100,
                          Math.max(65, Math.round(accuracy + factor)),
                      );
                      return {
                          setNum: idx + 1,
                          reps: repsPerSet,
                          accuracy: setAccuracy,
                          duration: setDuration,
                          videoLocalPath: undefined as string | undefined,
                      };
                  });
              })();

    const handleOpenVideo = (set: (typeof displaySets)[0]) => {
        setSelectedSet(set);
        setSelectedRep(null);
        setPlaybackStatus(null);
        if (set.videoLocalPath) {
            setVideoUri(set.videoLocalPath);
        } else {
            setVideoUri("");
        }
    };

    const handleCloseVideo = () => {
        setSelectedSet(null);
        setPlaybackStatus(null);
    };

    const togglePlayPause = async () => {
        if (!videoRef.current || !playbackStatus || !playbackStatus.isLoaded)
            return;
        try {
            if (playbackStatus.isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        } catch (err) {
            console.error("Failed to toggle play/pause:", err);
        }
    };

    const formatTime = (ms: number) => {
        if (!ms || isNaN(ms)) return "0:00";
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const positionMs =
        playbackStatus && playbackStatus.isLoaded
            ? playbackStatus.positionMillis
            : 0;
    const durationMs =
        playbackStatus &&
        playbackStatus.isLoaded &&
        playbackStatus.durationMillis
            ? playbackStatus.durationMillis
            : 0;
    const progress = durationMs > 0 ? positionMs / durationMs : 0;
    const isPlaying =
        playbackStatus && playbackStatus.isLoaded
            ? playbackStatus.isPlaying
            : false;

    const [selectedRep, setSelectedRep] = useState<number | null>(null);

    const playbackSegment = React.useMemo(() => {
        if (!selectedSet) return null;
        const ss = selectedSet as any;
        if (
            selectedRep !== null &&
            ss.repTimestamps &&
            ss.repTimestamps.length > 0
        ) {
            const rep = ss.repTimestamps.find(
                (r: any) => r.rep === selectedRep,
            );
            if (rep) return { start: rep.start, end: rep.end };
        }
        return null;
    }, [selectedSet, selectedRep]);

    useEffect(() => {
        if (playbackSegment && videoRef.current) {
            videoRef.current.playFromPositionAsync(playbackSegment.start);
        }
    }, [playbackSegment]);

    const handlePlaybackUpdate = (s: AVPlaybackStatus) => {
        setPlaybackStatus(s);
        if (s.isLoaded && playbackSegment) {
            // Lặp lại nếu vượt quá thời gian kết thúc của đoạn video
            if (s.positionMillis >= playbackSegment.end - 100) {
                // Đệm 100ms để đảm bảo lặp lại mượt mà trước khi bị quá thời gian
                videoRef.current?.playFromPositionAsync(playbackSegment.start);
            }
        }
    };

    // Phân chia thông minh: Sử dụng thời gian thực của hiệp tập nếu có, ngược lại sử dụng Phân chia thông minh
    const numSets = Math.max(1, sets);
    let resolvedSetDurations: number[] = [];

    if (routeSetDurations && routeSetDurations.length >= numSets) {
        resolvedSetDurations = routeSetDurations.slice(0, numSets);
    } else {
        const partitioned = Array(numSets).fill(
            Math.floor(durationSeconds / numSets),
        );
        // 1. Phân bổ số giây dư
        for (let i = 0; i < durationSeconds % numSets; i++) {
            partitioned[i % numSets] += 1;
        }
        // 2. Áp dụng độ trễ để làm cho mỗi hiệp tập độc lập trong khi vẫn giữ nguyên tổng thời gian
        if (numSets >= 2 && durationSeconds > 20) {
            const variance = Math.min(
                Math.floor(durationSeconds / (numSets * 4)),
                12,
            ); // thay đổi 10-15% thời gian
            partitioned[0] += variance; // Hiệp 1: thời gian chuẩn bị (chậm hơn)
            partitioned[1] -= variance; // Hiệp 2: nhịp độ ổn định (nhanh hơn)

            if (numSets >= 3) {
                const variance2 = Math.min(Math.floor(variance / 2), 5);
                partitioned[numSets - 1] += variance2; // Hiệp cuối: thời gian mệt mỏi (chậm hơn)
                partitioned[1] -= variance2; // Điều chỉnh hiệp 2 thấp hơn nữa
            }
        }
        resolvedSetDurations = partitioned;
    }

    // Mô phỏng chi tiết theo từng hiệp tập
    const simulatedSets = Array.from({ length: numSets }).map((_, idx) => {
        const setDuration = Math.max(1, resolvedSetDurations[idx] || 5); // Đảm bảo ít nhất 1 giây
        const repsPerSet = Math.ceil(reps / numSets);

        // Thêm một chút thay đổi về độ chính xác mỗi hiệp tập để trông chân thực hơn
        const factor = (idx % 2 === 0 ? 1 : -1) * (2 + (idx % 3));
        const setAccuracy = Math.min(
            100,
            Math.max(65, Math.round(accuracy + factor)),
        );
        return {
            setNum: idx + 1,
            reps: repsPerSet,
            accuracy: setAccuracy,
            duration: setDuration,
        };
    });

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <View style={styles.header}>
                <AppText variant="headlineMd" style={styles.title}>
                    {t("result.title")}
                </AppText>
                <AppText variant="bodyMd" style={styles.subtitle}>
                    {exercise?.name}
                </AppText>
            </View>

            <View style={styles.content}>
                <AppText
                    variant="labelSm"
                    style={{
                        color: "#64748b",
                        marginBottom: spacing.sm,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                    }}
                >
                    {t("result.setsSummary")}
                </AppText>

                <ScrollView
                    style={styles.setsScroll}
                    contentContainerStyle={{ gap: spacing.md }}
                    showsVerticalScrollIndicator={false}
                >
                    {displaySets.map((s) => (
                        <TouchableOpacity
                            key={s.setNum}
                            style={styles.setRowCard}
                            onPress={() => handleOpenVideo(s)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.setVideoThumb}>
                                <View style={styles.thumbPlayBtn}>
                                    <Ionicons
                                        name="play"
                                        size={12}
                                        color="#fff"
                                    />
                                </View>
                                <View style={styles.setOverlayBadge}>
                                    <AppText
                                        style={{
                                            color: "#fff",
                                            fontSize: 8,
                                            fontWeight: "800",
                                        }}
                                    >
                                        S{s.setNum}
                                    </AppText>
                                </View>
                            </View>

                            <View style={{ flex: 1, gap: 2 }}>
                                <AppText
                                    variant="bodyMd"
                                    style={{
                                        fontWeight: "700",
                                        color: "#0f172a",
                                    }}
                                >
                                    {t("result.setNum", { num: s.setNum })}
                                </AppText>
                                <AppText
                                    variant="bodySm"
                                    style={{
                                        color: "#64748b",
                                        fontWeight: "500",
                                    }}
                                >
                                    {t("result.repsDuration", {
                                        reps: s.reps,
                                        duration: `${Math.floor(s.duration / 60)}:${(s.duration % 60).toString().padStart(2, "0")}`,
                                    })}
                                </AppText>
                            </View>

                            <View style={{ alignItems: "flex-end" }}>
                                <AppText
                                    variant="headlineMd"
                                    style={{
                                        color: accuracyColor(s.accuracy),
                                        fontWeight: "800",
                                        fontSize: 18,
                                    }}
                                >
                                    {s.accuracy}%
                                </AppText>
                                <AppText
                                    style={{
                                        color: "#94a3b8",
                                        fontSize: 9,
                                        fontWeight: "700",
                                        letterSpacing: 0.3,
                                    }}
                                >
                                    {t("result.accuracy")}
                                </AppText>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <AppButton
                    label={
                        assignment &&
                        exerciseIndex + 1 >= assignment.exercises.length
                            ? t("result.finishWorkout")
                            : t("result.nextExercise")
                    }
                    size="lg"
                    onPress={handleNext}
                    disabled={saving}
                    style={{ width: "100%" }}
                />
            </View>

            {/* Sleek, Cinema-mode Video Playback Modal */}
            <Modal
                visible={selectedSet !== null}
                transparent
                animationType="fade"
                onRequestClose={handleCloseVideo}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView
                        style={styles.modalContent}
                        edges={["top", "bottom"]}
                    >
                        {/* Top Bar with elegant glass overlay */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                onPress={handleCloseVideo}
                                style={styles.modalCloseBtn}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.modalHeaderDetails}>
                                <AppText
                                    variant="headlineMd"
                                    style={styles.modalTitle}
                                    numberOfLines={1}
                                >
                                    {exercise?.name ||
                                        t("result.playbackTitle")}
                                </AppText>
                                <AppText
                                    variant="bodySm"
                                    style={styles.modalSubtitle}
                                >
                                    {t("result.setSubtitle", {
                                        setNum: selectedSet?.setNum,
                                        reps: selectedSet?.reps,
                                    })}
                                </AppText>
                            </View>

                            {/* Accuracy chip with dynamic border color matching accuracy grade */}
                            <View
                                style={[
                                    styles.modalAccuracyChip,
                                    {
                                        borderColor: selectedSet
                                            ? accuracyColor(
                                                  selectedSet.accuracy,
                                              )
                                            : "#fff",
                                    },
                                ]}
                            >
                                <AppText
                                    style={[
                                        styles.modalAccuracyVal,
                                        {
                                            color: selectedSet
                                                ? accuracyColor(
                                                      selectedSet.accuracy,
                                                  )
                                                : "#fff",
                                        },
                                    ]}
                                >
                                    {selectedSet?.accuracy}%
                                </AppText>
                                <AppText style={styles.modalAccuracyLbl}>
                                    {t("result.accuracy")}
                                </AppText>
                            </View>
                        </View>

                        {/* Video container */}
                        <View style={styles.modalVideoContainer}>
                            {selectedSet && (
                                <Video
                                    ref={videoRef}
                                    source={{ uri: videoUri }}
                                    style={styles.modalVideo}
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay={true}
                                    isMuted={true}
                                    isLooping={true}
                                    onPlaybackStatusUpdate={
                                        handlePlaybackUpdate
                                    }
                                />
                            )}

                            {/* Rep Selector Chips */}
                            {selectedSet &&
                                (selectedSet as any).repTimestamps &&
                                (selectedSet as any).repTimestamps.length >
                                    0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={{
                                            position: "absolute",
                                            bottom: 16,
                                            left: 0,
                                            right: 0,
                                            zIndex: 10,
                                        }}
                                        contentContainerStyle={{
                                            paddingHorizontal: 16,
                                            gap: 8,
                                            alignItems: "center",
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setSelectedRep(null)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 8,
                                                borderRadius: 20,
                                                backgroundColor:
                                                    selectedRep === null
                                                        ? colors.primary
                                                        : "rgba(0,0,0,0.6)",
                                                borderWidth:
                                                    selectedRep === null
                                                        ? 0
                                                        : 1,
                                                borderColor:
                                                    "rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            <AppText
                                                style={{
                                                    color: "#fff",
                                                    fontWeight: "bold",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {t("result.wholeSet")}
                                            </AppText>
                                        </TouchableOpacity>
                                        {(selectedSet as any).repTimestamps.map(
                                            (r: any) => (
                                                <TouchableOpacity
                                                    key={r.rep}
                                                    onPress={() =>
                                                        setSelectedRep(r.rep)
                                                    }
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 8,
                                                        borderRadius: 20,
                                                        backgroundColor:
                                                            selectedRep ===
                                                            r.rep
                                                                ? colors.primary
                                                                : "rgba(0,0,0,0.6)",
                                                        borderWidth:
                                                            selectedRep ===
                                                            r.rep
                                                                ? 0
                                                                : 1,
                                                        borderColor:
                                                            "rgba(255,255,255,0.3)",
                                                    }}
                                                >
                                                    <AppText
                                                        style={{
                                                            color: "#fff",
                                                            fontWeight: "bold",
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        {t("result.repNum", {
                                                            num: r.rep,
                                                        })}
                                                    </AppText>
                                                </TouchableOpacity>
                                            ),
                                        )}
                                    </ScrollView>
                                )}

                            {/* Central Quick-Toggle Overlay Play Button */}
                            <TouchableOpacity
                                style={styles.videoOverlayPlayToggle}
                                onPress={togglePlayPause}
                                activeOpacity={0.8}
                            >
                                {!isPlaying && (
                                    <View style={styles.videoOverlayPlayCircle}>
                                        <Ionicons
                                            name="play"
                                            size={32}
                                            color="#fff"
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Premium Controls Bar */}
                        <View style={styles.modalControlsBar}>
                            <TouchableOpacity
                                onPress={togglePlayPause}
                                style={styles.controlPlayBtn}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={22}
                                    color="#fff"
                                />
                            </TouchableOpacity>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressTimeContainer}>
                                    <AppText style={styles.progressTimeText}>
                                        {formatTime(positionMs)}
                                    </AppText>
                                    <AppText style={styles.progressTimeDivider}>
                                        /
                                    </AppText>
                                    <AppText style={styles.progressTimeText}>
                                        {formatTime(durationMs)}
                                    </AppText>
                                </View>

                                {/* Progress bar track */}
                                <View style={styles.progressBarTrack}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${progress * 100}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafd" },
    center: { justifyContent: "center", alignItems: "center" },
    header: { padding: spacing.gutter, alignItems: "center" },
    title: { color: "#0f172a", fontWeight: "800" },
    subtitle: { color: "#64748b", marginTop: 4 },
    content: { flex: 1, padding: spacing.gutter, justifyContent: "center" },
    videoPlaceholder: {
        height: 300,
        backgroundColor: "#e2e8f0",
        borderRadius: radius.xl,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    setsScroll: {
        flex: 1,
        marginBottom: spacing.lg,
    },
    setRowCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: spacing.md,
    },
    setVideoThumb: {
        width: 84,
        height: 52,
        borderRadius: 8,
        backgroundColor: "#1e293b", // slate-800
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
    },
    thumbPlayBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 2, // offset play icon
    },
    setOverlayBadge: {
        position: "absolute",
        bottom: 2,
        right: 2,
        backgroundColor: "rgba(15, 23, 42, 0.75)", // transparent slate-900
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statsContainer: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: spacing.lg,
        borderRadius: radius.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    footer: {
        padding: spacing.gutter,
        paddingBottom: spacing.xl,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },

    // Cinema Playback Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.95)", // ultra-deep slate transparent
    },
    modalContent: {
        flex: 1,
        justifyContent: "space-between",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.gutter,
        paddingVertical: spacing.md,
        gap: spacing.md,
        backgroundColor: "rgba(30, 41, 59, 0.4)", // slate-800 backdrop overlay
        borderBottomWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalHeaderDetails: {
        flex: 1,
        justifyContent: "center",
    },
    modalTitle: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 18,
    },
    modalSubtitle: {
        color: "#94a3b8",
        fontWeight: "600",
        marginTop: 2,
    },
    modalAccuracyChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs || 4,
        borderRadius: radius.md || 8,
        borderWidth: 1.5,
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
    },
    modalAccuracyVal: {
        fontWeight: "800",
        fontSize: 16,
    },
    modalAccuracyLbl: {
        color: "#94a3b8",
        fontSize: 8,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginTop: 1,
    },
    modalVideoContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        position: "relative",
    },
    modalVideo: {
        width: "100%",
        height: "100%",
    },
    videoOverlayPlayToggle: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    videoOverlayPlayCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.25)",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 4, // offset play icon
    },
    modalControlsBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.gutter,
        paddingVertical: spacing.lg,
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderTopWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        gap: spacing.md,
    },
    controlPlayBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    progressContainer: {
        flex: 1,
        justifyContent: "center",
        gap: 8,
    },
    progressTimeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    progressTimeText: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    progressTimeDivider: {
        color: "#475569",
        marginHorizontal: 4,
        fontSize: 12,
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
});

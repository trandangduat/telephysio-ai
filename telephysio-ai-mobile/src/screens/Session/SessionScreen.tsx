/**
 * @file SessionScreen.tsx
 * @description Màn hình chi tiết buổi tập, hiển thị video ghi hình và phản hồi từ bác sĩ.
 */

/**
 * SessionScreen - Màn hình chi tiết buổi tập.
 * Hiển thị thông tin chi tiết về buổi tập, video ghi hình bài tập và phản hồi từ bác sĩ.
 */
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Dimensions,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Video, ResizeMode } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

import { AppText } from "../../components/ui";
import { colors, spacing, typography, radius } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
    getPatientSessions,
    getActiveTreatmentPlan,
} from "../../services/firebase";
import type { Session, TreatmentPlan } from "../../services/firebase/types";
import { NotificationBell } from "../../components/NotificationBell";
import { Image } from "react-native";
import { VideoPlaybackModal } from "../../components/VideoPlaybackModal";
import { getVideoThumbnailUri } from "../../utils/videoUtils";

// ─── Hàm Hỗ Trợ ─────────────────────────────────────────────────────────────

/**
 * Định dạng đối tượng thời gian thành chuỗi hiển thị
 * @param raw - Giá trị thời gian gốc (đối tượng Date hoặc chuỗi/số)
 * @returns Chuỗi thời gian đã được định dạng
 */
function formatDate(raw: any): string {
    try {
        const d: Date =
            raw && typeof raw.toDate === "function"
                ? raw.toDate()
                : new Date(raw);
        return d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "Recent";
    }
}

/**
 * Lấy mã màu dựa trên mức độ chính xác của bài tập
 * @param acc - Phần trăm độ chính xác
 * @returns Mã màu HEX
 */
function accuracyColor(acc: number): string {
    if (acc >= 80) return "#059669";
    if (acc >= 60) return "#d97706";
    return "#dc2626";
}

/**
 * Định dạng thời lượng từ giây sang chuỗi "phút:giây"
 * @param totalSeconds - Tổng số giây
 * @returns Chuỗi thời gian đã định dạng
 */
function formatDurationSeconds(totalSeconds?: number): string {
    if (totalSeconds === undefined || totalSeconds === null) return "—";
    const safeSeconds = Number.isFinite(totalSeconds)
        ? Math.max(0, totalSeconds)
        : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = Math.floor(safeSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ─── Modal Chi Tiết Buổi Tập ─────────────────────────────────────────────────

interface SessionDetailModalProps {
    session: Session | null;
    visible: boolean;
    onClose: () => void;
}

/**
 * Modal hiển thị chi tiết của một buổi tập, bao gồm video và phản hồi
 * @param props - Các thuộc tính truyền vào component
 * @param props.session - Thông tin buổi tập
 * @param props.visible - Trạng thái hiển thị modal
 * @param props.onClose - Hàm gọi khi đóng modal
 * @returns Component React hiển thị modal chi tiết
 */
const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
    session,
    visible,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<"video" | "review">("video");
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(
        null,
    );
    const videoRef = useRef<Video>(null);
    const { t } = useTranslation();

    // Hỗ trợ tương thích ngược, sử dụng video của set cuối cùng làm mặc định
    const videoUrl = (session as any)?.videoUrl || null;

    /**
     * Chuyển đổi trạng thái phát/tạm dừng video
     * @returns Không có giá trị trả về
     */
    const togglePlay = async () => {
        if (!videoRef.current) return;
        try {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        } catch (err) {
            console.error("Failed to toggle play:", err);
        }
    };

    useEffect(() => {
        if (status && status.isLoaded) {
            setIsPlaying(status.isPlaying);
        }
    }, [status]);

    if (!session) return null;

    const accuracy = Math.round(
        (session as any).accuracyScore ?? (session as any).accuracy ?? 0,
    );
    const exercises =
        (session as any).exercisesCompleted ??
        (session as any).completedExercises ??
        0;
    const duration =
        (session as any).duration ?? (session as any).totalDuration ?? "—";

    const doctorReview: string | undefined = (session as any).doctorFeedback;
    const doctorName: string =
        (session as any).doctorName ?? t("session.assignedDoctor");
    const reviewDate: string | undefined = (session as any).reviewedAt
        ? formatDate((session as any).reviewedAt)
        : undefined;

    const completedExercisesData: Array<any> =
        (session as any).exercises ??
        (session as any).completedExercisesData ??
        [];
    const exercises_list: string[] = (session as any).exerciseList ?? [];
    const hasDetailedExercises = completedExercisesData.length > 0;
    const hasExerciseList = exercises_list.length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={detail.overlay}>
                <SafeAreaView style={detail.sheet} edges={["top", "bottom"]}>
                    {/* Phần đầu */}
                    <View style={detail.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={detail.backBtn}
                        >
                            <Ionicons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <View style={{ alignItems: "center" }}>
                            <AppText
                                variant="headlineMd"
                                style={detail.headerTitle}
                            >
                                {t("session.summary")}
                            </AppText>
                            <AppText
                                variant="bodySm"
                                style={{ color: "#64748b", marginTop: 2 }}
                            >
                                {formatDate((session as any).date)}
                            </AppText>
                        </View>
                        <View style={{ width: 36 }} />
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingBottom: 40,
                            paddingHorizontal: 16,
                        }}
                    >
                        {/* Quick stats overview */}
                        <View
                            style={[
                                detail.statsRow,
                                { marginTop: 24, marginBottom: 16 },
                            ]}
                        >
                            <StatCard
                                icon="barbell-outline"
                                label={t("session.exercises")}
                                value={`${exercises}`}
                            />
                            <StatCard
                                icon="time-outline"
                                label={t("session.duration")}
                                value={`${duration}`}
                            />
                            <StatCard
                                icon="analytics-outline"
                                label={t("session.accuracy")}
                                value={`${accuracy}%`}
                                valueColor={accuracyColor(accuracy)}
                            />
                        </View>

                        {/* Tabs */}
                        <View style={detail.tabRow}>
                            <TouchableOpacity
                                style={[
                                    detail.tab,
                                    activeTab === "video" && detail.tabActive,
                                ]}
                                onPress={() => setActiveTab("video")}
                            >
                                <Ionicons
                                    name="videocam-outline"
                                    size={16}
                                    color={
                                        activeTab === "video"
                                            ? colors.primary
                                            : "#64748b"
                                    }
                                    style={{ marginRight: 6 }}
                                />
                                <AppText
                                    variant="labelMd"
                                    style={[
                                        detail.tabLabel,
                                        activeTab === "video" && {
                                            color: colors.primary,
                                        },
                                    ]}
                                >
                                    {t("session.exerciseRecordings")}
                                </AppText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    detail.tab,
                                    activeTab === "review" && detail.tabActive,
                                ]}
                                onPress={() => setActiveTab("review")}
                            >
                                <Ionicons
                                    name="medical-outline"
                                    size={16}
                                    color={
                                        activeTab === "review"
                                            ? colors.primary
                                            : "#64748b"
                                    }
                                    style={{ marginRight: 6 }}
                                />
                                <AppText
                                    variant="labelMd"
                                    style={[
                                        detail.tabLabel,
                                        activeTab === "review" && {
                                            color: colors.primary,
                                        },
                                    ]}
                                >
                                    {t("session.doctorReview")}
                                </AppText>
                            </TouchableOpacity>
                        </View>

                        {/* ── VIDEO TAB ── */}
                        {activeTab === "video" && (
                            <View>
                                {videoUrl ? (
                                    <View style={detail.videoWrapper}>
                                        <Video
                                            ref={videoRef}
                                            source={{
                                                uri: (() => {
                                                    if (Platform.OS !== "web")
                                                        return videoUrl || "";
                                                    let resolved =
                                                        typeof window !==
                                                            "undefined" &&
                                                        videoUrl &&
                                                        (window as any)
                                                            .__recordedVideos?.[
                                                            videoUrl
                                                        ]
                                                            ? (window as any)
                                                                  .__recordedVideos[
                                                                  videoUrl
                                                              ]
                                                            : videoUrl;
                                                    if (
                                                        resolved &&
                                                        !resolved.startsWith(
                                                            "http",
                                                        ) &&
                                                        !resolved.startsWith(
                                                            "blob:",
                                                        ) &&
                                                        !resolved.startsWith(
                                                            "/",
                                                        )
                                                    ) {
                                                        resolved =
                                                            "/" + resolved;
                                                    }
                                                    return resolved || "";
                                                })(),
                                            }}
                                            style={detail.video}
                                            resizeMode={ResizeMode.COVER}
                                            onPlaybackStatusUpdate={(s) =>
                                                setStatus(s)
                                            }
                                            shouldPlay={false}
                                            useNativeControls={false}
                                            onError={(error) =>
                                                console.error(
                                                    "Video Error:",
                                                    error,
                                                )
                                            }
                                            onLoadStart={() =>
                                                console.log(
                                                    "Video Loading Started:",
                                                    videoUrl,
                                                )
                                            }
                                        />
                                        <TouchableOpacity
                                            style={detail.playOverlay}
                                            onPress={togglePlay}
                                            activeOpacity={0.8}
                                        >
                                            {!isPlaying && (
                                                <View style={detail.playCircle}>
                                                    <Ionicons
                                                        name="play"
                                                        size={28}
                                                        color="#fff"
                                                    />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {status &&
                                        (status as any).durationMillis ? (
                                            <View style={detail.progressTrack}>
                                                <View
                                                    style={[
                                                        detail.progressFill,
                                                        {
                                                            width: `${
                                                                (((
                                                                    status as any
                                                                )
                                                                    .positionMillis ??
                                                                    0) /
                                                                    (
                                                                        status as any
                                                                    )
                                                                        .durationMillis) *
                                                                100
                                                            }%`,
                                                        },
                                                    ]}
                                                />
                                            </View>
                                        ) : null}
                                    </View>
                                ) : null}
                                {/* Exercises list */}
                                <View style={{ marginTop: 16, gap: 16 }}>
                                    <View style={detail.card}>
                                        <View style={detail.cardHeader}>
                                            <Ionicons
                                                name="fitness"
                                                size={20}
                                                color={colors.primary}
                                            />
                                            <AppText
                                                variant="labelMd"
                                                style={detail.cardTitle}
                                            >
                                                {t(
                                                    "session.exercisesCompleted",
                                                )}
                                            </AppText>
                                        </View>
                                        {hasDetailedExercises ? (
                                            <View style={{ gap: 14 }}>
                                                {completedExercisesData.map(
                                                    (ex: any, i: number) => {
                                                        const setCount =
                                                            Array.isArray(
                                                                ex.sets,
                                                            )
                                                                ? ex.sets.length
                                                                : (ex.sets ??
                                                                  0);
                                                        const repCount =
                                                            ex.reps ?? 0;
                                                        const accuracy =
                                                            ex.accuracy ?? 0;
                                                        const durationText =
                                                            formatDurationSeconds(
                                                                ex.durationSeconds,
                                                            );

                                                        return (
                                                            <View
                                                                key={i}
                                                                style={
                                                                    detail.exerciseSummaryRow
                                                                }
                                                            >
                                                                <View
                                                                    style={[
                                                                        detail.exerciseSummaryIcon,
                                                                        {
                                                                            backgroundColor:
                                                                                (ex.color ||
                                                                                    colors.primary) +
                                                                                "1A",
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Ionicons
                                                                        name={
                                                                            (ex.icon ||
                                                                                "barbell-outline") as any
                                                                        }
                                                                        size={
                                                                            18
                                                                        }
                                                                        color={
                                                                            ex.color ||
                                                                            colors.primary
                                                                        }
                                                                    />
                                                                </View>
                                                                <View
                                                                    style={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    <AppText
                                                                        variant="bodyMd"
                                                                        style={
                                                                            detail.exerciseSummaryName
                                                                        }
                                                                    >
                                                                        {ex.name ||
                                                                            `Exercise ${i + 1}`}
                                                                    </AppText>
                                                                    <AppText
                                                                        variant="labelSm"
                                                                        style={
                                                                            detail.exerciseSummaryMeta
                                                                        }
                                                                    >
                                                                        {t(
                                                                            "session.setRepAccuracyDuration",
                                                                            {
                                                                                sets: setCount,
                                                                                reps: repCount,
                                                                                accuracy:
                                                                                    accuracy,
                                                                                duration:
                                                                                    durationText,
                                                                            },
                                                                        )}
                                                                    </AppText>
                                                                    {setCount >
                                                                        0 && (
                                                                        <ScrollView
                                                                            horizontal
                                                                            showsHorizontalScrollIndicator={
                                                                                false
                                                                            }
                                                                            style={
                                                                                detail.exerciseThumbs
                                                                            }
                                                                            contentContainerStyle={
                                                                                detail.exerciseThumbsContent
                                                                            }
                                                                        >
                                                                            {(() => {
                                                                                const setsToRender =
                                                                                    ex.sets &&
                                                                                    Array.isArray(
                                                                                        ex.sets,
                                                                                    )
                                                                                        ? ex.sets
                                                                                        : Array.from(
                                                                                              {
                                                                                                  length: setCount,
                                                                                              },
                                                                                          ).map(
                                                                                              (
                                                                                                  _,
                                                                                                  idx,
                                                                                              ) => ({
                                                                                                  setNumber:
                                                                                                      idx +
                                                                                                      1,
                                                                                              }),
                                                                                          );

                                                                                return setsToRender.map(
                                                                                    (
                                                                                        set: any,
                                                                                        setIdx: number,
                                                                                    ) => {
                                                                                        const vUri =
                                                                                            set.videoUrl ||
                                                                                            set.videoLocalPath;
                                                                                        const tUri =
                                                                                            getVideoThumbnailUri(
                                                                                                set.videoUrl,
                                                                                                set.videoLocalPath,
                                                                                            );
                                                                                        return (
                                                                                            <TouchableOpacity
                                                                                                key={
                                                                                                    setIdx
                                                                                                }
                                                                                                style={
                                                                                                    detail.exerciseThumbBox
                                                                                                }
                                                                                                onPress={() => {
                                                                                                    if (
                                                                                                        vUri
                                                                                                    )
                                                                                                        setSelectedVideoUrl(
                                                                                                            vUri,
                                                                                                        );
                                                                                                }}
                                                                                            >
                                                                                                <View
                                                                                                    style={
                                                                                                        detail.exerciseThumbVideo
                                                                                                    }
                                                                                                >
                                                                                                    {tUri ? (
                                                                                                        <Image
                                                                                                            source={{
                                                                                                                uri: tUri,
                                                                                                            }}
                                                                                                            style={{
                                                                                                                width: "100%",
                                                                                                                height: "100%",
                                                                                                                borderRadius: 6,
                                                                                                            }}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <Ionicons
                                                                                                            name={
                                                                                                                vUri
                                                                                                                    ? "play-circle"
                                                                                                                    : "videocam-outline"
                                                                                                            }
                                                                                                            size={
                                                                                                                16
                                                                                                            }
                                                                                                            color={
                                                                                                                vUri
                                                                                                                    ? "#fff"
                                                                                                                    : "#64748b"
                                                                                                            }
                                                                                                        />
                                                                                                    )}
                                                                                                </View>
                                                                                                <AppText
                                                                                                    variant="labelSm"
                                                                                                    style={
                                                                                                        detail.exerciseThumbLabel
                                                                                                    }
                                                                                                >
                                                                                                    {t(
                                                                                                        "session.setNum",
                                                                                                        {
                                                                                                            num:
                                                                                                                set.setNumber ||
                                                                                                                setIdx +
                                                                                                                    1,
                                                                                                        },
                                                                                                    )}
                                                                                                </AppText>
                                                                                            </TouchableOpacity>
                                                                                        );
                                                                                    },
                                                                                );
                                                                            })()}
                                                                        </ScrollView>
                                                                    )}
                                                                </View>
                                                                <Ionicons
                                                                    name="checkmark-circle"
                                                                    size={18}
                                                                    color="#16a34a"
                                                                    style={{
                                                                        alignSelf:
                                                                            "flex-start",
                                                                        marginTop: 2,
                                                                    }}
                                                                />
                                                            </View>
                                                        );
                                                    },
                                                )}
                                            </View>
                                        ) : hasExerciseList ? (
                                            <View style={{ gap: 12 }}>
                                                {exercises_list.map((ex, i) => (
                                                    <View
                                                        key={i}
                                                        style={
                                                            detail.exerciseItem
                                                        }
                                                    >
                                                        <View
                                                            style={detail.exDot}
                                                        />
                                                        <AppText
                                                            variant="bodyMd"
                                                            style={
                                                                detail.exName
                                                            }
                                                        >
                                                            {ex}
                                                        </AppText>
                                                        <AppText
                                                            variant="labelSm"
                                                            style={
                                                                detail.exMeta
                                                            }
                                                        >
                                                            {t(
                                                                "session.completedBadge",
                                                            )}
                                                        </AppText>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <View style={detail.noExerciseBox}>
                                                <Ionicons
                                                    name="file-tray-outline"
                                                    size={32}
                                                    color="#94a3b8"
                                                />
                                                <AppText
                                                    variant="labelMd"
                                                    style={
                                                        detail.noExerciseTitle
                                                    }
                                                >
                                                    {t(
                                                        "session.noRecordingsTitle",
                                                    )}
                                                </AppText>
                                                <AppText
                                                    variant="bodySm"
                                                    style={
                                                        detail.noExerciseDesc
                                                    }
                                                >
                                                    {t(
                                                        "session.noRecordingsDesc",
                                                    )}
                                                </AppText>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── REVIEW TAB ── */}
                        {activeTab === "review" && (
                            <View style={{ marginTop: 16, gap: 16 }}>
                                {(session as any).formBreakdown && (
                                    <View style={detail.card}>
                                        <View style={detail.cardHeader}>
                                            <Ionicons
                                                name="analytics"
                                                size={20}
                                                color={colors.primary}
                                            />
                                            <AppText
                                                variant="labelMd"
                                                style={detail.cardTitle}
                                            >
                                                {t("session.formAnalysis")}
                                            </AppText>
                                        </View>
                                        <View style={detail.breakdownList}>
                                            {Object.entries(
                                                (session as any).formBreakdown,
                                            ).map(
                                                ([key, val]: [string, any]) => (
                                                    <View
                                                        key={key}
                                                        style={
                                                            detail.breakdownRow
                                                        }
                                                    >
                                                        <AppText
                                                            variant="bodySm"
                                                            style={
                                                                detail.breakdownKey
                                                            }
                                                        >
                                                            {key}
                                                        </AppText>
                                                        <View
                                                            style={
                                                                detail.breakdownTrack
                                                            }
                                                        >
                                                            <View
                                                                style={[
                                                                    detail.breakdownFill,
                                                                    {
                                                                        width: `${val}%`,
                                                                        backgroundColor:
                                                                            accuracyColor(
                                                                                val,
                                                                            ),
                                                                    },
                                                                ]}
                                                            />
                                                        </View>
                                                        <AppText
                                                            variant="labelSm"
                                                            style={[
                                                                detail.breakdownVal,
                                                                {
                                                                    color: accuracyColor(
                                                                        val,
                                                                    ),
                                                                },
                                                            ]}
                                                        >
                                                            {val}%
                                                        </AppText>
                                                    </View>
                                                ),
                                            )}
                                        </View>
                                    </View>
                                )}

                                <View style={detail.card}>
                                    <View style={detail.cardHeader}>
                                        <Ionicons
                                            name="chatbox-ellipses"
                                            size={20}
                                            color={colors.primary}
                                        />
                                        <AppText
                                            variant="labelMd"
                                            style={detail.cardTitle}
                                        >
                                            {t("session.clinicalFeedback")}
                                        </AppText>
                                    </View>
                                    {doctorReview ? (
                                        <>
                                            <View style={detail.doctorCard}>
                                                <View
                                                    style={detail.doctorAvatar}
                                                >
                                                    <Ionicons
                                                        name="person"
                                                        size={18}
                                                        color="#fff"
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <AppText
                                                        variant="labelMd"
                                                        style={
                                                            detail.doctorName
                                                        }
                                                    >
                                                        {doctorName}
                                                    </AppText>
                                                    {reviewDate && (
                                                        <AppText
                                                            variant="labelSm"
                                                            style={
                                                                detail.reviewDate
                                                            }
                                                        >
                                                            {t(
                                                                "session.reviewedOn",
                                                                {
                                                                    date: reviewDate,
                                                                },
                                                            )}
                                                        </AppText>
                                                    )}
                                                </View>
                                                <View
                                                    style={detail.verifiedBadge}
                                                >
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={14}
                                                        color={colors.primary}
                                                    />
                                                    <AppText
                                                        variant="labelSm"
                                                        style={{
                                                            color: colors.primary,
                                                            marginLeft: 4,
                                                        }}
                                                    >
                                                        {t("session.verified")}
                                                    </AppText>
                                                </View>
                                            </View>
                                            <View style={detail.reviewBox}>
                                                <AppText
                                                    variant="bodyMd"
                                                    style={detail.reviewText}
                                                >
                                                    {doctorReview}
                                                </AppText>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={detail.noReviewBox}>
                                            <Ionicons
                                                name="hourglass-outline"
                                                size={36}
                                                color="#94a3b8"
                                            />
                                            <AppText
                                                variant="labelMd"
                                                style={detail.noReviewTitle}
                                            >
                                                {t("session.noReviewTitle")}
                                            </AppText>
                                            <AppText
                                                variant="bodySm"
                                                style={detail.noReviewDesc}
                                            >
                                                {t("session.noReviewDesc")}
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
            <VideoPlaybackModal
                visible={!!selectedVideoUrl}
                videoUri={selectedVideoUrl || ""}
                onClose={() => setSelectedVideoUrl(null)}
            />
        </Modal>
    );
};

/**
 * Thẻ hiển thị một chỉ số thống kê cơ bản
 * @param props - Thông tin thuộc tính
 * @param props.icon - Tên icon (Ionicons)
 * @param props.label - Nhãn mô tả
 * @param props.value - Giá trị thống kê
 * @param props.valueColor - Màu sắc của giá trị hiển thị
 * @returns Component giao diện thẻ thống kê
 */
const StatCard = ({
    icon,
    label,
    value,
    valueColor = colors.primary,
}: {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
}) => (
    <View style={detail.statCard}>
        <View style={detail.statIconCircle}>
            <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <AppText
            variant="headlineMd"
            style={[detail.statValue, { color: valueColor }]}
        >
            {value}
        </AppText>
        <AppText variant="labelSm" style={detail.statLabel}>
            {label}
        </AppText>
    </View>
);

// ─── Màn Hình Chính ───────────────────────────────────────────────────────────

/**
 * Component màn hình danh sách và lịch sử các buổi tập
 * @returns Component React hiển thị giao diện màn hình
 */
export const SessionScreen: React.FC = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { uid } = useAuth();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(
        null,
    );
    const [selectedSession, setSelectedSession] = useState<Session | null>(
        null,
    );
    const [detailVisible, setDetailVisible] = useState(false);

    useEffect(() => {
        /**
         * Hàm tải dữ liệu buổi tập và kế hoạch điều trị từ Firebase
         * @returns Không có giá trị trả về
         */
        async function loadData() {
            if (!uid) {
                setLoading(false);
                return;
            }
            try {
                const [fetchedSessions, fetchedPlan] = await Promise.all([
                    getPatientSessions(uid, 20),
                    getActiveTreatmentPlan(uid),
                ]);
                setSessions(fetchedSessions);
                setTreatmentPlan(fetchedPlan);
            } catch (error) {
                console.error("Error loading session data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [uid]);

    /**
     * Mở modal chi tiết của một buổi tập được chọn
     * @param session - Đối tượng buổi tập cần xem chi tiết
     * @returns Không có giá trị trả về
     */
    const openDetail = (session: Session) => {
        setSelectedSession(session);
        setDetailVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]} edges={["top"]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const latestSession = sessions.length > 0 ? sessions[0] : null;
    const olderSessions = sessions.length > 1 ? sessions.slice(1) : [];

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Thanh điều hướng trên cùng */}
            <View style={styles.topBar}>
                <View style={styles.logoRow}>
                    <Ionicons name="medical" size={20} color={colors.primary} />
                    <AppText variant="labelMd" style={styles.logoText}>
                        TelePhysioAI
                    </AppText>
                </View>
                <View style={styles.topBarIcons}>
                    <NotificationBell />
                    <TouchableOpacity
                        style={styles.avatarBtn}
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <Ionicons name="person" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <AppText variant="headlineLg" style={styles.pageTitle}>
                    {t("session.historyTitle")}
                </AppText>
                <AppText variant="bodyMd" style={styles.pageSubtitle}>
                    {t("session.historySubtitle")}
                </AppText>

                {/* ── Buổi tập gần nhất nổi bật ── */}
                {latestSession ? (
                    <TouchableOpacity
                        style={styles.featuredCard}
                        activeOpacity={0.85}
                        onPress={() => openDetail(latestSession)}
                    >
                        {/* Banner tối màu với biểu tượng phát */}
                        <View style={styles.featuredBanner}>
                            <View style={styles.playCircleLg}>
                                <Ionicons name="play" size={22} color="#fff" />
                            </View>
                            <View style={styles.recentBadge}>
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={12}
                                    color="#fff"
                                    style={{ marginRight: 4 }}
                                />
                                <AppText
                                    variant="labelSm"
                                    style={{ color: "#fff" }}
                                >
                                    {t("session.latestSession")}
                                </AppText>
                            </View>
                        </View>

                        <View style={styles.featuredBody}>
                            <AppText
                                variant="labelSm"
                                style={styles.featuredEyebrow}
                            >
                                {t("session.reviewSession")}
                            </AppText>
                            <AppText
                                variant="headlineMd"
                                style={styles.featuredTitle}
                            >
                                {formatDate((latestSession as any).date)}
                            </AppText>

                            <View style={styles.featuredMeta}>
                                <MetaPill
                                    icon="barbell-outline"
                                    text={`${(latestSession as any).exercisesCompleted ?? (latestSession as any).completedExercises ?? 0} ${t("common.exercises", { defaultValue: "exercises" })}`}
                                />
                                <MetaPill
                                    icon="time-outline"
                                    text={`${(latestSession as any).duration ?? (latestSession as any).totalDuration ?? "—"}`}
                                />
                                <MetaPill
                                    icon="analytics-outline"
                                    text={`${Math.round((latestSession as any).accuracyScore ?? (latestSession as any).accuracy ?? 0)}% ${t("common.accuracy", { defaultValue: "accuracy" })}`}
                                />
                            </View>

                            {(latestSession as any).doctorFeedback && (
                                <View style={styles.doctorSnippet}>
                                    <Ionicons
                                        name="medical"
                                        size={12}
                                        color={colors.primary}
                                    />
                                    <AppText
                                        variant="bodySm"
                                        style={styles.doctorSnippetText}
                                    >
                                        {t("session.doctorFeedbackAvailable")}
                                    </AppText>
                                </View>
                            )}

                            <View style={styles.viewDetailRow}>
                                <AppText
                                    variant="labelMd"
                                    style={{ color: colors.primary }}
                                >
                                    {t("session.viewDetails")}
                                </AppText>
                                <Ionicons
                                    name="arrow-forward"
                                    size={16}
                                    color={colors.primary}
                                    style={{ marginLeft: 6 }}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyCard}>
                        <AppText variant="bodyMd" style={{ color: "#64748b" }}>
                            {t("session.noSessions")}
                        </AppText>
                    </View>
                )}

                {/* ── Thẻ mục tiêu hàng tuần ── */}
                {treatmentPlan && (
                    <View style={styles.goalCard}>
                        <AppText variant="labelMd" style={{ color: "#e0e7ff" }}>
                            {t("session.goal", {
                                condition: treatmentPlan.condition,
                            })}
                        </AppText>
                        <AppText
                            variant="bodySm"
                            style={{
                                color: "#e0e7ff",
                                marginBottom: spacing.md,
                            }}
                        >
                            {t("session.phaseWeek", {
                                phase: treatmentPlan.currentPhase,
                                week: treatmentPlan.currentWeek,
                                totalWeeks: treatmentPlan.totalWeeks,
                            })}
                        </AppText>
                        <View style={styles.goalRow}>
                            <AppText style={styles.goalPercent}>
                                {treatmentPlan.progress}%
                            </AppText>
                        </View>
                        <View style={styles.goalTrack}>
                            <View
                                style={[
                                    styles.goalFill,
                                    { width: `${treatmentPlan.progress}%` },
                                ]}
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Ionicons
                                name="trending-up"
                                size={16}
                                color="#34d399"
                            />
                            <AppText
                                variant="labelSm"
                                style={{ color: "#e0e7ff", marginLeft: 8 }}
                            >
                                {treatmentPlan.status === "on-track"
                                    ? t("session.onTrack")
                                    : treatmentPlan.status === "ahead"
                                      ? t("session.ahead")
                                      : t("session.consistent")}
                            </AppText>
                        </View>
                    </View>
                )}

                {/* ── Danh sách buổi tập cũ ── */}
                {olderSessions.length > 0 && (
                    <>
                        <AppText
                            variant="labelMd"
                            style={styles.listSectionTitle}
                        >
                            {t("session.previousSessions")}
                        </AppText>
                        {olderSessions.map((session) => {
                            const acc = Math.round(
                                (session as any).accuracyScore ??
                                    (session as any).accuracy ??
                                    0,
                            );
                            const exCount =
                                (session as any).exercisesCompleted ??
                                (session as any).completedExercises ??
                                0;
                            const dur =
                                (session as any).duration ??
                                (session as any).totalDuration ??
                                "—";
                            const hasReview = !!(session as any).doctorFeedback;
                            const hasVideo = !!(session as any).videoUrl;

                            return (
                                <TouchableOpacity
                                    key={session.id}
                                    style={styles.listCard}
                                    activeOpacity={0.8}
                                    onPress={() => openDetail(session)}
                                >
                                    <View style={styles.listLeft}>
                                        <View style={styles.listIconBox}>
                                            <Ionicons
                                                name="play-circle-outline"
                                                size={22}
                                                color={colors.primary}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <AppText
                                                variant="labelMd"
                                                style={styles.listDate}
                                            >
                                                {formatDate(
                                                    (session as any).date,
                                                )}
                                            </AppText>
                                            <AppText
                                                variant="bodySm"
                                                style={styles.listMeta}
                                            >
                                                {exCount}{" "}
                                                {t("common.exercises", {
                                                    defaultValue: "exercises",
                                                })}{" "}
                                                · {dur}
                                            </AppText>
                                            <View style={styles.badgeRow}>
                                                {hasVideo && (
                                                    <View style={styles.badge}>
                                                        <Ionicons
                                                            name="videocam-outline"
                                                            size={10}
                                                            color={
                                                                colors.primary
                                                            }
                                                        />
                                                        <AppText
                                                            style={
                                                                styles.badgeText
                                                            }
                                                        >
                                                            {t(
                                                                "session.videoBadge",
                                                            )}
                                                        </AppText>
                                                    </View>
                                                )}
                                                {hasReview && (
                                                    <View
                                                        style={[
                                                            styles.badge,
                                                            styles.badgeGreen,
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name="medical-outline"
                                                            size={10}
                                                            color="#059669"
                                                        />
                                                        <AppText
                                                            style={[
                                                                styles.badgeText,
                                                                {
                                                                    color: "#059669",
                                                                },
                                                            ]}
                                                        >
                                                            {t(
                                                                "session.reviewedBadge",
                                                            )}
                                                        </AppText>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.listRight}>
                                        <AppText
                                            variant="headlineMd"
                                            style={[
                                                styles.listAccuracy,
                                                { color: accuracyColor(acc) },
                                            ]}
                                        >
                                            {acc}%
                                        </AppText>
                                        <AppText
                                            variant="labelSm"
                                            style={styles.listAccLabel}
                                        >
                                            {t("common.accuracy", {
                                                defaultValue: "accuracy",
                                            })}
                                        </AppText>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color="#cbd5e1"
                                            style={{ marginTop: 4 }}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}

                {/* Thẻ thông tin */}
                <View style={styles.infoCard}>
                    <View style={styles.infoIconBox}>
                        <Ionicons
                            name="videocam-outline"
                            size={24}
                            color={colors.primary}
                        />
                    </View>
                    <AppText variant="labelMd" style={styles.infoTitle}>
                        {t("session.videoRecorded")}
                    </AppText>
                    <AppText variant="bodySm" style={styles.infoDesc}>
                        {t("session.videoRecordedDesc")}
                    </AppText>
                </View>
            </ScrollView>

            {/* Modal Chi Tiết Buổi Tập */}
            <SessionDetailModal
                session={selectedSession}
                visible={detailVisible}
                onClose={() => {
                    setDetailVisible(false);
                    setSelectedSession(null);
                }}
            />
        </SafeAreaView>
    );
};

// ─── Component Hỗ Trợ Nhỏ ────────────────────────────────────────────────────

/**
 * Component hiển thị nhãn nhỏ đi kèm với icon (Pill)
 * @param props - Thuộc tính truyền vào
 * @param props.icon - Tên icon cần hiển thị
 * @param props.text - Nội dung nhãn
 * @returns Component giao diện nhãn nhỏ
 */
const MetaPill = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.metaPill}>
        <Ionicons name={icon as any} size={12} color="#64748b" />
        <AppText variant="labelSm" style={styles.metaPillText}>
            {text}
        </AppText>
    </View>
);

// ─── Biểu Định Kiểu (StyleSheets) ────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafd" },
    center: { justifyContent: "center", alignItems: "center" },

    // Top bar
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBtn: { padding: 4 },
    avatarBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    scroll: { flex: 1 },
    content: {
        padding: spacing.gutter,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },

    notifDot: {
        position: "absolute",
        right: 4,
        top: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ef4444",
        borderWidth: 2,
        borderColor: "#fff",
    },

    pageTitle: { color: "#0f172a", fontWeight: "800" },
    pageSubtitle: { color: "#64748b", marginTop: 4 },

    // Featured card
    featuredCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    featuredBanner: {
        height: 160,
        backgroundColor: "#1e293b",
        alignItems: "center",
        justifyContent: "center",
    },
    playCircleLg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    recentBadge: {
        position: "absolute",
        top: spacing.md,
        left: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#059669",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    featuredBody: { padding: spacing.lg },
    featuredEyebrow: {
        color: colors.primary,
        fontWeight: "700",
        fontSize: 10,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    featuredTitle: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 20,
        marginBottom: spacing.md,
    },
    featuredMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: spacing.md,
    },
    doctorSnippet: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#eff6ff",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: "flex-start",
        marginBottom: spacing.md,
    },
    doctorSnippetText: { color: colors.primary },
    viewDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },

    // Meta pill
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    metaPillText: { color: "#475569", fontSize: 11 },

    // Goal card
    goalCard: {
        backgroundColor: "#1d4ed8",
        borderRadius: 20,
        padding: spacing.lg,
        elevation: 2,
        shadowColor: "#1d4ed8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    goalRow: { marginBottom: spacing.md },
    goalPercent: {
        color: "#fff",
        fontSize: 36,
        fontFamily: typography.headlineXl.fontFamily,
        fontWeight: "700",
    },
    goalTrack: {
        height: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 4,
        marginBottom: spacing.md,
    },
    goalFill: { height: "100%", backgroundColor: "#34d399", borderRadius: 4 },

    // List section
    listSectionTitle: {
        color: "#64748b",
        fontSize: 11,
        letterSpacing: 0.5,
        fontWeight: "700",
        marginBottom: -4,
    },
    listCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    listLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    listIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
    },
    listDate: { color: "#0f172a", fontWeight: "600", marginBottom: 2 },
    listMeta: { color: "#64748b", marginBottom: 6 },
    badgeRow: { flexDirection: "row", gap: 6 },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#eff6ff",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeGreen: { backgroundColor: "#f0fdf4" },
    badgeText: { color: colors.primary, fontSize: 10, fontWeight: "600" },
    listRight: { alignItems: "flex-end" },
    listAccuracy: { fontSize: 18, fontWeight: "700" },
    listAccLabel: { color: "#94a3b8", fontSize: 10 },

    // Info card
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
        alignItems: "center",
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    infoTitle: { color: colors.primary, fontWeight: "700", marginBottom: 8 },
    infoDesc: { color: "#64748b", textAlign: "center", lineHeight: 20 },

    // Empty
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        alignItems: "center",
    },
});

// Detail modal styles
const detail = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.5)",
        justifyContent: "flex-end",
    },
    sheet: {
        flex: 1,
        backgroundColor: "#f8fafd",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
        marginTop: 48,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.gutter,
        paddingVertical: spacing.md,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { color: "#0f172a", fontWeight: "700" },

    // Meta
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
    },
    metaText: { color: "#64748b" },

    // Video player
    videoWrapper: {
        width: "100%",
        aspectRatio: 16 / 9,
        backgroundColor: "#000",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: spacing.md,
        position: "relative",
    },
    video: {
        width: "100%",
        height: "100%",
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    playCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    progressTrack: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary,
    },

    // Stats

    // New Card Styles
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: spacing.md,
    },
    cardTitle: { fontWeight: "600", fontSize: 16, color: "#0f172a" },

    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statValue: { fontSize: 20, fontWeight: "800" },
    statLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "700",
        marginTop: 4,
    },

    exerciseItem: { flexDirection: "row", alignItems: "center", gap: 12 },
    exDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    exName: { flex: 1, fontWeight: "500", color: "#0f172a", fontSize: 14 },
    exMeta: { color: colors.primary, fontWeight: "700", fontSize: 11 },

    breakdownList: { gap: 12, paddingTop: spacing.xs },
    breakdownKey: {
        flex: 1.5,
        color: "#475569",
        fontSize: 12,
        fontWeight: "500",
    },
    breakdownVal: {
        flex: 0.8,
        textAlign: "right",
        fontWeight: "700",
        fontSize: 12,
    },

    statsRow: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
    },
    chip: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 4,
    },
    chipLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "600" },
    chipValue: { fontWeight: "700", fontSize: 16, color: "#0f172a" },

    // Tabs
    tabRow: {
        flexDirection: "row",
        marginHorizontal: spacing.gutter,
        marginTop: spacing.lg,
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 10,
    },
    tabActive: { backgroundColor: "#fff" },
    tabLabel: { color: "#64748b" },

    // Exercise summary
    exerciseSummaryRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
    },
    exerciseSummaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 0,
    },
    exerciseSummaryName: { color: "#0f172a", fontWeight: "600" },
    exerciseSummaryMeta: {
        color: "#64748b",
        marginTop: 2,
        marginBottom: spacing.xs,
    },
    exerciseThumbs: {
        marginTop: spacing.xs,
    },
    exerciseThumbsContent: {
        gap: spacing.sm,
        paddingRight: spacing.md,
    },
    exerciseThumbBox: {
        width: 72,
        alignItems: "center",
        gap: 4,
    },
    exerciseThumbVideo: {
        width: 72,
        height: 44,
        backgroundColor: "#1e293b",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#334155",
    },
    exerciseThumbLabel: {
        fontSize: 10,
        color: "#475569",
        fontWeight: "600",
    },
    noExerciseBox: {
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
    },
    noExerciseTitle: { color: "#475569", fontWeight: "700" },
    noExerciseDesc: { color: "#94a3b8", textAlign: "center", lineHeight: 20 },

    // Section
    section: { paddingHorizontal: spacing.gutter, paddingTop: spacing.lg },
    sectionTitle: {
        color: "#64748b",
        fontSize: 11,
        letterSpacing: 0.5,
        fontWeight: "700",
        marginBottom: spacing.md,
    },

    // Exercise list
    exerciseRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    exBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
    },

    // Doctor card
    doctorCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: spacing.md,
        gap: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: spacing.md,
    },
    doctorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    doctorName: { color: "#0f172a", fontWeight: "700" },
    reviewDate: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eff6ff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },

    // Review box
    reviewBox: {
        backgroundColor: "#f0f9ff",
        borderRadius: 12,
        padding: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        marginBottom: spacing.lg,
    },
    reviewIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    reviewBoxLabel: {
        color: colors.primary,
        fontWeight: "700",
        fontSize: 10,
        letterSpacing: 0.5,
    },
    reviewText: { color: "#0f172a", lineHeight: 22 },

    // Breakdown
    breakdownBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    breakdownRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    breakdownTrack: {
        flex: 1,
        height: 6,
        backgroundColor: "#f1f5f9",
        borderRadius: 3,
        overflow: "hidden",
    },
    breakdownFill: { height: "100%", borderRadius: 3 },

    // No review
    noReviewBox: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
    },
    noReviewTitle: { color: "#475569", fontWeight: "700" },
    noReviewDesc: {
        color: "#94a3b8",
        textAlign: "center",
        lineHeight: 20,
    },
});

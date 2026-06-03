/**
 * @file DoctorSessionDetailScreen.tsx
 * @description Màn hình cho phép bác sĩ xem chi tiết buổi tập của bệnh nhân, bao gồm video phát lại, thống kê hiệu suất, và ghi chú phản hồi.
 */

import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import type { DoctorStackParamList } from "../../navigation/types";
import { submitDoctorFeedback } from "../../services/firebase";

type NavProp = NativeStackNavigationProp<
  DoctorStackParamList,
  "DoctorSessionDetail"
>;
type ScreenRouteProp = RouteProp<DoctorStackParamList, "DoctorSessionDetail">;

/**
 * Màn hình chi tiết buổi tập dành cho bác sĩ.
 * Hiển thị video buổi tập, thống kê, phân tích kỹ thuật và cho phép nhập phản hồi lâm sàng.
 * @returns Giao diện React Native của màn hình chi tiết buổi tập.
 */
export const DoctorSessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const { session, patientName } = route.params;
  const { t } = useTranslation();

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [feedback, setFeedback] = useState(session.doctorFeedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "analysis">("video");

  const isPlaying = status && (status as any).isPlaying;

  /**
   * Xử lý chuyển đổi trạng thái phát/tạm dừng video.
   * @returns Một Promise hoàn thành khi trạng thái phát thay đổi.
   */
  const handleTogglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  /**
   * Lưu phản hồi của bác sĩ về buổi tập và gửi cho bệnh nhân.
   * @returns Một Promise hoàn thành khi phản hồi được lưu thành công.
   */
  const handleSaveFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert("Input Required", "Please enter feedback for the patient.");
      return;
    }

    setSubmitting(true);
    try {
      await submitDoctorFeedback(session.id, feedback.trim());
      Alert.alert("Success", "Feedback shared with patient.");
      navigation.goBack();
    } catch (error) {
      console.error("Feedback error:", error);
      Alert.alert("Error", "Failed to save feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const dateStr = (session.date as any)?.toDate
    ? (session.date as any).toDate().toLocaleDateString()
    : "Recent";
  const accuracy = session.accuracyScore || session.accuracy || 0;

  /**
   * Xác định và chuẩn hóa đường dẫn URL của video.
   * Hỗ trợ xử lý đường dẫn cục bộ trên nền tảng web.
   * @param url - Đường dẫn video gốc hoặc null.
   * @returns Đường dẫn video đã được chuẩn hóa.
   */
  const resolveVideoUrl = (url?: string | null) => {
    if (!url) return "";
    if (Platform.OS !== "web") return url;
    // Trên web: kiểm tra từ điển video đã ghi cục bộ, sau đó sử dụng trực tiếp URL Firestore
    let resolved =
      typeof window !== "undefined" && (window as any).__recordedVideos?.[url]
        ? (window as any).__recordedVideos[url]
        : url;
    // Đảm bảo các đường dẫn máy chủ cục bộ tương đối bắt đầu bằng / để tải từ gốc
    if (
      resolved &&
      !resolved.startsWith("http") &&
      !resolved.startsWith("blob:") &&
      !resolved.startsWith("/")
    ) {
      resolved = "/" + resolved;
    }
    return resolved;
  };

  const hasExerciseVideos =
    session.exercises && session.exercises.some((ex) => ex.videoUrl);
  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    name: string;
  } | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Phần đầu trang */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <AppText variant="headlineMd" style={styles.headerTitle}>
              {t("doctor.sessionDetail.title")}
            </AppText>
            <AppText variant="bodySm" style={styles.headerSubtitle}>
              {patientName} · {dateStr}
            </AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Thống kê nhanh */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>
                {t("doctor.sessionDetail.accuracy")}
              </AppText>
              <AppText
                variant="headlineMd"
                style={[styles.statValue, { color: colors.primary }]}
              >
                {accuracy}%
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>
                {t("doctor.sessionDetail.duration")}
              </AppText>
              <AppText variant="headlineMd" style={styles.statValue}>
                {session.totalDuration || session.duration || "0 min"}
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>
                {t("doctor.sessionDetail.painLvl")}
              </AppText>
              <AppText
                variant="headlineMd"
                style={[
                  styles.statValue,
                  {
                    color:
                      (session.averagePain || 0) > 5
                        ? colors.error
                        : colors.onSurface,
                  },
                ]}
              >
                {session.averagePain || session.painLevel || 0}
                /10
              </AppText>
            </View>
          </View>

          {/* Phần Video */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="videocam" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>
                {t("doctor.sessionDetail.sessionRecording")}
              </AppText>
            </View>

            {hasExerciseVideos ? (
              <View style={{ gap: spacing.md }}>
                {session
                  .exercises!.filter((ex) => ex.videoUrl)
                  .map((ex, index) => (
                    <View key={index}>
                      <AppText
                        variant="labelSm"
                        style={{
                          marginBottom: 8,
                          color: colors.onSurface,
                        }}
                      >
                        {ex.exerciseName}
                      </AppText>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setActiveVideo({
                            url: ex.videoUrl!,
                            name: ex.exerciseName,
                          })
                        }
                      >
                        <View style={styles.videoContainer}>
                          <Video
                            source={{
                              uri: resolveVideoUrl(ex.videoUrl),
                            }}
                            style={styles.video}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                          />
                          <View style={styles.videoOverlayPlay}>
                            <Ionicons
                              name="play-circle"
                              size={48}
                              color="rgba(255,255,255,0.8)"
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            ) : session.videoUrl ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setActiveVideo({
                    url: session.videoUrl!,
                    name: t("doctor.sessionDetail.sessionRecording"),
                  })
                }
              >
                <View style={styles.videoContainer}>
                  <Video
                    source={{
                      uri: resolveVideoUrl(session.videoUrl),
                    }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                  />
                  <View style={styles.videoOverlayPlay}>
                    <Ionicons
                      name="play-circle"
                      size={48}
                      color="rgba(255,255,255,0.8)"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noVideo}>
                <Ionicons
                  name="videocam-off-outline"
                  size={48}
                  color={colors.outline}
                />
                <AppText
                  variant="bodyMd"
                  style={{
                    color: colors.onSurfaceVariant,
                    marginTop: 8,
                  }}
                >
                  {t("doctor.sessionDetail.noVideo")}
                </AppText>
              </View>
            )}
          </View>

          {/* Phân tích & Bài tập */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>
                {t("doctor.sessionDetail.exerciseBreakdown")}
              </AppText>
            </View>
            <View style={styles.exerciseList}>
              {(session.exercises
                ? session.exercises.map((e) => e.exerciseName)
                : session.exerciseList || ["Squat", "Knee Extension"]
              ).map((ex, i) => (
                <View key={i} style={styles.exerciseItem}>
                  <View style={styles.exDot} />
                  <AppText variant="bodyMd" style={styles.exName}>
                    {ex}
                  </AppText>
                  <AppText variant="labelSm" style={styles.exMeta}>
                    {t("doctor.sessionDetail.completed")}
                  </AppText>
                </View>
              ))}
            </View>

            {session.formBreakdown && (
              <View style={styles.breakdown}>
                {Object.entries(session.formBreakdown).map(([key, val]) => (
                  <View key={key} style={styles.breakdownItem}>
                    <AppText variant="bodySm" style={styles.breakdownKey}>
                      {key}
                    </AppText>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${val}%`,
                            backgroundColor:
                              (val as number) > 80
                                ? colors.tertiary
                                : colors.secondary,
                          },
                        ]}
                      />
                    </View>
                    <AppText variant="labelSm" style={styles.breakdownVal}>
                      {val}%
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Nhập phản hồi */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="chatbox-ellipses"
                size={20}
                color={colors.primary}
              />
              <AppText variant="labelMd" style={styles.cardTitle}>
                {t("doctor.sessionDetail.clinicalFeedback")}
              </AppText>
            </View>
            <TextInput
              style={styles.feedbackInput}
              multiline
              placeholder={t("doctor.sessionDetail.feedbackPlaceholder")}
              placeholderTextColor={colors.outline}
              value={feedback}
              onChangeText={setFeedback}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSaveFeedback}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={colors.onPrimary} />
                  <AppText variant="labelMd" style={styles.submitBtnText}>
                    {t("doctor.sessionDetail.shareFeedback")}
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Video Toàn màn hình */}
      {activeVideo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveVideo(null)}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <AppText
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "600",
                    marginLeft: 16,
                  }}
                >
                  {activeVideo.name}
                </AppText>
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  paddingBottom: 40,
                }}
              >
                <Video
                  source={{
                    uri: resolveVideoUrl(activeVideo.url),
                  }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay
                />
              </View>
            </SafeAreaView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.onSurface },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  cardTitle: { fontWeight: "600", fontSize: 16, color: colors.onSurface },
  videoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    height: 200,
  },
  video: { width: "100%", height: "100%" },
  videoOverlayPlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  noVideo: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  exerciseList: { gap: 12 },
  exerciseItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  exDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  exName: {
    flex: 1,
    fontWeight: "500",
    color: colors.onSurface,
    fontSize: 14,
  },
  exMeta: { color: colors.primary, fontWeight: "600", fontSize: 11 },
  breakdown: {
    marginTop: spacing.lg,
    gap: 12,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHighest,
  },
  breakdownItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  breakdownKey: { flex: 1.5, color: colors.onSurfaceVariant, fontSize: 12 },
  barBg: {
    flex: 3,
    height: 6,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  breakdownVal: {
    flex: 0.8,
    textAlign: "right",
    fontWeight: "600",
    fontSize: 12,
    color: colors.onSurface,
  },
  feedbackInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
  },
  submitBtnText: { color: colors.onPrimary, fontWeight: "600", fontSize: 15 },
});

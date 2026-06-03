/**
 * @file DoctorSessionDetailScreen.tsx
 * @description Màn hình xem chi tiết buổi tập của bệnh nhân dành cho bác sĩ.
 * Cho phép bác sĩ phát lại video buổi tập, xem thống kê hiệu suất (độ chính xác,
 * thời lượng, mức đau), phân tích bài tập và gửi nhận xét lâm sàng cho bệnh nhân.
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

type NavProp = NativeStackNavigationProp<DoctorStackParamList, 'DoctorSessionDetail'>;
type ScreenRouteProp = RouteProp<DoctorStackParamList, 'DoctorSessionDetail'>;

/**
 * @component DoctorSessionDetailScreen
 * @description Component màn hình xem chi tiết buổi tập của bệnh nhân.
 * Tự động phân giải URL video (có thể là đường dẫn tương đối từ Firebase Storage)
 * và quản lý trạng thái phát video, nhận xét và nộp form.
 * @return {React.ReactElement} Giao diện chi tiết buổi tập với video, thống kê và form nhận xét.
 */
export const DoctorSessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const { session, patientName } = route.params;
  const { t } = useTranslation();

    const [resolvedVideoUri, setResolvedVideoUri] = useState<string>("");
    const [loadingVideo, setLoadingVideo] = useState(false);

    /**
   * @function resolveVideo
   * @description Phân giải URL video của buổi tập.
   * Nếu URL bắt đầu bằng "http" hoặc "blob:", sử dụng trực tiếp.
   * Nếu là đường dẫn tương đối, tải xuống URL từ Firebase Storage.
   * @return {Promise<void>}
   */
    React.useEffect(() => {
        async function resolveVideo() {
            const url = session.videoUrl;
            if (!url) return;

            setLoadingVideo(true);
            try {
                if (url.startsWith("http") || url.startsWith("blob:")) {
                    setResolvedVideoUri(url);
                } else {
                    // It's a relative path! e.g., "videos/2JKbKHm37XkFKlgZidTR_20260526.mp4"
                    console.log("[DoctorSessionDetail] Relative path detected. Fetching from Firebase Storage:", url);
                    const { ref, getDownloadURL } = await import("firebase/storage");
                    const { storage } = await import("../../services/firebase/config");
                    const downloadUrl = await getDownloadURL(ref(storage, url));
                    console.log("[DoctorSessionDetail] Successfully resolved relative path to download URL:", downloadUrl);
                    setResolvedVideoUri(downloadUrl);
                }
            } catch (err) {
                console.warn("[DoctorSessionDetail] Failed to resolve video URL:", err);
                // Fallback to relative path starting with /
                let fallback = url;
                if (!fallback.startsWith("/")) {
                    fallback = "/" + fallback;
                }
                setResolvedVideoUri(fallback);
            } finally {
                setLoadingVideo(false);
            }
        }
        resolveVideo();
    }, [session.videoUrl]);

    const isPlaying = status && (status as any).isPlaying;

    /**
   * @function handleTogglePlay
   * @description Bật/tắt phát video. Kiểm tra trạng thái phát hiện tại
   * rồi gọi pause hoặc play tương ứng trên videoRef.
   * @return {Promise<void>}
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
   * @function handleSaveFeedback
   * @description Lưu và gửi nhận xét lâm sàng của bác sĩ cho bệnh nhân.
   * Kiểm tra dữ liệu đầu vào trước khi gửi. Hiển thị thông báo kết quả
   * và quay lại màn hình trước nếu thành công.
   * @return {Promise<void>}
   */
    const handleSaveFeedback = async () => {
        if (!feedback.trim()) {
            Alert.alert("Input Required", "Please enter feedback for the patient.");
            return;
        }

  const resolveVideoUrl = (url?: string | null) => {
    if (!url) return "";
    if (Platform.OS !== 'web') return url;
    // On web: check global recorded videos dictionary, then use Firestore URL directly
    let resolved = (typeof window !== 'undefined' && (window as any).__recordedVideos?.[url]) 
      ? (window as any).__recordedVideos[url] 
      : url;
    // Ensure relative local server paths start with / to load from root
    if (resolved && !resolved.startsWith('http') && !resolved.startsWith('blob:') && !resolved.startsWith('/')) {
      resolved = '/' + resolved;
    }
    return resolved;
  };

  const hasExerciseVideos = session.exercises && session.exercises.some(ex => ex.videoUrl);
  const [activeVideo, setActiveVideo] = useState<{ url: string, name: string } | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <AppText variant="headlineMd" style={styles.headerTitle}>{t('doctor.sessionDetail.title')}</AppText>
            <AppText variant="bodySm" style={styles.headerSubtitle}>{patientName} · {dateStr}</AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>{t('doctor.sessionDetail.accuracy')}</AppText>
              <AppText variant="headlineMd" style={[styles.statValue, { color: colors.primary }]}>{accuracy}%</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>{t('doctor.sessionDetail.duration')}</AppText>
              <AppText variant="headlineMd" style={styles.statValue}>{session.totalDuration || session.duration || '0 min'}</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>{t('doctor.sessionDetail.painLvl')}</AppText>
              <AppText variant="headlineMd" style={[styles.statValue, { color: (session.averagePain || 0) > 5 ? colors.error : colors.onSurface }]}>
                {session.averagePain || session.painLevel || 0}/10
              </AppText>
            </View>
          </View>

          {/* Video Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="videocam" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>{t('doctor.sessionDetail.sessionRecording')}</AppText>
            </View>
            
            {hasExerciseVideos ? (
              <View style={{ gap: spacing.md }}>
                {session.exercises!.filter(ex => ex.videoUrl).map((ex, index) => (
                  <View key={index}>
                    <AppText variant="labelSm" style={{ marginBottom: 8, color: colors.onSurface }}>
                      {ex.exerciseName}
                    </AppText>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveVideo({ url: ex.videoUrl!, name: ex.exerciseName })}>
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: resolveVideoUrl(ex.videoUrl) }}
                          style={styles.video}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                        />
                        <View style={styles.videoOverlayPlay}>
                          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : session.videoUrl ? (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveVideo({ url: session.videoUrl!, name: t('doctor.sessionDetail.sessionRecording') })}>
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: resolveVideoUrl(session.videoUrl) }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                  />
                  <View style={styles.videoOverlayPlay}>
                    <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noVideo}>
                <Ionicons name="videocam-off-outline" size={48} color={colors.outline} />
                <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>{t('doctor.sessionDetail.noVideo')}</AppText>
              </View>
            )}
          </View>

          {/* Analysis & Exercises */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>{t('doctor.sessionDetail.exerciseBreakdown')}</AppText>
            </View>
            <View style={styles.exerciseList}>
              {(session.exercises ? session.exercises.map(e => e.exerciseName) : (session.exerciseList || ["Squat", "Knee Extension"])).map((ex, i) => (
                <View key={i} style={styles.exerciseItem}>
                  <View style={styles.exDot} />
                  <AppText variant="bodyMd" style={styles.exName}>{ex}</AppText>
                  <AppText variant="labelSm" style={styles.exMeta}>{t('doctor.sessionDetail.completed')}</AppText>
                </View>
              ))}
            </View>

            {session.formBreakdown && (
              <View style={styles.breakdown}>
                {Object.entries(session.formBreakdown).map(([key, val]) => (
                  <View key={key} style={styles.breakdownItem}>
                    <AppText variant="bodySm" style={styles.breakdownKey}>{key}</AppText>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${val}%`, backgroundColor: (val as number) > 80 ? colors.tertiary : colors.secondary }]} />
                    </View>
                    <AppText variant="labelSm" style={styles.breakdownVal}>{val}%</AppText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Feedback Input */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbox-ellipses" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>{t('doctor.sessionDetail.clinicalFeedback')}</AppText>
            </View>
            <TextInput
              style={styles.feedbackInput}
              multiline
              placeholder={t('doctor.sessionDetail.feedbackPlaceholder')}
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
                  <AppText variant="labelMd" style={styles.submitBtnText}>{t('doctor.sessionDetail.shareFeedback')}</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Video Modal */}
      {activeVideo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <TouchableOpacity onPress={() => setActiveVideo(null)} style={{ padding: 8 }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <AppText style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 16 }}>
                  {activeVideo.name}
                </AppText>
              </View>
              <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 40 }}>
                <Video
                  source={{ uri: resolveVideoUrl(activeVideo.url) }}
                  style={{ width: '100%', height: '100%' }}
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
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.gutter, 
    paddingVertical: spacing.md, 
    backgroundColor: colors.surfaceContainerLowest, 
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  headerSubtitle: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { 
    flex: 1, 
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, 
    padding: spacing.md, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerHighest 
  },
  statLabel: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '700' },
  card: { 
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerHighest 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle: { fontWeight: '600', fontSize: 16, color: colors.onSurface },
  videoContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', height: 200 },
  video: { width: '100%', height: '100%' },
  videoOverlayPlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  noVideo: { 
    height: 160, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.surfaceContainerLow, 
    borderRadius: 12, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: colors.outlineVariant 
  },
  exerciseList: { gap: 12 },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  exName: { flex: 1, fontWeight: '500', color: colors.onSurface, fontSize: 14 },
  exMeta: { color: colors.primary, fontWeight: '600', fontSize: 11 },
  breakdown: { 
    marginTop: spacing.lg, 
    gap: 12, 
    paddingTop: spacing.md, 
    borderTopWidth: 1, 
    borderTopColor: colors.surfaceContainerHighest 
  },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownKey: { flex: 1.5, color: colors.onSurfaceVariant, fontSize: 12 },
  barBg: { flex: 3, height: 6, backgroundColor: colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  breakdownVal: { flex: 0.8, textAlign: 'right', fontWeight: '600', fontSize: 12, color: colors.onSurface },
  feedbackInput: { 
    backgroundColor: colors.surfaceContainerLow, 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerHighest, 
    borderRadius: 12, 
    padding: 16, 
    minHeight: 120, 
    textAlignVertical: 'top', 
    fontSize: 14, 
    color: colors.onSurface, 
    marginBottom: spacing.md 
  },
  submitBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: colors.primary, 
    paddingVertical: 14, 
    borderRadius: 16 
  },
  submitBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
});

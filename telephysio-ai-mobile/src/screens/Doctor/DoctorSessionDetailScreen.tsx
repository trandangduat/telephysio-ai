/**
 * DoctorSessionDetailScreen — Allows doctors to review a patient's session.
 * Features: Video playback, performance stats, and feedback submission.
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

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import type { DoctorStackParamList } from "../../navigation/types";
import { submitDoctorFeedback } from "../../services/firebase";

type NavProp = NativeStackNavigationProp<DoctorStackParamList, 'DoctorSessionDetail'>;
type ScreenRouteProp = RouteProp<DoctorStackParamList, 'DoctorSessionDetail'>;

export const DoctorSessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const { session, patientName } = route.params;

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [feedback, setFeedback] = useState(session.doctorFeedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "analysis">("video");

  const isPlaying = status && (status as any).isPlaying;

  const handleTogglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

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

  const dateStr = (session.date as any)?.toDate ? (session.date as any).toDate().toLocaleDateString() : "Recent";
  const accuracy = session.accuracyScore || session.accuracy || 0;

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
            <AppText variant="headlineMd" style={styles.headerTitle}>Review Session</AppText>
            <AppText variant="bodySm" style={styles.headerSubtitle}>{patientName} · {dateStr}</AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>ACCURACY</AppText>
              <AppText variant="headlineMd" style={[styles.statValue, { color: colors.primary }]}>{accuracy}%</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>DURATION</AppText>
              <AppText variant="headlineMd" style={styles.statValue}>{session.totalDuration || session.duration || '0 min'}</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="labelSm" style={styles.statLabel}>PAIN LVL</AppText>
              <AppText variant="headlineMd" style={[styles.statValue, { color: (session.averagePain || 0) > 5 ? colors.error : colors.onSurface }]}>
                {session.averagePain || session.painLevel || 0}/10
              </AppText>
            </View>
          </View>

          {/* Video Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="videocam" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>Session Recording</AppText>
            </View>
            
            {session.videoUrl ? (
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ 
                    uri: (() => {
                      const url = session.videoUrl;
                      if (Platform.OS !== 'web') return url || "";
                      // On web: check global recorded videos dictionary, then use Firestore URL directly
                      let resolved = (typeof window !== 'undefined' && url && (window as any).__recordedVideos?.[url]) 
                        ? (window as any).__recordedVideos[url] 
                        : url;
                      
                      // Ensure relative local server paths start with / to load from root
                      if (resolved && !resolved.startsWith('http') && !resolved.startsWith('blob:') && !resolved.startsWith('/')) {
                        resolved = '/' + resolved;
                      }
                      return resolved || "";
                    })()
                  }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  onPlaybackStatusUpdate={setStatus}
                  useNativeControls
                />
              </View>
            ) : (
              <View style={styles.noVideo}>
                <Ionicons name="videocam-off-outline" size={48} color={colors.outline} />
                <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>No video recorded for this session</AppText>
              </View>
            )}
          </View>

          {/* Analysis & Exercises */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <AppText variant="labelMd" style={styles.cardTitle}>Exercise Breakdown</AppText>
            </View>
            <View style={styles.exerciseList}>
              {(session.exerciseList || ["Squat", "Knee Extension"]).map((ex, i) => (
                <View key={i} style={styles.exerciseItem}>
                  <View style={styles.exDot} />
                  <AppText variant="bodyMd" style={styles.exName}>{ex}</AppText>
                  <AppText variant="labelSm" style={styles.exMeta}>Completed</AppText>
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
              <AppText variant="labelMd" style={styles.cardTitle}>Clinical Feedback</AppText>
            </View>
            <TextInput
              style={styles.feedbackInput}
              multiline
              placeholder="Write your advice, corrections, or encouragement here..."
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
                  <AppText variant="labelMd" style={styles.submitBtnText}>Share Feedback</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

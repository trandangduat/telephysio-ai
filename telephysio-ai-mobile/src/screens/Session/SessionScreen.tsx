
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppText } from "../../components/ui";
import { colors, spacing, typography, radius } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPatientSessions,
  getActiveTreatmentPlan,
} from "../../services/firebase";
import type { Session, TreatmentPlan } from "../../services/firebase/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatDate(raw: any): string {
  try {
    const d: Date =
      raw && typeof raw.toDate === "function" ? raw.toDate() : new Date(raw);
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

function accuracyColor(acc: number): string {
  if (acc >= 80) return "#059669";
  if (acc >= 60) return "#d97706";
  return "#dc2626";
}

// ─── Session Detail Modal ────────────────────────────────────────────────────

interface SessionDetailModalProps {
  session: Session | null;
  visible: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  visible,
  onClose,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "review">("video");

  if (!session) return null;

  const accuracy = Math.round(
    (session as any).accuracyScore ?? (session as any).accuracy ?? 0
  );
  const exercises =
    (session as any).exercisesCompleted ??
    (session as any).completedExercises ??
    0;
  const duration =
    (session as any).duration ?? (session as any).totalDuration ?? "—";
  const videoUrl: string | undefined = (session as any).videoUrl;

  const isPlaying =
    status && (status as any).isPlaying ? (status as any).isPlaying : false;

  const togglePlay = async () => {
    if (!videoRef.current || !status || !(status as any).isLoaded) {
      console.warn("Video not loaded yet or invalid source.");
      return;
    }
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const doctorReview: string | undefined = (session as any).doctorFeedback;
  const doctorName: string =
    (session as any).doctorName ?? "Assigned Doctor";
  const reviewDate: string | undefined = (session as any).reviewedAt
    ? formatDate((session as any).reviewedAt)
    : undefined;

  const exercises_list: string[] = (session as any).exerciseList ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={detail.overlay}>
        <SafeAreaView style={detail.sheet} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={detail.header}>
            <TouchableOpacity onPress={onClose} style={detail.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </TouchableOpacity>
            <AppText variant="labelMd" style={detail.headerTitle}>
              Session Details
            </AppText>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Session meta */}
            <View style={detail.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <AppText variant="bodySm" style={detail.metaText}>
                {formatDate((session as any).date)}
              </AppText>
            </View>

            {/* Stats row */}
            <View style={detail.statsRow}>
              <StatChip
                icon="barbell-outline"
                label="Exercises"
                value={`${exercises}`}
              />
              <StatChip
                icon="time-outline"
                label="Duration"
                value={`${duration}`}
              />
              <StatChip
                icon="analytics-outline"
                label="Accuracy"
                value={`${accuracy}%`}
                valueColor={accuracyColor(accuracy)}
              />
            </View>

            {/* Tabs */}
            <View style={detail.tabRow}>
              <TouchableOpacity
                style={[detail.tab, activeTab === "video" && detail.tabActive]}
                onPress={() => setActiveTab("video")}
              >
                <Ionicons
                  name="play-circle-outline"
                  size={16}
                  color={activeTab === "video" ? colors.primary : "#64748b"}
                  style={{ marginRight: 6 }}
                />
                <AppText
                  variant="labelMd"
                  style={[
                    detail.tabLabel,
                    activeTab === "video" && { color: colors.primary },
                  ]}
                >
                  Session Video
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[detail.tab, activeTab === "review" && detail.tabActive]}
                onPress={() => setActiveTab("review")}
              >
                <Ionicons
                  name="medical-outline"
                  size={16}
                  color={activeTab === "review" ? colors.primary : "#64748b"}
                  style={{ marginRight: 6 }}
                />
                <AppText
                  variant="labelMd"
                  style={[
                    detail.tabLabel,
                    activeTab === "review" && { color: colors.primary },
                  ]}
                >
                  Doctor's Review
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
                      source={{ uri: videoUrl }}
                      style={detail.video}
                      resizeMode={ResizeMode.CONTAIN}
                      onPlaybackStatusUpdate={(s) => setStatus(s)}
                      shouldPlay={false}
                      useNativeControls={false}
                      onError={(error) => console.error("Video Error:", error)}
                      onLoadStart={() => console.log("Video Loading Started:", videoUrl)}
                    />
                    {/* Custom play overlay */}
                    <TouchableOpacity
                      style={detail.playOverlay}
                      onPress={togglePlay}
                      activeOpacity={0.8}
                    >
                      {!isPlaying && (
                        <View style={detail.playCircle}>
                          <Ionicons name="play" size={28} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {/* Progress bar */}
                    {status && (status as any).durationMillis ? (
                      <View style={detail.progressTrack}>
                        <View
                          style={[
                            detail.progressFill,
                            {
                              width: `${
                                (((status as any).positionMillis ?? 0) /
                                  (status as any).durationMillis) *
                                100
                              }%`,
                            },
                          ]}
                        />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={detail.noVideoBox}>
                    <Ionicons
                      name="videocam-off-outline"
                      size={36}
                      color="#94a3b8"
                    />
                    <AppText variant="bodySm" style={detail.noVideoText}>
                      Video is not available for this session.
                    </AppText>
                  </View>
                )}

                {/* Exercise list */}
                {exercises_list.length > 0 && (
                  <View style={detail.section}>
                    <AppText variant="labelMd" style={detail.sectionTitle}>
                      EXERCISES PERFORMED
                    </AppText>
                    {exercises_list.map((ex, i) => (
                      <View key={i} style={detail.exerciseRow}>
                        <View style={detail.exBullet}>
                          <AppText
                            style={{ color: colors.primary, fontSize: 11 }}
                          >
                            {i + 1}
                          </AppText>
                        </View>
                        <AppText variant="bodySm" style={detail.exName}>
                          {ex}
                        </AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── REVIEW TAB ── */}
            {activeTab === "review" && (
              <View style={detail.section}>
                {doctorReview ? (
                  <>
                    {/* Doctor card */}
                    <View style={detail.doctorCard}>
                      <View style={detail.doctorAvatar}>
                        <Ionicons name="person" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="labelMd" style={detail.doctorName}>
                          {doctorName}
                        </AppText>
                        {reviewDate && (
                          <AppText variant="labelSm" style={detail.reviewDate}>
                            Reviewed on {reviewDate}
                          </AppText>
                        )}
                      </View>
                      <View style={detail.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.primary}
                        />
                        <AppText
                          variant="labelSm"
                          style={{ color: colors.primary, marginLeft: 4 }}
                        >
                          Verified
                        </AppText>
                      </View>
                    </View>

                    {/* Review content */}
                    <View style={detail.reviewBox}>
                      <View style={detail.reviewIconRow}>
                        <Ionicons
                          name="medical"
                          size={14}
                          color={colors.primary}
                        />
                        <AppText
                          variant="labelSm"
                          style={detail.reviewBoxLabel}
                        >
                          DOCTOR'S FEEDBACK
                        </AppText>
                      </View>
                      <AppText variant="bodyMd" style={detail.reviewText}>
                        {doctorReview}
                      </AppText>
                    </View>

                    {/* Accuracy breakdown if available */}
                    {(session as any).formBreakdown && (
                      <View style={detail.breakdownBox}>
                        <AppText variant="labelMd" style={detail.sectionTitle}>
                          FORM ANALYSIS
                        </AppText>
                        {Object.entries((session as any).formBreakdown).map(
                          ([key, val]: [string, any]) => (
                            <View key={key} style={detail.breakdownRow}>
                              <AppText
                                variant="bodySm"
                                style={{ color: "#475569", flex: 1 }}
                              >
                                {key}
                              </AppText>
                              <View style={detail.breakdownTrack}>
                                <View
                                  style={[
                                    detail.breakdownFill,
                                    {
                                      width: `${val}%`,
                                      backgroundColor: accuracyColor(val),
                                    },
                                  ]}
                                />
                              </View>
                              <AppText
                                variant="labelSm"
                                style={{
                                  color: accuracyColor(val),
                                  width: 36,
                                  textAlign: "right",
                                }}
                              >
                                {val}%
                              </AppText>
                            </View>
                          ),
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={detail.noReviewBox}>
                    <Ionicons
                      name="hourglass-outline"
                      size={36}
                      color="#94a3b8"
                    />
                    <AppText variant="labelMd" style={detail.noReviewTitle}>
                      No review yet
                    </AppText>
                    <AppText variant="bodySm" style={detail.noReviewDesc}>
                      Your doctor hasn't left a review for this session yet.
                      Please check back later.
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const StatChip = ({
  icon,
  label,
  value,
  valueColor = "#0f172a",
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={detail.chip}>
    <Ionicons name={icon as any} size={16} color={colors.primary} />
    <AppText variant="labelSm" style={detail.chipLabel}>
      {label}
    </AppText>
    <AppText variant="headlineMd" style={[detail.chipValue, { color: valueColor }]}>
      {value}
    </AppText>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const SessionScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(
    null,
  );
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
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
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>
            TelePhysioAI
          </AppText>
        </View>
        <View style={styles.topBarIcons}>
          {/* <TouchableOpacity
            onPress={() => navigation.navigate("DoctorChat")}
            style={styles.iconBtn}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#475569" />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notifDot} />
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#475569"
            />
          </TouchableOpacity>
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
          Session History
        </AppText>
        <AppText variant="bodyMd" style={styles.pageSubtitle}>
          Review videos and doctor's feedback for each of your sessions.
        </AppText>

        {/* ── Featured latest session ── */}
        {latestSession ? (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.85}
            onPress={() => openDetail(latestSession)}
          >
            {/* Dark banner with play icon */}
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
                <AppText variant="labelSm" style={{ color: "#fff" }}>
                  Latest Session
                </AppText>
              </View>
            </View>

            <View style={styles.featuredBody}>
              <AppText variant="labelSm" style={styles.featuredEyebrow}>
                REVIEW SESSION
              </AppText>
              <AppText variant="headlineMd" style={styles.featuredTitle}>
                {formatDate((latestSession as any).date)}
              </AppText>

              <View style={styles.featuredMeta}>
                <MetaPill
                  icon="barbell-outline"
                  text={`${(latestSession as any).exercisesCompleted ?? (latestSession as any).completedExercises ?? 0} exercises`}
                />
                <MetaPill
                  icon="time-outline"
                  text={`${(latestSession as any).duration ?? (latestSession as any).totalDuration ?? "—"}`}
                />
                <MetaPill
                  icon="analytics-outline"
                  text={`${Math.round((latestSession as any).accuracyScore ?? (latestSession as any).accuracy ?? 0)}% accuracy`}
                />
              </View>

              {(latestSession as any).doctorFeedback && (
                <View style={styles.doctorSnippet}>
                  <Ionicons name="medical" size={12} color={colors.primary} />
                  <AppText variant="bodySm" style={styles.doctorSnippetText}>
                    Doctor feedback available
                  </AppText>
                </View>
              )}

              <View style={styles.viewDetailRow}>
                <AppText variant="labelMd" style={{ color: colors.primary }}>
                  View Details
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
              No sessions recorded yet.
            </AppText>
          </View>
        )}

        {/* ── Weekly goal card ── */}
        {treatmentPlan && (
          <View style={styles.goalCard}>
            <AppText variant="labelMd" style={{ color: "#e0e7ff" }}>
              Goal · {treatmentPlan.condition}
            </AppText>
            <AppText
              variant="bodySm"
              style={{ color: "#e0e7ff", marginBottom: spacing.md }}
            >
              Phase {treatmentPlan.currentPhase} · Week{" "}
              {treatmentPlan.currentWeek}/{treatmentPlan.totalWeeks}
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
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="trending-up" size={16} color="#34d399" />
              <AppText
                variant="labelSm"
                style={{ color: "#e0e7ff", marginLeft: 8 }}
              >
                {treatmentPlan.status === "on-track"
                  ? "You're on track!"
                  : treatmentPlan.status === "ahead"
                    ? "You're ahead of schedule!"
                    : "Try to be more consistent!"}
              </AppText>
            </View>
          </View>
        )}

        {/* ── Older sessions list ── */}
        {olderSessions.length > 0 && (
          <>
            <AppText variant="labelMd" style={styles.listSectionTitle}>
              PREVIOUS SESSIONS
            </AppText>
            {olderSessions.map((session) => {
              const acc = Math.round(
                (session as any).accuracyScore ?? (session as any).accuracy ?? 0
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
                      <AppText variant="labelMd" style={styles.listDate}>
                        {formatDate((session as any).date)}
                      </AppText>
                      <AppText variant="bodySm" style={styles.listMeta}>
                        {exCount} exercises · {dur}
                      </AppText>
                      <View style={styles.badgeRow}>
                        {hasVideo && (
                          <View style={styles.badge}>
                            <Ionicons
                              name="videocam-outline"
                              size={10}
                              color={colors.primary}
                            />
                            <AppText style={styles.badgeText}>Video</AppText>
                          </View>
                        )}
                        {hasReview && (
                          <View style={[styles.badge, styles.badgeGreen]}>
                            <Ionicons
                              name="medical-outline"
                              size={10}
                              color="#059669"
                            />
                            <AppText
                              style={[styles.badgeText, { color: "#059669" }]}
                            >
                              Reviewed
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
                    <AppText variant="labelSm" style={styles.listAccLabel}>
                      accuracy
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

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary} />
          </View>
          <AppText variant="labelMd" style={styles.infoTitle}>
            Videos recorded automatically
          </AppText>
          <AppText variant="bodySm" style={styles.infoDesc}>
            Each session is recorded and analyzed by AI for posture. Your doctor
            will review and leave feedback to adjust your recovery plan.
          </AppText>
        </View>
      </ScrollView>

      {/* Session Detail Modal */}
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

// ─── Small helper component ──────────────────────────────────────────────────

const MetaPill = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.metaPill}>
    <Ionicons name={icon as any} size={12} color="#64748b" />
    <AppText variant="labelSm" style={styles.metaPillText}>
      {text}
    </AppText>
  </View>
);

// ─── StyleSheets ─────────────────────────────────────────────────────────────

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
  listLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
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

  // Stats
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

  // Video
  videoWrapper: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    aspectRatio: 16 / 9,
  },
  video: { width: "100%", height: "100%" },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },

  noVideoBox: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.md,
    height: 160,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  noVideoText: { color: "#94a3b8", textAlign: "center" },

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
  exName: { color: "#0f172a", flex: 1 },

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
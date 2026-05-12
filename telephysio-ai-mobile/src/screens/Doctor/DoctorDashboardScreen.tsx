/**
 * DoctorDashboardScreen — Patient list with today's assignment status.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { DoctorStackParamList, DoctorTabParamList } from "../../navigation/types";
import {
  getPatients,
  getDoctorAssignments,
  getPatientSessions,
  submitDoctorFeedback,
} from "../../services/firebase";
import type { UserProfile, Assignment, Session } from "../../services/firebase/types";

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<DoctorTabParamList, "Dashboard">,
  NativeStackNavigationProp<DoctorStackParamList>
>;

interface PatientCard {
  profile: UserProfile;
  assignments: Assignment[];
  todayCompleted: number;
  todayTotal: number;
}

interface ExerciseStatus {
  assignment: Assignment;
  sessions: Session[];
}

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { userName, uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [patients, setPatients] = useState<PatientCard[]>([]);

  // Detail modal
  const [selectedPatient, setSelectedPatient] = useState<PatientCard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exerciseStatuses, setExerciseStatuses] = useState<ExerciseStatus[]>([]);
  const [feedbackModal, setFeedbackModal] = useState<{ session: Session; assignment: Assignment } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const [profiles, allAssignments] = await Promise.all([
        getPatients(uid),
        getDoctorAssignments(uid),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const cards: PatientCard[] = profiles.map((profile) => {
        const patientAssignments = allAssignments.filter(
          (a) => a.patientId === profile.uid
        );
        const todayAssignments = patientAssignments.filter((a) => {
          const at = (a.assignedAt as any)?.toDate?.();
          return at && at >= today;
        });
        const completed = todayAssignments.filter((a) => a.status === "completed").length;
        return {
          profile,
          assignments: patientAssignments,
          todayCompleted: completed,
          todayTotal: todayAssignments.length,
        };
      });
      setPatients(cards);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openPatientDetail = async (card: PatientCard) => {
    setSelectedPatient(card);
    setDetailLoading(true);
    try {
      const statuses: ExerciseStatus[] = await Promise.all(
        card.assignments.map(async (a) => {
          const sessions = await getPatientSessions(card.profile.uid, 5);
          const relevant = sessions.filter((s) => s.assignmentId === a.id);
          return { assignment: a, sessions: relevant };
        })
      );
      setExerciseStatuses(statuses);
    } catch (e) {
      console.error("Detail load error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedPatient(null);
    setExerciseStatuses([]);
  };

  const openFeedback = (session: Session, assignment: Assignment) => {
    setFeedbackText(session.doctorFeedback || "");
    setFeedbackModal({ session, assignment });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackModal || !feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await submitDoctorFeedback(feedbackModal.session.id, feedbackText.trim());
      Alert.alert("Success", "Feedback sent to patient.");
      setFeedbackModal(null);
    } catch {
      Alert.alert("Error", "Failed to send feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filtered = patients.filter((p) =>
    searchText.trim() === "" ||
    p.profile.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.profile.displayName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning,";
    if (h < 18) return "Good afternoon,";
    return "Good evening,";
  };

  const getStatusColor = (card: PatientCard) => {
    if (card.todayTotal === 0) return "#94a3b8";
    if (card.todayCompleted === card.todayTotal) return "#10b981";
    if (card.todayCompleted > 0) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusLabel = (card: PatientCard) => {
    if (card.todayTotal === 0) return "No tasks today";
    if (card.todayCompleted === card.todayTotal) return "All done ✓";
    if (card.todayCompleted > 0) return `${card.todayCompleted}/${card.todayTotal} done`;
    return "Not started";
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
          <View style={styles.roleBadge}>
            <AppText variant="labelSm" style={{ color: "#fff", fontWeight: "700", fontSize: 9 }}>DOCTOR</AppText>
          </View>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notifDot} />
            <Ionicons name="notifications-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate("DoctorProfile")}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.header}>
          <AppText variant="bodyMd" style={styles.greeting}>{getGreeting()}</AppText>
          <AppText variant="headlineLg" style={styles.doctorName}>{userName}</AppText>
          <AppText variant="bodySm" style={styles.subtitle}>
            {patients.length} patient{patients.length !== 1 ? "s" : ""} assigned
          </AppText>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email or name..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <AppText variant="headlineMd" style={styles.sectionTitle}>My Patients</AppText>
          <View style={styles.countBadge}>
            <AppText variant="labelSm" style={{ color: colors.primary }}>{filtered.length}</AppText>
          </View>
        </View>

        {/* Patient Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <AppText variant="bodyMd" style={{ color: "#94a3b8", marginTop: 12 }}>
              {searchText ? "No patients match your search." : "No patients assigned yet."}
            </AppText>
          </View>
        ) : (
          filtered.map((card) => (
            <TouchableOpacity
              key={card.profile.uid}
              style={styles.patientCard}
              onPress={() => openPatientDetail(card)}
              activeOpacity={0.85}
            >
              <View style={styles.cardLeft}>
                <View style={styles.avatarCircle}>
                  <AppText style={styles.avatarInitial}>
                    {(card.profile.displayName || "?")[0].toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="labelMd" style={styles.patientName}>{card.profile.displayName}</AppText>
                  <AppText variant="bodySm" style={styles.patientEmail}>{card.profile.email}</AppText>
                  <AppText variant="bodySm" style={styles.assignmentCount}>
                    {card.assignments.length} assignment{card.assignments.length !== 1 ? "s" : ""}
                  </AppText>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(card) + "22" }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(card) }]} />
                  <AppText variant="labelSm" style={{ color: getStatusColor(card), fontSize: 10, fontWeight: "700" }}>
                    {getStatusLabel(card)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Patient Detail Modal */}
      <Modal visible={!!selectedPatient} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeDetail}>
        <SafeAreaView style={styles.modalSafe} edges={["top"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBack} onPress={closeDetail}>
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <AppText variant="headlineMd" style={styles.modalTitle}>{selectedPatient?.profile.displayName}</AppText>
              <AppText variant="bodySm" style={{ color: "#64748b" }}>{selectedPatient?.profile.email}</AppText>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("PatientDetail", {
              patientId: selectedPatient!.profile.uid,
              patientName: selectedPatient!.profile.displayName,
            })}>
              <AppText variant="labelSm" style={{ color: colors.primary }}>Full Profile</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {detailLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : exerciseStatuses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
                <AppText variant="bodyMd" style={{ color: "#94a3b8", marginTop: 12 }}>No assignments yet.</AppText>
              </View>
            ) : (
              exerciseStatuses.map(({ assignment, sessions }) => {
                const isCompleted = assignment.status === "completed";
                const latestSession = sessions[0] || null;
                const assignedDate = (assignment.assignedAt as any)?.toDate?.()?.toLocaleDateString() || "—";
                return (
                  <View key={assignment.id} style={styles.assignCard}>
                    {/* Assignment Header */}
                    <View style={styles.assignHeader}>
                      <View style={[styles.assignStatusBadge, { backgroundColor: isCompleted ? "#dcfce7" : "#fef3c7" }]}>
                        <Ionicons
                          name={isCompleted ? "checkmark-circle" : "time-outline"}
                          size={13}
                          color={isCompleted ? "#16a34a" : "#d97706"}
                        />
                        <AppText variant="labelSm" style={{ color: isCompleted ? "#16a34a" : "#d97706", fontSize: 10, fontWeight: "700" }}>
                          {isCompleted ? "Completed" : "Pending"}
                        </AppText>
                      </View>
                      <AppText variant="bodySm" style={{ color: "#94a3b8", fontSize: 11 }}>Assigned: {assignedDate}</AppText>
                    </View>

                    <AppText variant="labelMd" style={styles.assignName}>{assignment.templateName}</AppText>
                    <AppText variant="bodySm" style={{ color: "#64748b", marginBottom: 12 }}>
                      {assignment.exercises.length} exercise{assignment.exercises.length !== 1 ? "s" : ""} · {assignment.totalDuration}
                    </AppText>

                    {/* Exercise List */}
                    {assignment.exercises.map((ex, i) => (
                      <View key={ex.id || i} style={styles.exerciseRow}>
                        <View style={[styles.exIconBox, { backgroundColor: ex.color + "22" || "#e0f2fe" }]}>
                          <Ionicons name={(ex.icon as any) || "barbell-outline"} size={16} color={ex.color || colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="labelMd" style={styles.exName}>{ex.name}</AppText>
                          <AppText variant="bodySm" style={{ color: "#94a3b8", fontSize: 11 }}>
                            {ex.sets} sets × {ex.reps} reps · {ex.duration}
                          </AppText>
                        </View>
                        <View style={[styles.exStatus, { backgroundColor: isCompleted ? "#dcfce7" : "#f1f5f9" }]}>
                          <Ionicons
                            name={isCompleted ? "checkmark" : "ellipse-outline"}
                            size={14}
                            color={isCompleted ? "#16a34a" : "#94a3b8"}
                          />
                        </View>
                      </View>
                    ))}

                    {/* Action Buttons if completed */}
                    {isCompleted && (
                      <View style={styles.actionButtons}>
                        {latestSession?.videoUrl && (
                          <TouchableOpacity
                            style={styles.btnVideo}
                            onPress={() => navigation.navigate("DoctorSessionDetail", {
                              session: latestSession,
                              patientName: selectedPatient?.profile.displayName || "",
                            })}
                          >
                            <Ionicons name="videocam-outline" size={15} color={colors.primary} />
                            <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: "700" }}>Check Video</AppText>
                          </TouchableOpacity>
                        )}
                        {latestSession && (
                          <TouchableOpacity
                            style={styles.btnFeedback}
                            onPress={() => openFeedback(latestSession, assignment)}
                          >
                            <Ionicons name="chatbox-ellipses-outline" size={15} color="#fff" />
                            <AppText variant="labelSm" style={{ color: "#fff", fontWeight: "700" }}>
                              {latestSession.doctorFeedback ? "Edit Feedback" : "Send Feedback"}
                            </AppText>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Existing feedback preview */}
                    {latestSession?.doctorFeedback && (
                      <View style={styles.feedbackPreview}>
                        <Ionicons name="chatbox" size={12} color={colors.primary} />
                        <AppText variant="bodySm" style={{ color: "#475569", flex: 1, fontSize: 12 }} numberOfLines={2}>
                          {latestSession.doctorFeedback}
                        </AppText>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Feedback Input Modal */}
      <Modal visible={!!feedbackModal} animationType="fade" transparent onRequestClose={() => setFeedbackModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.feedbackOverlay}>
          <View style={styles.feedbackSheet}>
            <View style={styles.feedbackSheetHeader}>
              <AppText variant="headlineMd" style={{ fontWeight: "700", color: "#0f172a" }}>Clinical Feedback</AppText>
              <TouchableOpacity onPress={() => setFeedbackModal(null)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <AppText variant="bodySm" style={{ color: "#64748b", marginBottom: 12 }}>
              {feedbackModal?.assignment.templateName}
            </AppText>
            <TextInput
              style={styles.feedbackInput}
              multiline
              placeholder="Write your advice, corrections, or encouragement..."
              placeholderTextColor="#94a3b8"
              value={feedbackText}
              onChangeText={setFeedbackText}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.feedbackSubmitBtn, (!feedbackText.trim() || submittingFeedback) && { opacity: 0.6 }]}
              onPress={handleSubmitFeedback}
              disabled={!feedbackText.trim() || submittingFeedback}
            >
              {submittingFeedback ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <AppText variant="labelMd" style={{ color: "#fff", fontWeight: "700" }}>Send Feedback</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  roleBadge: { backgroundColor: "#0f766e", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4, position: "relative" },
  notifDot: { position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", zIndex: 1 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },

  header: { gap: 2 },
  greeting: { color: "#64748b" },
  doctorName: { color: colors.onSurface, fontWeight: "800", fontSize: 26 },
  subtitle: { color: "#64748b", marginTop: 2 },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    boxShadow: "0 1px 4px rgba(0,93,182,0.06)",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", fontFamily: "Inter" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
  countBadge: { backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },

  emptyState: { alignItems: "center", paddingVertical: 48 },

  patientCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: spacing.md,
    borderWidth: 1, borderColor: "#e2e8f0",
    flexDirection: "row", alignItems: "center", gap: 12,
    boxShadow: "0 2px 8px rgba(0,93,182,0.06)",
  },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: colors.primary, fontFamily: "Manrope" },
  patientName: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  patientEmail: { color: "#64748b", fontSize: 12 },
  assignmentCount: { color: "#94a3b8", fontSize: 11 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: "#f8fafd" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  modalBack: { padding: 4 },
  modalTitle: { color: "#0f172a", fontWeight: "800", fontSize: 18 },
  modalContent: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 60 },

  assignCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: spacing.lg,
    borderWidth: 1, borderColor: "#e2e8f0",
    boxShadow: "0 2px 8px rgba(0,93,182,0.05)",
  },
  assignHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  assignStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  assignName: { color: "#0f172a", fontWeight: "700", fontSize: 16, marginBottom: 2 },

  exerciseRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f8fafc",
  },
  exIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  exName: { color: "#1e293b", fontWeight: "600", fontSize: 14 },
  exStatus: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  actionButtons: { flexDirection: "row", gap: 10, marginTop: 14 },
  btnVideo: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#e0f2fe", paddingVertical: 10, borderRadius: 12,
  },
  btnFeedback: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12,
  },

  feedbackPreview: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "#f0f9ff", borderRadius: 10, padding: 10, marginTop: 10,
  },

  // Feedback modal
  feedbackOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  feedbackSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36,
  },
  feedbackSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  feedbackInput: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, padding: 14, minHeight: 120, textAlignVertical: "top",
    fontSize: 14, color: "#0f172a", marginBottom: 14,
  },
  feedbackSubmitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12,
  },
});

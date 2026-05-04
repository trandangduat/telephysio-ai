/**
 * DoctorDashboardScreen — Overview of all patients & stats.
 */

import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { DoctorStackParamList, DoctorTabParamList } from "../../navigation/types";
import { 
  getPatients, 
  getDoctorTreatmentPlans, 
  getTodaySchedule, 
  getAverageAccuracy 
} from "../../services/firebase";
import type { ScheduleItem, TreatmentPlan, UserProfile } from "../../services/firebase/types";

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<DoctorTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<DoctorStackParamList>
>;

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { t } = useTranslation();
  const { userName, uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [patientsCount, setPatientsCount] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [recentPatients, setRecentPatients] = useState<(UserProfile & { plan?: TreatmentPlan })[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const [patients, plans, todaySchedule, accuracy] = await Promise.all([
          getPatients(uid),
          getDoctorTreatmentPlans(uid),
          getTodaySchedule(uid),
          getAverageAccuracy(uid),
        ]);

        setPatientsCount(patients.length);
        setSchedule(todaySchedule);
        setPendingReviews(plans.filter(p => p.status === 'at-risk').length); // Using at-risk as proxy for pending review
        setAvgAccuracy(accuracy);

        // Map recent patients
        const mappedPatients = patients.slice(0, 4).map(p => {
          const plan = plans.find(pl => pl.patientId === p.uid);
          return { ...p, plan };
        });
        setRecentPatients(mappedPatients);
      } catch (error) {
        console.error('Error loading doctor dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const STATS = [
    { label: 'Active Patients', value: patientsCount.toString(), icon: 'people', color: colors.primary, bg: '#e0f2fe' },
    { label: 'Sessions Today', value: schedule.length.toString(), icon: 'calendar', color: '#0f766e', bg: '#ccfbf1' },
    { label: 'Pending Reviews', value: pendingReviews.toString(), icon: 'clipboard', color: '#b45309', bg: '#fef3c7' },
    { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: 'analytics', color: '#7c3aed', bg: '#ede9fe' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>
            TelePhysioAI
          </AppText>
          <View style={styles.roleBadge}>
            <AppText
              variant="labelSm"
              style={{ color: "#fff", fontWeight: "700", fontSize: 9 }}
            >
              DOCTOR
            </AppText>
          </View>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("DoctorChat")}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notifDot} />
            <Ionicons name="notifications-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate("DoctorProfile")}
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
        {/* Greeting */}
        <View style={styles.header}>
          <AppText variant="bodyMd" style={styles.greeting}>
            Good morning,
          </AppText>
          <AppText variant="headlineLg" style={styles.doctorName}>
            {userName}
          </AppText>
          <AppText variant="bodySm" style={styles.subtitle}>
            Orthopedic Physiotherapist
          </AppText>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons
                  name={stat.icon as any}
                  size={20}
                  color={stat.color}
                />
              </View>
              <AppText variant="headlineLg" style={styles.statValue}>
                {stat.value}
              </AppText>
              <AppText variant="bodySm" style={styles.statLabel}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>
              Today's Schedule
            </AppText>
            <View style={styles.todayBadge}>
              <AppText variant="labelSm" style={{ color: colors.primary }}>
                {schedule.length} sessions
              </AppText>
            </View>
          </View>

          {schedule.length > 0 ? schedule.map((item, i) => {
            const timeDate = item.date as any;
            const timeString = timeDate?.toDate ? timeDate.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00';
            return (
              <TouchableOpacity key={i} style={styles.scheduleItem}>
                <View style={styles.scheduleTimeBox}>
                  <AppText variant="labelMd" style={styles.scheduleTime}>
                    {timeString}
                  </AppText>
                </View>
                <View style={styles.scheduleInfo}>
                  <AppText variant="labelMd" style={styles.scheduleName}>
                    {item.patientName || 'Unknown Patient'}
                  </AppText>
                  <AppText variant="bodySm" style={styles.scheduleType}>
                    {item.type}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.scheduleStatusDot,
                    { backgroundColor: "#10b981" },
                  ]}
                />
              </TouchableOpacity>
            )
          }) : (
            <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, padding: spacing.md, textAlign: 'center' }}>
              No sessions scheduled for today.
            </AppText>
          )}
        </View>

        {/* Recent Patients */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>
              Recent Patients
            </AppText>
            <TouchableOpacity onPress={() => console.log("View all patients")}>
              <AppText variant="labelSm" style={{ color: colors.primary }}>
                View All
              </AppText>
            </TouchableOpacity>
          </View>

          {recentPatients.length > 0 ? recentPatients.map((patient) => (
            <TouchableOpacity
              key={patient.uid}
              style={styles.patientRow}
              onPress={() =>
                navigation.navigate("PatientDetail", {
                  patientId: patient.uid,
                  patientName: patient.displayName || 'Patient',
                })
              }
            >
              <View style={styles.patientAvatar}>
                <Ionicons name="person" size={18} color="#94a3b8" />
              </View>
              <View style={styles.patientInfo}>
                <AppText variant="labelMd" style={styles.patientName}>
                  {patient.displayName}
                </AppText>
                <AppText variant="bodySm" style={styles.patientCondition}>
                  {patient.plan ? `${patient.plan.condition} - Week ${patient.plan.currentWeek}` : 'No Active Plan'}
                </AppText>
              </View>
              <View style={styles.patientProgress}>
                <AppText variant="labelMd" style={{ color: colors.primary }}>
                  {patient.plan?.progress || 0}%
                </AppText>
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFill,
                      { width: `${patient.plan?.progress || 0}%` },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, padding: spacing.md, textAlign: 'center' }}>
              No active patients found.
            </AppText>
          )}
        </View>

        {/* AI Alerts */}
        {recentPatients.filter(p => p.plan?.status === 'at-risk').map((patient, i) => (
          <View
            key={i}
            style={[
              styles.card,
              { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
              <AppText
                variant="headlineMd"
                style={{ color: "#991b1b", fontWeight: "700", fontSize: 16 }}
              >
                Attention Required
              </AppText>
            </View>
            <AppText
              variant="bodyMd"
              style={{ color: "#7f1d1d", lineHeight: 22 }}
            >
              {patient.displayName} is marked as At-Risk for {patient.plan?.condition || 'their treatment plan'}. Consider adjusting their treatment plan or reviewing recent feedback.
            </AppText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },
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
  roleBadge: {
    backgroundColor: "#0f766e",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4, position: "relative" },
  notifDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    zIndex: 1,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  content: {
    padding: spacing.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  header: { marginBottom: spacing.xs },
  greeting: { color: "#64748b", marginBottom: 2 },
  doctorName: { color: colors.onSurface, fontWeight: "800", fontSize: 26 },
  subtitle: { color: "#64748b", marginTop: 4 },

  devSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e0f2fe",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.onSurface,
    fontWeight: "800",
    fontSize: 28,
    marginBottom: 2,
  },
  statLabel: { color: "#64748b" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
  todayBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },

  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  scheduleTimeBox: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scheduleTime: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  scheduleInfo: { flex: 1 },
  scheduleName: { color: "#0f172a", fontWeight: "700" },
  scheduleType: { color: "#64748b", marginTop: 2 },
  scheduleStatusDot: { width: 10, height: 10, borderRadius: 5 },

  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  patientInfo: { flex: 1 },
  patientName: { color: "#0f172a", fontWeight: "700" },
  patientCondition: { color: "#64748b", marginTop: 2 },
  patientProgress: { alignItems: "flex-end", gap: 4 },
  miniBarTrack: {
    width: 50,
    height: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 2,
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

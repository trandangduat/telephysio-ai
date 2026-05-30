import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
const screenWidth = Dimensions.get("window").width;
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import type { DoctorStackParamList } from "../../navigation/types";
import {
  getActiveTreatmentPlan,
  getLatestProgress,
  getPatientSessions,
} from "../../services/firebase";
import type {
  TreatmentPlan,
  ProgressSnapshot,
  Session,
} from "../../services/firebase/types";

export const PatientDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, "PatientDetail">>();
  const { t } = useTranslation();

  // Note: the route params should ideally include patientId from DoctorPatientsScreen navigation
  const { patientName, patientId } = route.params;
  const actualPatientId = patientId;

  const [activeChart, setActiveChart] = useState("ROM");
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [fetchedPlan, fetchedProgress, fetchedSessions] = await Promise.all(
        [
          getActiveTreatmentPlan(actualPatientId),
          getLatestProgress(actualPatientId),
          getPatientSessions(actualPatientId, 20),
        ],
      );
      setPlan(fetchedPlan);
      setProgress(fetchedProgress);
      setSessions(fetchedSessions);
    } catch (error) {
      console.error("Error loading patient details:", error);
    } finally {
      setLoading(false);
    }
  }, [actualPatientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleAssign = () => {
    navigation.navigate("AssignTemplate", { patientId, patientName });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const accuracy = progress?.movementScore ?? 0;
  const sessionsCount = sessions.length;
  // Calculate average pain from sessions
  const avgPain =
    sessionsCount > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.averagePain || 0), 0) /
            sessionsCount,
        )
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.navTitle}>
          {t('doctor.patientDetail.title')}
        </AppText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={36} color="#94a3b8" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headlineMd" style={styles.profileName}>
              {patientName}
            </AppText>
            <AppText variant="bodySm" style={styles.profileCondition}>
              {plan
                ? `${plan.condition} · ${t('doctor.patientDetail.weekLabel', { num: plan.currentWeek })} · Phase ${plan.currentPhase}`
                : t('doctor.patientDetail.noActivePlan')}
            </AppText>
            <View style={styles.profileBadges}>
              <View style={[styles.badge, { backgroundColor: "#dcfce7" }]}>
                <AppText
                  variant="labelSm"
                  style={{ color: "#166534", fontSize: 10 }}
                >
                  {plan?.status === "on-track"
                    ? t('doctor.patientDetail.onTrack')
                    : plan?.status || t('doctor.patientDetail.active')}
                </AppText>
              </View>
              <View style={[styles.badge, { backgroundColor: "#e0f2fe" }]}>
                <AppText
                  variant="labelSm"
                  style={{ color: colors.primary, fontSize: 10 }}
                >
                  {t('doctor.patientDetail.sessionsCount', { count: sessionsCount })}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {[
            {
              label: t('doctor.patientDetail.accuracy'),
              value: `${accuracy}%`,
              icon: "analytics",
              color: colors.primary,
            },
            {
              label: t('doctor.patientDetail.sessions'),
              value: `${sessionsCount}`,
              icon: "calendar",
              color: "#0f766e",
            },
            {
              label: t('doctor.patientDetail.streak'),
              value: `${progress?.weeklyConsistency ? Math.round((progress.weeklyConsistency / 100) * 7) : 0}d`,
              icon: "flame",
              color: "#b45309",
            },
            {
              label: t('doctor.patientDetail.painAvg'),
              value: `${avgPain}/10`,
              icon: "pulse",
              color: "#dc2626",
            },
          ].map((stat) => (
            <View key={stat.label} style={styles.quickStatItem}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <AppText
                variant="headlineMd"
                style={[styles.quickStatValue, { color: stat.color }]}
              >
                {stat.value}
              </AppText>
              <AppText variant="bodySm" style={styles.quickStatLabel}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Chart Toggle */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>
              {t('doctor.patientDetail.recoveryProgress')}
            </AppText>
            <View style={styles.toggleGroup}>
              {["ROM", "Pain", "Accuracy"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.toggleBtn,
                    activeChart === tab && styles.toggleBtnActive,
                  ]}
                  onPress={() => setActiveChart(tab)}
                >
                  <AppText
                    variant="labelSm"
                    style={{ color: activeChart === tab ? "#fff" : "#475569" }}
                  >
                    {tab}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartWrapper}>
            <LineChart
              data={(() => {
                const currentWeek = plan?.currentWeek || 4;
                const weeksToShow = currentWeek;

                const labels = [];
                const data = [];

                const romActual = [30, 38, 45, 52, 60, 68, 75, 80];
                const painActual = [6, 5, 4, 3, 2, 2, 1, 1];
                const accuracyActual = [50, 58, 65, 72, 78, 83, 88, 92];

                for (let i = 0; i < weeksToShow; i++) {
                  labels.push(`W${i + 1}`);
                  if (activeChart === "ROM") {
                    data.push(progress?.romFlexion && i === weeksToShow - 1 ? progress.romFlexion : romActual[i]);
                  } else if (activeChart === "Pain") {
                    data.push(avgPain && i === weeksToShow - 1 ? avgPain : painActual[i]);
                  } else {
                    data.push(progress?.movementScore && i === weeksToShow - 1 ? progress.movementScore : accuracyActual[i]);
                  }
                }

                return {
                  labels,
                  datasets: [{ data, strokeWidth: 3 }],
                };
              })()}
              width={screenWidth + spacing.lg * 2}
              height={180}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                labelColor: () => "rgba(100, 116, 139, 0.5)",
                propsForBackgroundLines: {
                  stroke: "#f1f5f9",
                  strokeWidth: 1,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#0f766e",
                  fill: "#fff",
                },
                propsForLabels: {
                  fontSize: 10,
                  fontWeight: "500",
                  fontFamily: "Inter_500Medium",
                  fill: "rgba(100, 116, 139, 0.5)",
                },
              }}
              bezier={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
              withDots={true}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={handleAssign}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <AppText
              variant="labelMd"
              style={{ color: "#fff", fontWeight: "700" }}
            >
              {t('doctor.patientDetail.manageSessions', 'Manage Patient Sessions')}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  navBackBtn: { padding: 4, marginLeft: -4 },
  navTitle: { color: colors.onSurface, fontWeight: "700", fontSize: 18 },

  scroll: { flex: 1 },
  content: {
    padding: spacing.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: "#0f172a", fontWeight: "800", fontSize: 20 },
  profileCondition: { color: "#64748b", marginTop: 4, marginBottom: 8 },
  profileBadges: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },

  quickStats: { flexDirection: "row", gap: spacing.sm },
  quickStatItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  quickStatValue: { fontWeight: "800", fontSize: 18 },
  quickStatLabel: { color: "#64748b", fontSize: 10 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.primary },

  chartWrapper: {
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
    marginTop: spacing.sm,
    alignItems: "center",
    overflow: "hidden",
  },
  chart: {
    borderRadius: 0,
  },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e0f2fe",
    paddingVertical: 16,
    borderRadius: 16,
  },
});

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
            {/* Y-axis label */}
            <AppText variant="labelSm" style={styles.yAxisLabel}>
              {activeChart === "ROM" ? "Degrees (°)" : activeChart === "Pain" ? "Pain Level (0-10)" : "Score (%)"}
            </AppText>
            <LineChart
              data={{
                labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
                datasets: (() => {
                  const currentWeek = plan?.currentWeek || 4;
                  const totalWeeks = plan?.totalWeeks || 8;
                  const weeksToShow = Math.max(totalWeeks, currentWeek + 2);
                  const labels = [];
                  for (let i = 1; i <= weeksToShow && i <= 8; i++) labels.push(`W${i}`);

                  // Generate actual data up to current week
                  const actualData = [];
                  const projectedData = [];
                  const targetData = [];

                  // ROM baseline progression
                  const romValues = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
                  const painValues = [7, 6, 5, 4, 3, 2, 2, 1, 1, 1, 0, 0];
                  const accuracyValues = [45, 52, 58, 65, 70, 75, 80, 85, 88, 90, 92, 95];

                  const targetROM = 90; // Target ROM for knee flexion
                  const targetPain = 0;
                  const targetAccuracy = 90;

                  for (let i = 0; i < weeksToShow && i < 8; i++) {
                    const weekNum = i + 1;

                    // Actual data (up to current week)
                    if (weekNum <= currentWeek) {
                      if (activeChart === "ROM") {
                        actualData.push(progress?.romFlexion || romValues[i] || 75);
                      } else if (activeChart === "Pain") {
                        actualData.push(avgPain && weekNum === currentWeek ? avgPain : (painValues[i] || 2));
                      } else {
                        actualData.push(progress?.movementScore || accuracyValues[i] || 80);
                      }
                      projectedData.push(null);
                    } else {
                      // Projected data (after current week)
                      actualData.push(null);
                      if (activeChart === "ROM") {
                        projectedData.push(romValues[i] || 75);
                      } else if (activeChart === "Pain") {
                        projectedData.push(painValues[i] || 1);
                      } else {
                        projectedData.push(accuracyValues[i] || 85);
                      }
                    }

                    // Target line (constant)
                    if (activeChart === "ROM") {
                      targetData.push(targetROM);
                    } else if (activeChart === "Pain") {
                      targetData.push(targetPain);
                    } else {
                      targetData.push(targetAccuracy);
                    }
                  }

                  return [
                    {
                      data: targetData,
                      color: (opacity = 1) => `rgba(220, 38, 38, ${opacity * 0.3})`,
                      strokeWidth: 2,
                    },
                    {
                      data: actualData,
                      color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                      strokeWidth: 3,
                    },
                    {
                      data: projectedData,
                      color: (opacity = 1) => `rgba(15, 118, 110, ${opacity * 0.3})`,
                      strokeWidth: 2,
                    },
                  ];
                })(),
              }}
              width={screenWidth - 16}
              height={200}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                propsForBackgroundLines: {
                  strokeDasharray: "5,5",
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#0f766e",
                  fill: "#fff",
                },
                propsForLabels: {
                  fontSize: 12,
                  fontWeight: "600",
                  fill: "#1e293b",
                },
              }}
              bezier={false}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
              withDots={true}
              style={styles.chart}
              renderDotContent={({ x, y, index }) => {
                // Only show dots for actual data (not projected or target)
                const currentWeek = plan?.currentWeek || 4;
                if (index < currentWeek) {
                  return (
                    <View
                      key={index}
                      style={{
                        position: 'absolute',
                        top: y - 5,
                        left: x - 5,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#0f766e',
                        borderWidth: 2,
                        borderColor: '#fff',
                      }}
                    />
                  );
                }
                return null;
              }}
            />
            {/* Legend */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#0f766e' }]} />
                <AppText variant="labelSm" style={styles.legendText}>Actual</AppText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: 'rgba(15, 118, 110, 0.3)' }]} />
                <AppText variant="labelSm" style={styles.legendText}>Projected</AppText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: 'rgba(220, 38, 38, 0.3)', borderBottomWidth: 1, borderBottomColor: 'rgba(220, 38, 38, 0.3)', borderStyle: 'dashed' }]} />
                <AppText variant="labelSm" style={styles.legendText}>Target</AppText>
              </View>
            </View>
            {/* X-axis label */}
            <AppText variant="labelSm" style={styles.xAxisLabel}>
              Treatment Timeline (Weeks)
            </AppText>
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
    paddingBottom: spacing.md,
  },
  chart: {
    borderRadius: 0,
  },
  yAxisLabel: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700",
    alignSelf: "flex-start",
    marginLeft: spacing.lg + 8,
    marginBottom: 4,
  },
  xAxisLabel: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: spacing.md,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
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

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
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
  getProgressHistory,
  getPatientSessions,
} from "../../services/firebase";
import type {
  TreatmentPlan,
  ProgressSnapshot,
  Session,
} from "../../services/firebase/types";

type ChartMetric = "ROM" | "Pain" | "Accuracy";

type ChartPoint = {
  label: string;
  value: number;
};

const MAX_VISIBLE_POINTS = 6;
const CHART_HEIGHT = 180;
const CHART_PADDING = {
  top: 16,
  right: 8,
  bottom: 28,
  left: 34,
};

const getTimestampMs = (timestamp: ProgressSnapshot["date"] | Session["date"]) => {
  return (timestamp as any)?.toMillis?.() ?? 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const limitAndLabelPoints = (
  points: ChartPoint[],
  currentWeek?: number,
): ChartPoint[] => {
  const maxByPlan = currentWeek ? Math.max(1, currentWeek) : MAX_VISIBLE_POINTS;
  const visibleCount = Math.min(points.length, MAX_VISIBLE_POINTS, maxByPlan);
  const visiblePoints = points.slice(-visibleCount);
  const startWeek = currentWeek
    ? Math.max(1, currentWeek - visiblePoints.length + 1)
    : 1;

  return visiblePoints.map((point, index) => ({
    ...point,
    label: `W${startWeek + index}`,
  }));
};

const buildSnapshotPoints = (
  metric: Exclude<ChartMetric, "Pain">,
  history: ProgressSnapshot[],
  latest: ProgressSnapshot | null,
  currentWeek?: number,
): ChartPoint[] => {
  const snapshots = (history.length > 0 ? history : latest ? [latest] : [])
    .slice()
    .sort((a, b) => getTimestampMs(a.date) - getTimestampMs(b.date));

  const points = snapshots
    .map((snapshot, index) => {
      const value =
        metric === "ROM"
          ? (snapshot.romFlexion ?? snapshot.rom)
          : snapshot.movementScore;

      return {
        label: `W${index + 1}`,
        value,
      };
    })
    .filter((point): point is ChartPoint => isFiniteNumber(point.value));

  return limitAndLabelPoints(points, currentWeek);
};

const buildPainPoints = (
  sessions: Session[],
  currentWeek?: number,
): ChartPoint[] => {
  const sessionsWithPain = sessions
    .map((session) => ({
      dateMs: getTimestampMs(session.date),
      pain: session.averagePain ?? session.painLevel,
    }))
    .filter(
      (session): session is { dateMs: number; pain: number } =>
        session.dateMs > 0 && isFiniteNumber(session.pain),
    )
    .sort((a, b) => a.dateMs - b.dateMs);

  if (sessionsWithPain.length === 0) return [];

  const firstSessionMs = sessionsWithPain[0].dateMs;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyPain = new Map<number, { total: number; count: number }>();

  sessionsWithPain.forEach((session) => {
    const weekIndex = Math.floor((session.dateMs - firstSessionMs) / weekMs);
    const existing = weeklyPain.get(weekIndex) ?? { total: 0, count: 0 };
    weeklyPain.set(weekIndex, {
      total: existing.total + session.pain,
      count: existing.count + 1,
    });
  });

  const points = Array.from(weeklyPain.entries())
    .sort(([a], [b]) => a - b)
    .map(([_, value], index) => ({
      label: `W${index + 1}`,
      value: Math.round((value.total / value.count) * 10) / 10,
    }));

  return limitAndLabelPoints(points, currentWeek);
};

const buildRecoveryPoints = (
  metric: ChartMetric,
  history: ProgressSnapshot[],
  latest: ProgressSnapshot | null,
  sessions: Session[],
  currentWeek?: number,
) => {
  if (metric === "Pain") {
    return buildPainPoints(sessions, currentWeek);
  }

  return buildSnapshotPoints(metric, history, latest, currentWeek);
};

const formatChartValue = (value: number) => {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
};

const RecoveryLineChart = ({
  data,
  width,
  metric,
}: {
  data: ChartPoint[];
  width: number;
  metric: ChartMetric;
}) => {
  const values = data.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin;
  const padding = range === 0 ? (metric === "Pain" ? 1 : 5) : range * 0.18;
  let yMin = rawMin - padding;
  let yMax = rawMax + padding;

  if (metric === "Pain") {
    yMin = Math.max(0, yMin);
    if (rawMax <= 10) yMax = Math.min(10, yMax);
  } else {
    yMin = Math.max(0, yMin);
    if (metric === "Accuracy" && rawMax <= 100) yMax = Math.min(100, yMax);
  }

  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  const plotWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const getX = (index: number) => {
    if (data.length === 1) return CHART_PADDING.left + plotWidth / 2;
    return CHART_PADDING.left + (plotWidth * index) / (data.length - 1);
  };
  const getY = (value: number) => {
    const percent = (value - yMin) / (yMax - yMin);
    return CHART_PADDING.top + plotHeight - percent * plotHeight;
  };
  const coordinates = data.map((point, index) => ({
    ...point,
    x: getX(index),
    y: getY(point.value),
  }));
  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      {ticks.map((tick) => {
        const y = CHART_PADDING.top + plotHeight * tick;
        const value = yMax - (yMax - yMin) * tick;

        return (
          <React.Fragment key={tick}>
            <Line
              x1={CHART_PADDING.left}
              y1={y}
              x2={width - CHART_PADDING.right}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <SvgText
              x={0}
              y={y + 3}
              fill="rgba(100, 116, 139, 0.5)"
              fontFamily="Inter_500Medium"
              fontSize={10}
              fontWeight="500"
            >
              {formatChartValue(value)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {coordinates.length > 1 && (
        <Path
          d={path}
          fill="none"
          stroke="#0f766e"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {coordinates.map((point) => (
        <Circle
          key={`${point.label}-${point.value}`}
          cx={point.x}
          cy={point.y}
          r={4}
          stroke="#0f766e"
          strokeWidth={2}
          fill="#fff"
        />
      ))}
      {coordinates.map((point) => (
        <SvgText
          key={`${point.label}-label`}
          x={point.x}
          y={CHART_HEIGHT - 6}
          fill="rgba(100, 116, 139, 0.5)"
          fontFamily="Inter_500Medium"
          fontSize={10}
          fontWeight="500"
          textAnchor="middle"
        >
          {point.label}
        </SvgText>
      ))}
    </Svg>
  );
};

export const PatientDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, "PatientDetail">>();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();

  // Note: the route params should ideally include patientId from DoctorPatientsScreen navigation
  const { patientName, patientId } = route.params;
  const actualPatientId = patientId;

  const [activeChart, setActiveChart] = useState<ChartMetric>("ROM");
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProgressSnapshot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [
        fetchedPlan,
        fetchedProgress,
        fetchedProgressHistory,
        fetchedSessions,
      ] = await Promise.all([
        getActiveTreatmentPlan(actualPatientId),
        getLatestProgress(actualPatientId),
        getProgressHistory(actualPatientId, 12),
        getPatientSessions(actualPatientId, 20),
      ]);
      setPlan(fetchedPlan);
      setProgress(fetchedProgress);
      setProgressHistory(fetchedProgressHistory);
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
  const chartWidth = Math.max(
    280,
    windowWidth - spacing.gutter * 2 - spacing.lg * 2,
  );
  const chartData = buildRecoveryPoints(
    activeChart,
    progressHistory,
    progress,
    sessions,
    plan?.currentWeek,
  );

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
              {(["ROM", "Pain", "Accuracy"] as ChartMetric[]).map((tab) => (
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
            {chartData.length > 0 ? (
              <RecoveryLineChart
                data={chartData}
                width={chartWidth}
                metric={activeChart}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="analytics-outline" size={24} color="#94a3b8" />
                <AppText variant="bodySm" style={styles.emptyChartText}>
                  {t('doctor.patientDetail.noChartData')}
                </AppText>
              </View>
            )}
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
    marginTop: spacing.sm,
    alignItems: "center",
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyChartText: {
    color: "#64748b",
    textAlign: "center",
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

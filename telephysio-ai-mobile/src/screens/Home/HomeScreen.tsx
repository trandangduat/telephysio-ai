/**
 * HomeScreen — Redesigned Dashboard (Clinical Vitality)
 */

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { AppText } from "../../components/ui";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type {
  RootStackParamList,
  BottomTabParamList,
} from "../../navigation/types";
import {
  getActiveTreatmentPlan,
  getLatestProgress,
  getPatientAssignments,
} from "../../services/firebase";
import type {
  TreatmentPlan,
  ProgressSnapshot,
  Assignment,
} from "../../services/firebase/types";

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeNavProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { userName, uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, uid]);

  async function loadData() {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const [fetchedPlan, fetchedProgress, assignments] = await Promise.all([
        getActiveTreatmentPlan(uid),
        getLatestProgress(uid),
        getPatientAssignments(uid, "active"),
      ]);
      setPlan(fetchedPlan);
      setProgress(fetchedProgress);
      if (assignments && assignments.length > 0) {
        setActiveAssignment(assignments[0]);
      } else {
        setActiveAssignment(null);
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [uid]);

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

  const protocolTitle = activeAssignment?.templateName || plan?.condition || "No Active Protocol";
  const protocolSubtitle = activeAssignment
    ? `${activeAssignment.exercises.length} exercises • ${activeAssignment.totalDuration || "0 min"}`
    : plan
    ? `Phase ${plan.currentPhase}, Week ${plan.currentWeek}`
    : "Please contact your doctor.";

  const movementScore = progress?.movementScore || 0;
  const timeActive = progress?.timeActiveMinutes || 0;
  const dailyGoalPercent = progress?.dailyGoalPercent || 0;
  const sessionsCompleted = progress?.sessionsCompleted || 0;
  const sessionsTarget = progress?.sessionsTarget || 3;
  const aiInsight =
    progress?.aiInsight ||
    "Complete a session to get your AI recovery insight.";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Unified Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>
            TelePhysioAI
          </AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("DoctorChat")}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={"#475569"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert("Notifications", "No new notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={"#475569"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate("Profile" as any)}
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
        {/* Header Greeting */}
        <View style={styles.header}>
          <AppText variant="headlineXl" style={styles.greetingTitle}>
            Good Morning, {userName || "there"}.
          </AppText>
          <AppText
            variant="bodySm"
            color={colors.onSurfaceVariant}
            style={styles.greetingSubtitle}
          >
            Here is your daily physical therapy overview.
          </AppText>
        </View>

        {/* Current Protocol Card */}
        <View style={styles.card}>
          <View style={styles.cardTopLeft}>
            <Ionicons
              name="clipboard-outline"
              size={16}
              color={colors.primary}
            />
            <AppText variant="labelMd" style={styles.blueLabel}>
              CURRENT PROTOCOL
            </AppText>
          </View>
          <AppText variant="headlineMd" style={styles.protocolTitle}>
            {protocolTitle}
          </AppText>
          <AppText
            variant="bodySm"
            color={colors.onSurfaceVariant}
            style={styles.protocolSubtitle}
          >
            {protocolSubtitle}
          </AppText>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Workout")}
          >
            <Ionicons
              name="play"
              size={18}
              color={colors.onPrimary}
              style={{ marginRight: 8 }}
            />
            <AppText variant="labelMd" color={colors.onPrimary}>
              Start Session
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Movement Score Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <AppText variant="labelMd" style={styles.grayLabel}>
              MOVEMENT SCORE
            </AppText>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.outline}
            />
          </View>
          <View style={styles.scoreRow}>
            <AppText style={styles.scoreBig}>{movementScore}</AppText>
            <AppText style={styles.scoreSmall}> /100</AppText>
          </View>

          {/* Mock Area Chart using CSS */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBackground}>
              {/* Fake curve elements */}
              <View style={[styles.chartBar, { height: 30 }]} />
              <View style={[styles.chartBar, { height: 45 }]} />
              <View style={[styles.chartBar, { height: 40 }]} />
              <View style={[styles.chartBar, { height: 60 }]} />
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(30, movementScore - 10) },
                ]}
              />
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(30, movementScore - 5) },
                ]}
              />
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(30, movementScore + 10) },
                ]}
              />
            </View>
          </View>
          <AppText
            variant="labelSm"
            color={colors.onSurfaceVariant}
            style={styles.chartLabel}
          >
            AI Assessed Average (Last 7 Days)
          </AppText>
        </View>

        {/* Time Active Card */}
        <View style={styles.card}>
          <View style={styles.cardTopLeft}>
            <Ionicons
              name="stopwatch"
              size={16}
              color={colors.onSurfaceVariant}
            />
            <AppText variant="labelMd" style={styles.grayLabel}>
              TIME ACTIVE
            </AppText>
          </View>
          <View style={styles.statRow}>
            <AppText style={styles.statBig}>{timeActive}</AppText>
            <AppText style={styles.statSmall}> min</AppText>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, dailyGoalPercent)}%`,
                  backgroundColor: colors.tertiaryFixedDim,
                },
              ]}
            />
          </View>
          <AppText
            variant="labelSm"
            color={colors.onSurfaceVariant}
            style={styles.progressLabelRight}
          >
            {dailyGoalPercent}% of daily goal
          </AppText>
        </View>

        {/* Sessions Card */}
        <View style={styles.card}>
          <View style={styles.cardTopLeft}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.onSurfaceVariant}
            />
            <AppText variant="labelMd" style={styles.grayLabel}>
              SESSIONS
            </AppText>
          </View>
          <View style={styles.statRow}>
            <AppText style={styles.statBig}>{sessionsCompleted}</AppText>
            <AppText style={styles.statSmall}>
              {" "}
              /{sessionsTarget} this week
            </AppText>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, (sessionsCompleted / sessionsTarget) * 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <AppText
            variant="labelSm"
            color={colors.onSurfaceVariant}
            style={styles.progressLabelRight}
          >
            {Math.max(0, sessionsTarget - sessionsCompleted)} remaining
          </AppText>
        </View>

        {/* AI Insight Card */}
        <View style={[styles.card, styles.insightCard]}>
          <View style={styles.cardTopLeft}>
            <Ionicons
              name="sparkles"
              size={16}
              color={colors.primaryFixedDim}
            />
            <AppText variant="labelMd" style={styles.insightLabel}>
              AI INSIGHT
            </AppText>
          </View>
          <AppText variant="bodyMd" style={styles.insightText}>
            {aiInsight}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafd",
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  devSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ccfbf1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
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
  content: {
    padding: spacing.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  greetingTitle: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: 6,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  blueLabel: {
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  grayLabel: {
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  protocolTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  protocolSubtitle: {
    color: "#64748b",
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 100,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  scoreBig: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 48,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -1,
  },
  scoreSmall: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  chartContainer: {
    height: 120,
    marginBottom: spacing.md,
    justifyContent: "flex-end",
  },
  chartBackground: {
    height: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
  },
  chartBar: {
    width: "12%",
    backgroundColor: "#dbeafe",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chartLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  statBig: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  statSmall: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabelRight: {
    textAlign: "right",
    fontSize: 11,
    fontWeight: "500",
  },
  insightCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  insightLabel: {
    color: "#93c5fd",
    fontWeight: "700",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  insightText: {
    color: "#ffffff",
    lineHeight: 24,
  },
});

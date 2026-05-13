import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import type { DoctorStackParamList } from "../../navigation/types";
import { getPatientSessions } from "../../services/firebase";
import type { Session } from "../../services/firebase/types";

type DayOption = {
  key: string;
  label: string;
  weekday: string;
  date: Date | null;
  count: number;
};

const getSessionDate = (session: Session) =>
  (session.date as any)?.toDate?.() ?? new Date();

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

export const PatientSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, "PatientSessions">>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDay, setSelectedDay] = useState("all");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSessions = await getPatientSessions(patientId, 100);
      setSessions(fetchedSessions);
      setSelectedDay((current) => {
        if (current === "all") return current;
        return fetchedSessions.some((session) => getDayKey(getSessionDate(session)) === current)
          ? current
          : "all";
      });
    } catch (error) {
      console.error("Error loading patient sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const dayOptions = useMemo<DayOption[]>(() => {
    const grouped = new Map<string, { date: Date; count: number }>();

    sessions.forEach((session) => {
      const date = getSessionDate(session);
      const key = getDayKey(date);
      const existing = grouped.get(key);
      grouped.set(key, { date, count: (existing?.count ?? 0) + 1 });
    });

    const days = [...grouped.entries()]
      .sort((a, b) => b[1].date.getTime() - a[1].date.getTime())
      .map(([key, value]) => ({
        key,
        label: value.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        weekday: value.date.toLocaleDateString(undefined, { weekday: "short" }),
        date: value.date,
        count: value.count,
      }));

    return [
      { key: "all", label: "All", weekday: "Days", date: null, count: sessions.length },
      ...days,
    ];
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => getSessionDate(b).getTime() - getSessionDate(a).getTime(),
    );

    if (selectedDay === "all") return sorted;
    return sorted.filter((session) => getDayKey(getSessionDate(session)) === selectedDay);
  }, [selectedDay, sessions]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <AppText variant="headlineMd" style={styles.navTitle}>Sessions</AppText>
          <AppText variant="bodySm" style={styles.navSubtitle}>{patientName}</AppText>
        </View>
        <View style={styles.totalBadge}>
          <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: "800" }}>
            {sessions.length}
          </AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySlider}>
            {dayOptions.map((day) => {
              const active = selectedDay === day.key;
              return (
                <TouchableOpacity
                  key={day.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day.key)}
                  activeOpacity={0.85}
                >
                  <AppText variant="labelSm" style={[styles.dayWeekday, active && styles.dayTextActive]}>
                    {day.weekday}
                  </AppText>
                  <AppText variant="labelMd" style={[styles.dayLabel, active && styles.dayTextActive]}>
                    {day.label}
                  </AppText>
                  <AppText variant="bodySm" style={[styles.dayCount, active && styles.dayTextActive]}>
                    {day.count} session{day.count !== 1 ? "s" : ""}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {visibleSessions.length > 0 ? (
            visibleSessions.map((session) => {
              const date = getSessionDate(session);
              const completed = session.completedExercises || session.exercisesCompleted || 0;
              const accuracy = Math.round(session.accuracyScore ?? session.accuracy ?? 0);
              const duration = session.totalDuration || session.duration || "0 min";

              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => navigation.navigate("DoctorSessionDetail", { session, patientName })}
                  activeOpacity={0.85}
                >
                  <View style={styles.sessionIcon}>
                    <Ionicons name="fitness-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="labelMd" style={styles.sessionTitle}>
                      {date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </AppText>
                    <AppText variant="bodySm" style={styles.sessionTime}>
                      {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </AppText>
                    <View style={styles.sessionStats}>
                      <AppText variant="bodySm" style={styles.statText}>{completed} exercises</AppText>
                      <AppText variant="bodySm" style={styles.statText}>{accuracy}% accuracy</AppText>
                      <AppText variant="bodySm" style={styles.statText}>{duration}</AppText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <AppText variant="bodyMd" style={{ color: "#94a3b8", marginTop: 12 }}>
                No sessions recorded for this day.
              </AppText>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  navBackBtn: { padding: 4, marginLeft: -4 },
  navTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 20 },
  navSubtitle: { color: "#64748b", marginTop: 2 },
  totalBadge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  daySlider: { gap: spacing.sm, paddingRight: spacing.gutter },
  dayChip: {
    minWidth: 104,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayWeekday: { color: "#94a3b8", fontSize: 11, marginBottom: 4 },
  dayLabel: { color: "#0f172a", fontWeight: "800" },
  dayCount: { color: "#64748b", fontSize: 11, marginTop: 4 },
  dayTextActive: { color: "#fff" },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTitle: { color: "#0f172a", fontWeight: "800", fontSize: 15 },
  sessionTime: { color: "#64748b", marginTop: 2 },
  sessionStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  statText: {
    color: "#475569",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
  },
  emptyState: { alignItems: "center", paddingVertical: 48 },
});

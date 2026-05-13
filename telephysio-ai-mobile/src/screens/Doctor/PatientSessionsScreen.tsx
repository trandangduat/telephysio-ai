import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const getDayKey = (date: Date) => {
  const local = startOfDay(date);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
};

export const PatientSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, "PatientSessions">>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSessions = await getPatientSessions(patientId, 100);
      setSessions(fetchedSessions);
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

  const sessionsByDay = useMemo(() => {
    const grouped = new Map<string, { date: Date; count: number }>();
    sessions.forEach((session) => {
      const date = getSessionDate(session);
      const key = getDayKey(date);
      const existing = grouped.get(key);
      grouped.set(key, { date, count: (existing?.count ?? 0) + 1 });
    });
    return grouped;
  }, [sessions]);

  const sliderDays = useMemo<DayOption[]>(() => {
    const anchor = selectedDate;
    return Array.from({ length: 21 }, (_, index) => {
      const date = addDays(anchor, index - 7);
      const key = getDayKey(date);
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
        date,
        count: sessionsByDay.get(key)?.count ?? 0,
      };
    });
  }, [selectedDate, sessionsByDay]);

  const visibleSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => getSessionDate(b).getTime() - getSessionDate(a).getTime(),
    );
    const selectedKey = getDayKey(selectedDate);
    return sorted.filter((session) => getDayKey(getSessionDate(session)) === selectedKey);
  }, [selectedDate, sessions]);

  const selectedKey = getDayKey(selectedDate);
  const calendarLead = startOfMonth(visibleMonth).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: calendarLead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)),
  ];

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
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View>
                <AppText variant="headlineMd" style={styles.timelineDate}>
                  {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </AppText>
                <AppText variant="bodySm" style={styles.timelineSubtitle}>
                  Slide the timeline, or jump to any month.
                </AppText>
              </View>
              <TouchableOpacity style={styles.jumpButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: "800" }}>Pick</AppText>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySlider}>
              {sliderDays.map((day, index) => {
                const active = selectedKey === day.key;
                const hasSessions = day.count > 0;
                return (
                  <TouchableOpacity
                    key={`${day.key}-${index}`}
                    style={[styles.timelineNode, active && styles.timelineNodeActive]}
                    onPress={() => setSelectedDate(startOfDay(day.date!))}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.timelineStem, hasSessions && styles.timelineStemFilled, active && styles.timelineStemActive]} />
                    <AppText variant="labelSm" style={[styles.dayWeekday, active && styles.dayTextActive]}>
                      {day.weekday}
                    </AppText>
                    <AppText variant="headlineMd" style={[styles.dayLabel, active && styles.dayTextActive]}>
                      {day.date!.getDate()}
                    </AppText>
                    <AppText variant="bodySm" style={[styles.dayCount, active && styles.dayTextActive]}>
                      {day.count || ""}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

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
                No sessions recorded on this date.
              </AppText>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showDatePicker} animationType="slide" transparent onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <AppText variant="headlineMd" style={styles.calendarTitle}>
                {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </AppText>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeader}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <AppText key={`${day}-${index}`} variant="labelSm" style={styles.weekHeaderText}>{day}</AppText>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                const key = getDayKey(date);
                const active = key === selectedKey;
                const count = sessionsByDay.get(key)?.count ?? 0;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.calendarDay, active && styles.calendarDayActive]}
                    onPress={() => setSelectedDate(startOfDay(date))}
                    activeOpacity={0.85}
                  >
                    <AppText variant="labelMd" style={[styles.calendarDayText, active && styles.calendarDayTextActive]}>
                      {date.getDate()}
                    </AppText>
                    {count > 0 && <View style={[styles.calendarSessionPill, active && { backgroundColor: "#fff" }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.calendarDoneBtn} onPress={() => setShowDatePicker(false)}>
              <AppText variant="labelMd" style={{ color: "#fff", fontWeight: "800" }}>Show this date</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  timelineCard: {
    backgroundColor: "#0f172a",
    borderRadius: 26,
    padding: spacing.md,
    gap: spacing.md,
  },
  timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  timelineDate: { color: "#fff", fontWeight: "800", fontSize: 18 },
  timelineSubtitle: { color: "#94a3b8", marginTop: 2 },
  jumpButton: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ecfeff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  daySlider: { gap: 6, paddingRight: spacing.gutter, alignItems: "flex-end" },
  timelineNode: {
    width: 54,
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  timelineNodeActive: { backgroundColor: colors.primary },
  timelineStem: { width: 3, height: 18, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.18)", marginBottom: 6 },
  timelineStemFilled: { height: 30, backgroundColor: "#f59e0b" },
  timelineStemActive: { backgroundColor: "#fff" },
  dayWeekday: { color: "#94a3b8", fontSize: 10, marginBottom: 2 },
  dayLabel: { color: "#fff", fontWeight: "800", fontSize: 20 },
  dayCount: { color: "#94a3b8", fontSize: 10, marginTop: 2, minHeight: 12 },
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "flex-end" },
  calendarSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.lg, paddingBottom: 32,
  },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  calendarTitle: { color: "#0f172a", fontWeight: "800", fontSize: 18 },
  weekHeader: { flexDirection: "row", marginBottom: spacing.sm },
  weekHeaderText: { flex: 1, textAlign: "center", color: "#94a3b8", fontWeight: "800" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: {
    width: `${100 / 7}%`, height: 46, alignItems: "center", justifyContent: "center",
    borderRadius: 14, marginBottom: 4,
  },
  calendarDayActive: { backgroundColor: colors.primary },
  calendarDayText: { color: "#0f172a", fontWeight: "700" },
  calendarDayTextActive: { color: "#fff" },
  calendarSessionPill: { width: 16, height: 4, borderRadius: 99, backgroundColor: "#f59e0b", marginTop: 3 },
  calendarDoneBtn: {
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 16, marginTop: spacing.md,
  },
});

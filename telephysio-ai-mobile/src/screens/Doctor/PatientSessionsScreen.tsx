/**
 * @file PatientSessionsScreen.tsx
 * @description Màn hình xem lịch sử buổi tập của bệnh nhân dành cho bác sĩ.
 * Hiển thị các buổi tập được nhóm theo ngày với thanh trượt ngày (day slider)
 * và lịch tháng (calendar modal). Cho phép bác sĩ chọn ngày và xem chi tiết từng buổi.
 */

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

/**
 * @function getSessionDate
 * @description Lấy đối tượng Date từ buổi tập. Hỗ trợ cả Firestore Timestamp lẫn giá trị thời gian thần.
 * @param {Session} session - Đối tượng buổi tập cần lấy ngày.
 * @return {Date} Đối tượng Date tương ứng với thời điểm buổi tập.
 */
const getSessionDate = (session: Session) =>
  (session.date as any)?.toDate?.() ?? new Date();

/**
 * @function startOfDay
 * @description Trả về đối tượng Date ảnh hưởng đến 0 giờ 0 phút 0 giây của ngày đã cho.
 * @param {Date} date - Ngày cần lấy đầu ngày.
 * @return {Date} Đối tượng Date lúc 00:00:00.000 của ngày đó.
 */
const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * @function startOfMonth
 * @description Trả về đối tượng Date đầu tiên của tháng chứa ngày đã cho.
 * @param {Date} date - Ngày bất kỳ trong tháng.
 * @return {Date} Ngày 1 của tháng đó.
 */
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * @function addDays
 * @description Thêm số ngày chỉ định vào một ngày và trả về ngày mới.
 * @param {Date} date - Ngày gốc.
 * @param {number} days - Số ngày cần thêm (có thể âm để trừ ngày).
 * @return {Date} Ngày sau khi đã cộng thêm số ngày.
 */
const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
/**
 * @function getDayKey
 * @description Tạo chuỗi khóa định danh duy nhất cho một ngày theo định dạng "YYYY-MM-DD".
 * Dùng để nhóm và so sánh các buổi tập theo ngày.
 * @param {Date} date - Ngày cần tạo khóa.
 * @return {string} Chuỗi định dạng "YYYY-MM-DD".
 */
const getDayKey = (date: Date) => {
  const local = startOfDay(date);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
};

/**
 * @component PatientSessionsScreen
 * @description Component màn hình xem lịch sử buổi tập của bệnh nhân.
 * Cho phép bác sĩ chọn ngày qua thanh trượt hoặc lịch modal, xem danh sách
 * buổi tập của ngày đó và nhấn vào từng buổi để xem chi tiết.
 * @return {React.ReactElement} Giao diện danh sách buổi tập với bộ chọn ngày.
 */
export const PatientSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, "PatientSessions">>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * @function loadSessions
   * @description Tải danh sách buổi tập của bệnh nhân từ Firebase (tối đa 100 buổi).
   * Cập nhật state sessions và quản lý trạng thái loading.
   * @return {Promise<void>}
   */
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

  /**
   * @description Nhóm các buổi tập theo ngày, trả về Map với khóa là chuỗi YYYY-MM-DD
   * và giá trị là đối tượng chứa ngày và số buổi tập trong ngày đó.
   * @return {Map<string, { date: Date; count: number }>}
   */
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

  /**
   * @description Tạo danh sách 21 ngày (7 ngày trước, ngày hiện tại và 13 ngày sau)
   * tính từ ngày đang được chọn, dùng để hiển thị thanh trượt ngày nằm ngang.
   * @return {DayOption[]} Mảng các đối tượng ngày bao gồm nhãn, thứ trong tuần và số buổi tập.
   */
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

  /**
   * @description Lọc và sắp xếp các buổi tập theo ngày đang được chọn (mới nhất trước).
   * @return {Session[]} Mảng các buổi tập thuộc ngày đang chọn.
   */
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
      {/* Header matched to Patient Details */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Sessions</AppText>
        <View style={styles.badge}>
          <AppText variant="labelMd" style={{ color: colors.primary }}>
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
          
          <View style={styles.timelineHeader}>
            <View>
              <AppText variant="labelMd" style={styles.timelineMonth}>
                {selectedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.calendarIconBtn}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
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
                  <AppText variant="labelSm" style={[styles.dayWeekday, active && styles.dayTextActive]}>
                    {day.weekday}
                  </AppText>
                  <AppText variant="headlineMd" style={[styles.dayLabel, active && styles.dayTextActive]}>
                    {day.date!.getDate()}
                  </AppText>
                  {hasSessions && <View style={[styles.sessionDot, active && styles.sessionDotActive]} />}
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
                  <View style={styles.sessionIconWrapper}>
                     <Ionicons name="pulse-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="headlineMd" style={styles.sessionTitle}>
                      {date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </AppText>
                    <AppText variant="bodySm" style={styles.sessionTime}>
                      {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </AppText>
                    
                    {/* Styled like the badges in Patient Details */}
                    <View style={styles.sessionStatsRow}>
                      <View style={styles.statBadge}>
                        <AppText variant="labelMd" style={styles.statBadgeText}>{completed} exercises</AppText>
                      </View>
                      <View style={[styles.statBadge, {backgroundColor: colors.surfaceContainerLow}]}>
                        <AppText variant="labelMd" style={[styles.statBadgeText, {color: colors.primary}]}>{accuracy}% accuracy</AppText>
                      </View>
                      <View style={styles.statBadge}>
                        <AppText variant="labelMd" style={styles.statBadgeText}>{duration}</AppText>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.outlineVariant} />
              <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>
                No sessions recorded on this date.
              </AppText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Reusable Modal matched to Assign style */}
      <Modal visible={showDatePicker} animationType="fade" transparent onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <AppText variant="headlineMd" style={styles.calendarTitle}>
                {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </AppText>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeader}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <AppText key={`${day}-${index}`} variant="labelMd" style={styles.weekHeaderText}>{day}</AppText>
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
                    onPress={() => {
                       setSelectedDate(startOfDay(date));
                       setShowDatePicker(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <AppText variant="labelMd" style={[styles.calendarDayText, active && styles.calendarDayTextActive]}>
                      {date.getDate()}
                    </AppText>
                    {count > 0 && <View style={[styles.calendarSessionDot, active && { backgroundColor: colors.onPrimary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.calendarDoneBtn} onPress={() => setShowDatePicker(false)}>
              <AppText variant="labelMd" style={{ color: colors.onPrimary, fontWeight: "600" }}>Done</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter, paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, color: colors.onSurface, fontWeight: '600' },
  badge: {
    width: 40,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  
  timelineHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  timelineMonth: { color: colors.onSurfaceVariant, fontSize: 16 },
  calendarIconBtn: { padding: 8, backgroundColor: colors.surfaceContainerLow, borderRadius: 12 },
  
  daySlider: { gap: 12, paddingRight: spacing.gutter, paddingBottom: spacing.sm },
  timelineNode: {
    width: 60,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
  },
  timelineNodeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { color: colors.onSurface, fontSize: 18 },
  dayWeekday: { color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 4 },
  dayTextActive: { color: colors.onPrimary },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tertiary, marginTop: 6 },
  sessionDotActive: { backgroundColor: colors.onPrimary },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    marginTop: spacing.xs,
  },
  sessionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTitle: { color: colors.onSurface, fontSize: 16, marginBottom: 2, fontWeight: '600' },
  sessionTime: { color: colors.onSurfaceVariant, fontSize: 14 },
  
  sessionStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  statBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statBadgeText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(19, 29, 35, 0.5)", justifyContent: "center", padding: spacing.gutter },
  calendarSheet: {
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 24,
    padding: spacing.xl,
  },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  calendarTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '600' },
  weekHeader: { flexDirection: "row", marginBottom: spacing.md },
  weekHeaderText: { flex: 1, textAlign: "center", color: colors.outline, fontSize: 14 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: {
    width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center",
    borderRadius: 12, marginBottom: 8,
  },
  calendarDayActive: { backgroundColor: colors.primary },
  calendarDayText: { color: colors.onSurface, fontSize: 16 },
  calendarDayTextActive: { color: colors.onPrimary },
  calendarSessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tertiary, marginTop: 4 },
  calendarDoneBtn: {
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, marginTop: 16,
  },
});

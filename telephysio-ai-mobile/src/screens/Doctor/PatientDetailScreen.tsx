import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  getPatientSessions,
  getPatientAssignments,
  getPatientStats,
} from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { Session, Assignment } from '../../types';

type DoctorStackParamList = {
  PatientDetail: { patientId: string; patientName: string };
  AssignExercise: { patientId: string; patientName: string };
  DoctorFeedback: { patientId: string; patientName: string };
};

interface Props {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'PatientDetail'>;
  route: RouteProp<DoctorStackParamList, 'PatientDetail'>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PatientDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName } = route.params;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, avgScore: 0, currentStreak: 0 });
  const [weekData, setWeekData] = useState<{ day: string; score: number; done: boolean }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, a, st] = await Promise.all([
        getPatientSessions(patientId),
        getPatientAssignments(patientId),
        getPatientStats(patientId),
      ]);
      setSessions(s);
      setAssignments(a);
      setStats(st);
      buildWeekData(s);
    } catch (e) {
      console.error('Patient detail load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [patientId]);

  const buildWeekData = (sessions: Session[]) => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const daySessions = sessions.filter((s) => {
        const sd = new Date(s.createdAt);
        sd.setHours(0, 0, 0, 0);
        return sd.getTime() === d.getTime();
      });
      const avgScore = daySessions.length > 0
        ? Math.round(daySessions.reduce((a, s) => a + s.score, 0) / daySessions.length)
        : 0;
      data.push({ day: DAYS[d.getDay()], score: avgScore, done: daySessions.length > 0 });
    }
    setWeekData(data);
  };

  useEffect(() => { loadData(); }, [loadData]);

  const maxScore = Math.max(...weekData.map((d) => d.score), 1);
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
      >
        {/* Patient header */}
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{patientName?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>{stats.totalSessions} sessions • {stats.currentStreak}-day streak</Text>
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AssignExercise', { patientId, patientName })}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Assign Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => navigation.navigate('DoctorFeedback', { patientId, patientName })}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionLabel, { color: colors.onPrimary }]}>Send Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Card style={styles.statsCard} padding="md">
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsRow}>
            {[
              { icon: '📋', value: stats.totalSessions, label: 'Total Sessions' },
              { icon: '⭐', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '--', label: 'Avg Score' },
              { icon: '🔥', value: stats.currentStreak, label: 'Day Streak' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Weekly chart */}
        <Card style={styles.chartCard} padding="md">
          <Text style={styles.sectionTitle}>7-Day Activity</Text>
          <View style={styles.barChart}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(d.score / maxScore) * 100}%`,
                        backgroundColor: d.done ? (d.score >= 80 ? colors.tertiary : colors.primary) : colors.surfaceContainerHighest,
                      },
                    ]}
                  />
                </View>
                {d.done && <Text style={styles.barScore}>{d.score}</Text>}
                <Text style={[styles.barDay, d.day === DAYS[new Date().getDay()] && { color: colors.primary, fontWeight: '700' }]}>
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Current assignments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Exercises ({assignments.length})</Text>
          {assignments.length === 0 ? (
            <Card padding="md" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No exercises assigned yet. Press "Assign Exercise" to get started.</Text>
            </Card>
          ) : (
            assignments.map((a, i) => (
              <Card key={i} style={styles.assignmentCard} padding="md">
                <Text style={styles.assignmentName}>{a.exerciseName}</Text>
                <Text style={styles.assignmentMeta}>{a.sets} sets × {a.targetReps} reps</Text>
              </Card>
            ))
          )}
        </View>

        {/* Recent sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <Card padding="md" style={styles.emptyCard}>
              <Text style={styles.emptyText}>This patient hasn't completed any sessions yet.</Text>
            </Card>
          ) : (
            sessions.slice(0, 5).map((s) => (
              <Card key={s.id} style={styles.sessionCard} padding="md">
                <View style={styles.sessionTop}>
                  <Text style={styles.sessionName}>{s.exerciseName}</Text>
                  <View style={[
                    styles.scoreChip,
                    { backgroundColor: s.score >= 80 ? colors.tertiaryFixed : colors.primaryFixed },
                  ]}>
                    <Text style={[
                      styles.scoreChipText,
                      { color: s.score >= 80 ? colors.tertiary : colors.primary },
                    ]}>
                      {s.score} pts
                    </Text>
                  </View>
                </View>
                <Text style={styles.sessionDate}>{formatDate(s.createdAt)}</Text>
                <Text style={styles.sessionMeta}>
                  {s.completedSets}/{s.targetSets} sets • {s.completedReps} reps • {Math.floor(s.duration / 60)}m {s.duration % 60}s
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.gutter, paddingBottom: spacing.xl, gap: spacing.lg },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  patientAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { fontSize: 24, fontWeight: '700', color: colors.secondary },
  patientInfo: { flex: 1 },
  patientName: { ...typography.headlineLg, color: colors.onSurface },
  patientSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1, borderColor: colors.outlineVariant,
    gap: spacing.xs,
  },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionIcon: { fontSize: 24 },
  actionLabel: { ...typography.labelMd, color: colors.onSurface },
  statsCard: { gap: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: spacing.xs },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.headlineLg, color: colors.primary },
  statLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  chartCard: { gap: spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', gap: 2 },
  barTrack: {
    flex: 1, width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.sm, overflow: 'hidden', justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: radius.sm, minHeight: 4 },
  barScore: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 9 },
  barDay: { ...typography.labelSm, color: colors.onSurfaceVariant },
  section: { gap: spacing.sm },
  emptyCard: { alignItems: 'center' },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  assignmentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assignmentName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600', flex: 1 },
  assignmentMeta: { ...typography.labelSm, color: colors.onSurfaceVariant },
  sessionCard: { gap: spacing.xs },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600', flex: 1 },
  scoreChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  scoreChipText: { ...typography.labelMd },
  sessionDate: { ...typography.labelSm, color: colors.onSurfaceVariant },
  sessionMeta: { ...typography.labelSm, color: colors.onSurfaceVariant },
});

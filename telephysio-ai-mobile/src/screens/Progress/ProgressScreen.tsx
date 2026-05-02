import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { getPatientSessions, getPatientStats } from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { Session } from '../../types';

const { width } = Dimensions.get('window');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ProgressScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, avgScore: 0, currentStreak: 0 });
  const [weekData, setWeekData] = useState<{ day: string; score: number; done: boolean }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [s, st] = await Promise.all([
        getPatientSessions(user.uid),
        getPatientStats(user.uid),
      ]);
      setSessions(s);
      setStats(st);
      buildWeekData(s);
    } catch (e) {
      console.error('Progress load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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
      data.push({
        day: DAYS[d.getDay()],
        score: avgScore,
        done: daySessions.length > 0,
      });
    }
    setWeekData(data);
  };

  useEffect(() => { loadData(); }, [loadData]);

  const maxBarScore = Math.max(...weekData.map((d) => d.score), 1);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.tertiary;
    if (score >= 65) return colors.primary;
    return colors.secondary;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Recovery Progress</Text>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '🔥', value: stats.currentStreak, label: 'Day Streak', color: '#e65100' },
            { icon: '📋', value: stats.totalSessions, label: 'Sessions', color: colors.primary },
            { icon: '⭐', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '--', label: 'Avg Score', color: colors.tertiary },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard} padding="md">
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Weekly bar chart */}
        <Card style={styles.chartCard} padding="md">
          <Text style={styles.sectionTitle}>7-Day Activity</Text>
          <View style={styles.barChart}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(d.score / maxBarScore) * 100}%`,
                        backgroundColor: d.done ? getScoreColor(d.score) : colors.surfaceContainerHighest,
                      },
                    ]}
                  />
                </View>
                {d.done && (
                  <Text style={styles.barScore}>{d.score}</Text>
                )}
                <Text style={[styles.barDay, d.day === DAYS[new Date().getDay()] && styles.barDayToday]}>
                  {d.day}
                </Text>
                {d.done && <View style={styles.barDot} />}
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            {[
              { color: colors.tertiary, label: '≥85 Excellent' },
              { color: colors.primary, label: '65–84 Good' },
              { color: colors.secondary, label: '<65 Needs work' },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Recovery Journey */}
        <Card style={styles.journeyCard} padding="md">
          <Text style={styles.sectionTitle}>🏔️ Recovery Journey</Text>
          <View style={styles.journeyTrack}>
            {[
              { label: 'First Steps', done: stats.totalSessions >= 1, icon: '🚩' },
              { label: '5 Sessions', done: stats.totalSessions >= 5, icon: '⭐' },
              { label: '10 Sessions', done: stats.totalSessions >= 10, icon: '🏅' },
              { label: '3-Day Streak', done: stats.currentStreak >= 3, icon: '🔥' },
              { label: '7-Day Streak', done: stats.currentStreak >= 7, icon: '💪' },
              { label: '80+ Avg Score', done: stats.avgScore >= 80, icon: '🎯' },
            ].map((milestone, i) => (
              <View key={i} style={styles.milestone}>
                <View style={[styles.milestoneIcon, !milestone.done && styles.milestoneLocked]}>
                  <Text style={{ fontSize: 16 }}>{milestone.done ? milestone.icon : '🔒'}</Text>
                </View>
                <Text style={[styles.milestoneLabel, !milestone.done && styles.milestoneLabelLocked]}>
                  {milestone.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Session history */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : sessions.length === 0 ? (
            <Card padding="lg" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No sessions yet.{'\n'}Complete your first exercise to get started!</Text>
            </Card>
          ) : (
            sessions.slice(0, 10).map((s) => (
              <Card key={s.id} style={styles.sessionCard} padding="md">
                <View style={styles.sessionTop}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{s.exerciseName}</Text>
                    <Text style={styles.sessionDate}>{formatDate(s.createdAt)}</Text>
                  </View>
                  <View style={[styles.scoreChip, { backgroundColor: `${getScoreColor(s.score)}20` }]}>
                    <Text style={[styles.scoreChipText, { color: getScoreColor(s.score) }]}>
                      {s.score}pts
                    </Text>
                  </View>
                </View>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionMetaText}>
                    {s.completedSets}/{s.targetSets} sets • {s.completedReps} reps • {Math.floor(s.duration / 60)}m {s.duration % 60}s
                  </Text>
                  <Badge
                    label={s.status === 'completed' ? 'Completed' : 'Incomplete'}
                    variant={s.status === 'completed' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
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
  scroll: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  pageTitle: { ...typography.headlineXl, color: colors.onSurface, paddingTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statIcon: { fontSize: 22 },
  statValue: { ...typography.headlineLg, textAlign: 'center' },
  statLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
  chartCard: { gap: spacing.md },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.sm,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 2 },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 4,
  },
  barScore: { ...typography.labelSm, color: colors.onSurfaceVariant, fontSize: 9 },
  barDay: { ...typography.labelSm, color: colors.onSurfaceVariant },
  barDayToday: { color: colors.primary, fontWeight: '700' },
  barDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  journeyCard: { gap: spacing.md },
  journeyTrack: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  milestone: {
    alignItems: 'center',
    gap: spacing.xs,
    width: (width - spacing.gutter * 2 - spacing.md * 2 - spacing.md * 4) / 3,
  },
  milestoneIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  milestoneLocked: {
    backgroundColor: colors.surfaceContainerHighest,
    borderColor: colors.outlineVariant,
  },
  milestoneLabel: { ...typography.labelSm, color: colors.onSurface, textAlign: 'center' },
  milestoneLabelLocked: { color: colors.onSurfaceVariant },
  historySection: { gap: spacing.sm },
  loadingText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 36, textAlign: 'center' },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  sessionCard: { gap: spacing.sm },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionInfo: { flex: 1, gap: 2 },
  sessionName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  sessionDate: { ...typography.labelSm, color: colors.onSurfaceVariant },
  scoreChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  scoreChipText: { ...typography.labelMd },
  sessionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionMetaText: { ...typography.labelSm, color: colors.onSurfaceVariant },
});

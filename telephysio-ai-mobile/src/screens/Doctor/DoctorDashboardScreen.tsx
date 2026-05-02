import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../services/auth';
import {
  getAllPatients,
  getPatientStats,
  getFeedbackFromUser,
} from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { AppUser } from '../../services/auth';

interface PatientRow extends AppUser {
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
  lastSession?: Date;
  pendingFeedback: number;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export const DoctorDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser } = useAuthStore();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const rawPatients = await getAllPatients();
      const enriched = await Promise.all(
        rawPatients.map(async (p) => {
          const [stats, feedback] = await Promise.all([
            getPatientStats(p.uid),
            getFeedbackFromUser(p.uid),
          ]);
          const pending = feedback.filter((f) => !f.reply).length;
          return { ...p, ...stats, pendingFeedback: pending };
        })
      );
      setPatients(enriched);
    } catch (e) {
      console.error('Doctor dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); setUser(null); } },
    ]);
  };

  const getActivityStatus = (p: PatientRow): { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' } => {
    if (!p.lastSession) return { label: 'No sessions', variant: 'neutral' };
    const daysSince = Math.floor((Date.now() - new Date(p.lastSession).getTime()) / 86400000);
    if (daysSince === 0) return { label: 'Today', variant: 'success' };
    if (daysSince <= 2) return { label: `${daysSince}d ago`, variant: 'warning' };
    return { label: `${daysSince}d ago`, variant: 'error' };
  };

  const totalPatients = patients.length;
  const activeToday = patients.filter((p) => {
    if (!p.lastSession) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(p.lastSession).setHours(0,0,0,0) === today.getTime();
  }).length;
  const pendingTotal = patients.reduce((acc, p) => acc + p.pendingFeedback, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.doctorName}>
                  Dr. {user?.name?.split(' ').pop() ?? 'Doctor'} 👨‍⚕️
                </Text>
              </View>
              <TouchableOpacity style={styles.avatarBtn} onPress={handleLogout}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'D'}</Text>
              </TouchableOpacity>
            </View>

            {/* Summary cards */}
            <View style={styles.summaryRow}>
              {[
                { value: totalPatients, label: 'Patients', icon: '👥', color: colors.primary },
                { value: activeToday, label: 'Active Today', icon: '✅', color: colors.tertiary },
                { value: pendingTotal, label: 'Pending Feedback', icon: '💬', color: pendingTotal > 0 ? colors.error : colors.secondary },
              ].map((s) => (
                <Card key={s.label} style={styles.summaryCard} padding="md">
                  <Text style={styles.summaryIcon}>{s.icon}</Text>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </Card>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Patient List</Text>
          </View>
        }
        renderItem={({ item: p }) => {
          const status = getActivityStatus(p);
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('PatientDetail', { patientId: p.uid, patientName: p.name })}
              activeOpacity={0.8}
            >
              <Card style={styles.patientCard} padding="md">
                <View style={styles.patientTop}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{p.name?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{p.name}</Text>
                    <Text style={styles.patientEmail} numberOfLines={1}>{p.email}</Text>
                  </View>
                  <View style={styles.patientRight}>
                    <Badge label={status.label} variant={status.variant} size="sm" />
                    {p.pendingFeedback > 0 && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>{p.pendingFeedback} pending</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.patientStats}>
                  {[
                    { label: 'Sessions', value: p.totalSessions },
                    { label: 'Avg Score', value: p.avgScore > 0 ? `${p.avgScore}%` : '--' },
                    { label: 'Streak', value: p.currentStreak },
                  ].map((stat) => (
                    <View key={stat.label} style={styles.patientStat}>
                      <Text style={styles.patientStatValue}>{stat.value}</Text>
                      <Text style={styles.patientStatLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.patientActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AssignExercise', { patientId: p.uid, patientName: p.name })}
                  >
                    <Text style={styles.actionBtnText}>📋 Assign</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => navigation.navigate('DoctorFeedback', { patientId: p.uid, patientName: p.name })}
                  >
                    <Text style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>💬 Feedback</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Card padding="xl" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No patients yet</Text>
              <Text style={styles.emptyText}>
                Patients need to register and link their account to you.
              </Text>
            </Card>
          ) : (
            <Card padding="xl" style={styles.emptyCard}>
              <Text style={styles.loadingText}>Loading patient list...</Text>
            </Card>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.gutter, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm },
  greeting: { ...typography.bodySm, color: colors.onSurfaceVariant },
  doctorName: { ...typography.headlineLg, color: colors.onSurface },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.headlineMd, color: colors.onPrimary, fontSize: 18 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  summaryIcon: { fontSize: 20 },
  summaryValue: { ...typography.headlineLg, textAlign: 'center' },
  summaryLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  patientCard: { gap: spacing.md },
  patientTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  patientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { ...typography.headlineMd, color: colors.secondary },
  patientInfo: { flex: 1, gap: 2 },
  patientName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  patientEmail: { ...typography.labelSm, color: colors.onSurfaceVariant },
  patientRight: { alignItems: 'flex-end', gap: spacing.xs },
  pendingBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
  },
  pendingBadgeText: { ...typography.labelSm, color: colors.onErrorContainer },
  patientStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  patientStat: { flex: 1, alignItems: 'center', gap: 2 },
  patientStatValue: { ...typography.headlineMd, color: colors.onSurface },
  patientStatLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  patientActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnText: { ...typography.labelMd, color: colors.onSurface },
  actionBtnPrimaryText: { color: colors.onPrimary },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 48, textAlign: 'center' },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  loadingText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});

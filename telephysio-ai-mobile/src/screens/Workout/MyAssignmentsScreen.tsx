import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { getPatientAssignments, getUser } from '../../services/firebase';
import type { Assignment, ExerciseDifficulty } from '../../services/firebase/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  active: { label: 'Active', color: '#0369a1', bg: '#e0f2fe', icon: 'play-circle-outline' },
  completed: { label: 'Completed', color: '#166534', bg: '#dcfce7', icon: 'checkmark-circle-outline' },
  paused: { label: 'Paused', color: '#b45309', bg: '#fef3c7', icon: 'pause-circle-outline' },
};

export const MyAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<(Assignment & { doctorName?: string; dateString?: string })[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        // Fetch all assignments (active + completed)
        const [active, completed] = await Promise.all([
          getPatientAssignments(uid, 'active'),
          getPatientAssignments(uid, 'completed'),
        ]);
        const all = [...active, ...completed];

        // Fetch doctor names
        const doctorIds = [...new Set(all.map(a => a.doctorId).filter(Boolean))];
        const doctorMap = new Map<string, string>();
        await Promise.all(
          doctorIds.map(async (docId) => {
            const doctor = await getUser(docId);
            if (doctor) doctorMap.set(docId, doctor.displayName || 'Doctor');
          })
        );

        const mapped = all.map(a => {
          const date = a.assignedAt as any;
          return {
            ...a,
            doctorName: doctorMap.get(a.doctorId) || 'Doctor',
            dateString: date?.toDate ? date.toDate().toLocaleDateString() : 'Unknown date',
          };
        });

        setAssignments(mapped);
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const activeAssignments = assignments.filter(a => a.status === 'active');
  const completedAssignments = assignments.filter(a => a.status === 'completed' || a.status === 'paused');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>My Assignments</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {assignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
            <AppText variant="headlineMd" style={{ color: '#64748b', marginTop: spacing.md }}>No Assignments Yet</AppText>
            <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
              Your doctor will assign exercise plans for you. Check back later.
            </AppText>
          </View>
        ) : (
          <>
            {/* Active Assignments */}
            {activeAssignments.length > 0 && (
              <>
                <AppText variant="labelMd" style={styles.sectionLabel}>ACTIVE</AppText>
                {activeAssignments.map((assignment) => {
                  const statusCfg = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.active;
                  return (
                    <View key={assignment.id} style={styles.card}>
                      <View style={styles.cardTop}>
                        <View style={[styles.statusIcon, { backgroundColor: statusCfg.bg }]}>
                          <Ionicons name={statusCfg.icon as any} size={20} color={statusCfg.color} />
                        </View>
                        <View style={styles.cardInfo}>
                          <AppText variant="headlineMd" style={styles.cardName}>{assignment.templateName}</AppText>
                          <AppText variant="bodySm" style={styles.cardMeta}>
                            {assignment.doctorName} {assignment.dateString ? `- ${assignment.dateString}` : ''}
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.cardStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="barbell-outline" size={14} color="#64748b" />
                          <AppText variant="bodySm" style={styles.statText}>{assignment.exercises.length} exercises</AppText>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="time-outline" size={14} color="#64748b" />
                          <AppText variant="bodySm" style={styles.statText}>{assignment.totalDuration}</AppText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                          <AppText variant="labelSm" style={{ color: statusCfg.color, fontSize: 10, fontWeight: '700' }}>{statusCfg.label}</AppText>
                        </View>
                      </View>

                      {/* Exercise List Preview */}
                      <View style={styles.exerciseList}>
                        {assignment.exercises.slice(0, 3).map((ex, i) => (
                          <View key={ex.id || i.toString()} style={styles.exerciseRow}>
                            <View style={[styles.exerciseDot, { backgroundColor: ex.color || colors.primary }]} />
                            <AppText variant="bodySm" style={styles.exerciseName}>{ex.name}</AppText>
                            <AppText variant="bodySm" style={styles.exerciseSets}>{ex.sets}x{ex.reps}</AppText>
                          </View>
                        ))}
                        {assignment.exercises.length > 3 && (
                          <AppText variant="bodySm" style={styles.moreExercises}>
                            +{assignment.exercises.length - 3} more exercises
                          </AppText>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Completed Assignments */}
            {completedAssignments.length > 0 && (
              <>
                <AppText variant="labelMd" style={styles.sectionLabel}>COMPLETED</AppText>
                {completedAssignments.map((assignment) => {
                  const statusCfg = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.completed;
                  return (
                    <View key={assignment.id} style={[styles.card, styles.completedCard]}>
                      <View style={styles.cardTop}>
                        <View style={[styles.statusIcon, { backgroundColor: statusCfg.bg }]}>
                          <Ionicons name={statusCfg.icon as any} size={20} color={statusCfg.color} />
                        </View>
                        <View style={styles.cardInfo}>
                          <AppText variant="headlineMd" style={[styles.cardName, { color: '#64748b' }]}>{assignment.templateName}</AppText>
                          <AppText variant="bodySm" style={styles.cardMeta}>
                            {assignment.doctorName} {assignment.dateString ? `- ${assignment.dateString}` : ''}
                          </AppText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                          <AppText variant="labelSm" style={{ color: statusCfg.color, fontSize: 10, fontWeight: '700' }}>{statusCfg.label}</AppText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },

  sectionLabel: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  completedCard: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  cardMeta: { color: '#64748b', marginTop: 2 },

  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#64748b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginLeft: 'auto' },

  exerciseList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: spacing.md,
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exerciseName: { flex: 1, color: '#475569' },
  exerciseSets: { color: '#94a3b8', fontSize: 12 },
  moreExercises: { color: colors.primary, fontWeight: '600', marginTop: 4 },
});

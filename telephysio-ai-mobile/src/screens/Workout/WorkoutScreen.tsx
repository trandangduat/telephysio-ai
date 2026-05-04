import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList, BottomTabParamList } from '../../navigation/types';
import { getPatientAssignments, getUser } from '../../services/firebase';
import type { Assignment, Exercise, ExerciseDifficulty } from '../../services/firebase/types';

type WorkoutNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Workout'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: WorkoutNavProp;
}

const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: '#166534', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#b45309', bg: '#fef3c7' },
  hard: { label: 'Hard', color: '#991b1b', bg: '#fef2f2' },
};

export const WorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const assignments = await getPatientAssignments(uid, 'active');
        if (assignments.length > 0) {
          const active = assignments[0];
          setAssignment(active);
          // Fetch doctor name
          if (active.doctorId) {
            const doctor = await getUser(active.doctorId);
            setDoctorName(doctor?.displayName || 'Your doctor');
          }
        }
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

  const exercises = assignment?.exercises || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DoctorChat' as any)}>
            <Ionicons name="chatbubbles-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile' as any)}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineLg" style={styles.title}>
            {t('workout.title', 'Today\'s Routine')}
          </AppText>
          <AppText variant="bodyMd" style={styles.subtitle}>
            {t('workout.subtitle', 'Complete these exercises to reach your daily goal.')}
          </AppText>
        </View>

        {/* Assignment Info Card */}
        {assignment ? (
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
              <AppText variant="labelMd" style={styles.assignmentLabel}>ACTIVE PLAN</AppText>
            </View>
            <AppText variant="headlineMd" style={styles.assignmentName}>{assignment.templateName}</AppText>
            <View style={styles.assignmentMeta}>
              {doctorName ? (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.metaText}>Assigned by {doctorName}</AppText>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Ionicons name="barbell-outline" size={14} color="#64748b" />
                <AppText variant="bodySm" style={styles.metaText}>{exercises.length} exercises</AppText>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#64748b" />
                <AppText variant="bodySm" style={styles.metaText}>{assignment.totalDuration}</AppText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={40} color="#cbd5e1" />
            <AppText variant="bodyMd" style={{ color: '#64748b', marginTop: spacing.sm }}>
              No exercises assigned for today.
            </AppText>
            <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 4 }}>
              Great job resting! Check back later for new assignments.
            </AppText>
          </View>
        )}

        {/* Exercise Cards */}
        {exercises.map((ex, index) => {
          const diffConfig = ex.difficulty ? DIFFICULTY_CONFIG[ex.difficulty] : null;
          return (
            <View key={ex.id || index.toString()} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseIcon, { backgroundColor: (ex.color || colors.primary) + '1A' }]}>
                  <Ionicons name={(ex.icon || 'barbell-outline') as any} size={24} color={ex.color || colors.primary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNameRow}>
                    <AppText variant="headlineMd" style={styles.exerciseName}>{ex.name}</AppText>
                    {diffConfig && (
                      <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg }]}>
                        <AppText variant="labelSm" style={[styles.diffText, { color: diffConfig.color }]}>{diffConfig.label}</AppText>
                      </View>
                    )}
                  </View>
                  <AppText variant="bodySm" style={styles.exerciseDetails}>
                    {ex.sets} Sets x {ex.reps} Reps {ex.duration ? `(${ex.duration})` : ''}
                  </AppText>
                  {ex.restBetweenSets ? (
                    <AppText variant="bodySm" style={styles.exerciseRest}>
                      Rest: {ex.restBetweenSets}s between sets
                    </AppText>
                  ) : null}
                  {ex.notes ? (
                    <View style={styles.notesRow}>
                      <Ionicons name="document-text-outline" size={12} color="#64748b" />
                      <AppText variant="bodySm" style={styles.exerciseNotes}>{ex.notes}</AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Calibration')}
              >
                <Ionicons name="play" size={16} color="#fff" style={{ marginRight: 6 }} />
                <AppText variant="labelMd" style={{ color: '#fff' }}>Start Exercise</AppText>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* View All Assignments Button */}
        {assignment && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('MyAssignments')}
          >
            <AppText variant="labelMd" style={{ color: colors.primary }}>View All Assignments</AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { color: '#0f172a', fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  // Assignment Info Card
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  assignmentLabel: { color: colors.primary, fontWeight: '700', letterSpacing: 0.8, fontSize: 11 },
  assignmentName: { color: '#0f172a', fontWeight: '700', fontSize: 20, marginBottom: spacing.md },
  assignmentMeta: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#64748b' },

  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  exerciseIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  exerciseName: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '600' },
  exerciseDetails: { color: '#64748b', marginTop: 4 },
  exerciseRest: { color: '#94a3b8', marginTop: 2, fontSize: 12 },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6 },
  exerciseNotes: { color: '#64748b', fontSize: 12, flex: 1, fontStyle: 'italic' },
  startButton: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },

  // View All Button
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
});

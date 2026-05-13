import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, AppButton } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getPatientAssignments, 
  getIncompleteSession, 
  deleteIncompleteSession,
  recordSession,
  completeAssignment
} from '../../services/firebase';
import type { Assignment, IncompleteSession } from '../../services/firebase/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSummary'>;

export const WorkoutSummaryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assignmentId } = route.params;
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(true); // Auto-save on mount
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [incSession, setIncSession] = useState<IncompleteSession | null>(null);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    async function processSummary() {
      if (!uid) return;
      try {
        const assignments = await getPatientAssignments(uid, 'active');
        const active = assignments.find((a) => a.id === assignmentId);
        
        const sessionData = await getIncompleteSession(uid, assignmentId);
        
        if (active && sessionData) {
          setAssignment(active);
          setIncSession(sessionData);

          // Calculate stats
          const exercisesData = sessionData.completedExercisesData;
          let totalAcc = 0;
          let totalSecs = 0;
          let totalReps = 0;
          let totalSets = 0;
          
          exercisesData.forEach(d => {
            totalAcc += d.accuracy;
            totalSecs += d.durationSeconds;
            totalReps += d.reps;
            totalSets += d.sets;
          });
          
          const avgAcc = exercisesData.length > 0 ? Math.round(totalAcc / exercisesData.length) : 0;
          
          setOverallAccuracy(avgAcc);
          setTotalTime(totalSecs);

          // Save final session
          await recordSession({
            patientId: uid,
            assignmentId: active.id,
            exercisesCompleted: exercisesData.length,
            accuracy: avgAcc,
            durationSeconds: totalSecs,
            duration: `${Math.floor(totalSecs / 60)} min`,
            painLevel: 2, // Mock value
            reps: totalReps,
            sets: totalSets,
            completedExercisesData: exercisesData.map((d, i) => ({
              name: active.exercises[i]?.name || 'Exercise',
              accuracy: d.accuracy,
              reps: d.reps,
              sets: d.sets,
              durationSeconds: d.durationSeconds,
              icon: active.exercises[i]?.icon,
              color: active.exercises[i]?.color,
            }))
          });

          // Complete assignment
          await completeAssignment(active.id);

          // Clear incomplete session
          await deleteIncompleteSession(sessionData.id);
        }
      } catch (error) {
        console.error('Error processing workout summary', error);
      } finally {
        setLoading(false);
        setSaving(false);
      }
    }
    
    processSummary();
  }, [uid, assignmentId]);

  const handleDone = () => {
    navigation.replace('MainTabs');
  };

  if (loading || saving) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="bodyMd" style={{ marginTop: 16, color: '#64748b' }}>
          Saving your workout...
        </AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.trophyIcon}>
            <Ionicons name="trophy" size={48} color="#eab308" />
          </View>
          <AppText variant="headlineXl" style={styles.title}>Workout Complete!</AppText>
          <AppText variant="bodyMd" style={styles.subtitle}>Great job finishing your assigned routine.</AppText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <AppText variant="labelMd" style={styles.statLabel}>OVERALL ACCURACY</AppText>
            <AppText variant="headlineLg" style={{ color: colors.primary }}>{overallAccuracy}%</AppText>
          </View>
          
          <View style={styles.statCard}>
            <AppText variant="labelMd" style={styles.statLabel}>TOTAL TIME</AppText>
            <AppText variant="headlineLg" style={{ color: '#0f172a' }}>
              {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
            </AppText>
          </View>
        </View>
        
        <View style={styles.exercisesList}>
          <AppText variant="labelMd" style={styles.listTitle}>EXERCISES COMPLETED</AppText>
          {assignment?.exercises.map((ex, i) => {
            const data = incSession?.completedExercisesData[i];
            return (
              <View key={i} style={styles.exerciseRow}>
                <View 
                  style={[
                    styles.exIcon, 
                    { 
                      width: 40, 
                      height: 40, 
                      borderRadius: 12, 
                      backgroundColor: (ex.color || colors.primary) + '1A',
                      marginRight: spacing.md,
                      marginTop: 0
                    }
                  ]}
                >
                  <Ionicons 
                    name={(ex.icon || 'barbell-outline') as any} 
                    size={20} 
                    color={ex.color || colors.primary} 
                  />
                </View>
                <View style={styles.exInfo}>
                  <AppText variant="bodyMd" style={styles.exName}>{ex.name}</AppText>
                  {data && (
                    <>
                      <AppText variant="labelSm" style={styles.exDetail}>
                        {data.sets} Sets • {data.reps} Reps • {data.accuracy}% Accuracy • {Math.floor(data.durationSeconds / 60)}:{(data.durationSeconds % 60).toString().padStart(2, '0')}
                      </AppText>

                      {/* Horizontal set videos list */}
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.thumbScroll}
                        contentContainerStyle={styles.thumbScrollContent}
                      >
                        {Array.from({ length: data.sets }).map((_, setIdx) => (
                          <View key={setIdx} style={styles.thumbVideoBox}>
                            <View style={styles.thumbVideoPlaceholder}>
                              <Ionicons name="play-circle" size={20} color="#ffffff" />
                            </View>
                            <AppText variant="labelSm" style={styles.thumbSetLabel}>
                              Set {setIdx + 1}
                            </AppText>
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>
                {/* Checked icon on right */}
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" style={{ alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm }} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton 
          label="Home"
          size="lg"
          onPress={handleDone}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.gutter, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginVertical: spacing.xl },
  trophyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef9c3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: '#0f172a', fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: { color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  
  exercisesList: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listTitle: { color: '#64748b', marginBottom: spacing.md, letterSpacing: 0.5 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  exIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exInfo: { flex: 1 },
  exName: { color: '#0f172a', fontWeight: '600' },
  exDetail: { color: '#64748b', marginTop: 2, marginBottom: spacing.sm },
  
  // Thumbnails Horizontal Row
  thumbScroll: {
    marginTop: spacing.xs,
  },
  thumbScrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  thumbVideoBox: {
    width: 76,
    alignItems: 'center',
    gap: 4,
  },
  thumbVideoPlaceholder: {
    width: 76,
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbSetLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  
  footer: {
    padding: spacing.gutter,
    paddingBottom: spacing.xl,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});

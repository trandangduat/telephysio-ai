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
import { getPatientAssignments, getUser, getIncompleteSession, getPatientSessions } from '../../services/firebase';
import type { Assignment, Exercise, ExerciseDifficulty, IncompleteSession, Session } from '../../services/firebase/types';

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
  const [incompleteSession, setIncompleteSession] = useState<IncompleteSession | null>(null);
  const [todaySession, setTodaySession] = useState<Session | null>(null);

  // Date setup for weekly schedule
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

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
          // Fetch incomplete session
          const incSession = await getIncompleteSession(uid, active.id);
          setIncompleteSession(incSession);
        } else {
          // Fetch latest completed sessions to see if they finished one today
          const sessions = await getPatientSessions(uid, 1);
          if (sessions.length > 0) {
            const latest = sessions[0];
            if (latest.date) {
              const d = (latest.date as any).toDate ? (latest.date as any).toDate() : new Date(latest.date as any);
              const today = new Date();
              const isToday = d.getDate() === today.getDate() &&
                              d.getMonth() === today.getMonth() &&
                              d.getFullYear() === today.getFullYear();
              if (isToday) {
                setTodaySession(latest);
              }
            }
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
  const currentIndex = incompleteSession ? incompleteSession.currentExerciseIndex : 0;

  const handleNavigateToDetail = () => {
    if (!assignment) return;
    navigation.navigate('WorkoutDetail', {
      assignmentId: assignment.id,
    });
  };

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
            {selectedDayIndex === todayIndex ? t('workout.title', "Today's Routine") : `${daysOfWeek[selectedDayIndex]}'s Schedule`}
          </AppText>
          <AppText variant="bodyMd" style={styles.subtitle}>
            {selectedDayIndex === todayIndex 
              ? t('workout.subtitle', 'Complete these exercises to reach your daily goal.') 
              : 'Check your exercises scheduled for this week.'}
          </AppText>
        </View>

        {/* Weekly Schedule Horizontal Strip */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarRow}>
            {daysOfWeek.map((day, index) => {
              const isToday = index === todayIndex;
              const isSelected = index === selectedDayIndex;
              // Mock completion for Monday for demo purposes, other days pending
              const isCompleted = index === 0; 
              
              return (
                <TouchableOpacity 
                  key={day} 
                  activeOpacity={0.7}
                  style={[
                    styles.dayPill, 
                    isSelected && styles.dayPillSelected,
                    isToday && !isSelected && styles.dayPillToday
                  ]}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <AppText 
                    variant="labelSm" 
                    style={[
                      styles.dayLabel, 
                      isSelected && styles.dayLabelSelected,
                      isToday && !isSelected && { color: colors.primary }
                    ]}
                  >
                    {day}
                  </AppText>
                  
                  <View style={styles.dayDotContainer}>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={14} color={isSelected ? "#fff" : "#16a34a"} />
                    ) : isToday ? (
                      <Ionicons name="ellipse" size={8} color={isSelected ? "#fff" : colors.primary} />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dynamic Page Content based on Selection */}
        {selectedDayIndex === todayIndex ? (
          <>
            {/* Today's Assignment Info Card */}
            {assignment ? (
              <View style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
                  <AppText variant="labelMd" style={styles.assignmentLabel}>ACTIVE PLAN</AppText>
                </View>
                <AppText variant="headlineMd" style={styles.assignmentName}>{assignment.templateName}</AppText>
                
                <View style={styles.assignmentMetaRow}>
                  {doctorName ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="person-outline" size={12} color="#64748b" />
                      <AppText variant="bodySm" style={styles.metaText}>{doctorName}</AppText>
                    </View>
                  ) : null}
                  <View style={styles.metaChip}>
                    <Ionicons name="barbell-outline" size={12} color="#64748b" />
                    <AppText variant="bodySm" style={styles.metaText}>{exercises.length} exercises</AppText>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={12} color="#64748b" />
                    <AppText variant="bodySm" style={styles.metaText}>{assignment.totalDuration}</AppText>
                  </View>
                </View>

                {/* Start/Action Button Inside Card */}
                <TouchableOpacity
                  style={styles.cardStartButton}
                  onPress={handleNavigateToDetail}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={incompleteSession ? "play-forward" : "play"}
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>
                    {incompleteSession 
                      ? t('workout.continueWorkout', 'Continue Session')
                      : t('workout.startSession', 'Start Session')
                    }
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : todaySession ? (
              /* Today's Workout Complete Case */
              <View style={styles.pastDayCard}>
                <View style={styles.pastDayHeader}>
                  <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                  <AppText variant="headlineMd" style={{ color: '#0f172a', marginTop: spacing.sm }}>Today's Workout Done!</AppText>
                  <AppText variant="bodySm" style={{ color: '#64748b' }}>You have successfully completed your daily program.</AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.pastDayStats}>
                  <View style={styles.statBox}>
                    <AppText variant="headlineMd" style={{ color: colors.primary }}>
                      {Math.floor(todaySession.durationSeconds / 60)} min
                    </AppText>
                    <AppText variant="labelSm" style={{ color: '#64748b' }}>Duration</AppText>
                  </View>
                  <View style={styles.statBox}>
                    <AppText variant="headlineMd" style={{ color: colors.primary }}>{todaySession.accuracy}%</AppText>
                    <AppText variant="labelSm" style={{ color: '#64748b' }}>Accuracy</AppText>
                  </View>
                  <View style={styles.statBox}>
                    <AppText variant="headlineMd" style={{ color: colors.primary }}>{todaySession.exercisesCompleted}</AppText>
                    <AppText variant="labelSm" style={{ color: '#64748b' }}>Exercises</AppText>
                  </View>
                </View>

                {todaySession.completedExercisesData && todaySession.completedExercisesData.length > 0 ? (
                  <>
                    <View style={styles.divider} />
                    <AppText variant="labelSm" style={{ color: '#64748b', marginBottom: spacing.md, fontWeight: '700', letterSpacing: 0.5 }}>
                      EXERCISES COMPLETED
                    </AppText>
                    
                    {todaySession.completedExercisesData.map((ex, i) => (
                      <View key={i} style={styles.mockSummaryRow}>
                        <View style={[styles.mockSummaryIcon, { backgroundColor: (ex.color || colors.primary) + '1A' }]}>
                          <Ionicons name={(ex.icon || 'barbell-outline') as any} size={18} color={ex.color || colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMd" style={{ fontWeight: '600', color: '#0f172a' }}>{ex.name}</AppText>
                          <AppText variant="labelSm" style={{ color: '#64748b', marginTop: 2, marginBottom: spacing.xs }}>
                            {ex.sets} Sets • {ex.reps} Reps • {ex.accuracy}% Accuracy • {Math.floor(ex.durationSeconds / 60)}:{(ex.durationSeconds % 60).toString().padStart(2, '0')}
                          </AppText>
                          
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                            {Array.from({ length: ex.sets }).map((_, setIdx) => (
                              <View key={setIdx} style={styles.mockThumbBox}>
                                <View style={styles.mockThumbVideo}>
                                  <Ionicons name="play-circle" size={16} color="#fff" />
                                </View>
                                <AppText style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 2 }}>Set {setIdx + 1}</AppText>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                        {/* Checked icon on right */}
                        <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm }} />
                      </View>
                    ))}
                  </>
                ) : null}

                <View style={{ height: spacing.sm }} />
                <AppText variant="bodySm" style={{ color: '#16a34a', textAlign: 'center', fontWeight: '700' }}>
                  💪 Keep up the momentum for consistent recovery!
                </AppText>
              </View>
            ) : (
              /* Rest Day / No workout Scheduled */
              <View style={styles.emptyCard}>
                <Ionicons name="clipboard-outline" size={40} color="#cbd5e1" />
                <AppText variant="headlineMd" style={{ color: '#64748b', marginTop: spacing.md }}>
                  No Assignment
                </AppText>
                <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                  You have no workout scheduled for today.
                </AppText>
              </View>
            )}
          </>
        ) : selectedDayIndex === 0 ? (
          /* Mock Completed Past Day (Monday) */
          <View style={styles.pastDayCard}>
            <View style={styles.pastDayHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
              <AppText variant="headlineMd" style={{ color: '#0f172a', marginTop: spacing.sm }}>Workout Completed</AppText>
              <AppText variant="bodySm" style={{ color: '#64748b' }}>Monday, May 11</AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.pastDayStats}>
              <View style={styles.statBox}>
                <AppText variant="headlineMd" style={{ color: colors.primary }}>15 min</AppText>
                <AppText variant="labelSm" style={{ color: '#64748b' }}>Duration</AppText>
              </View>
              <View style={styles.statBox}>
                <AppText variant="headlineMd" style={{ color: colors.primary }}>85%</AppText>
                <AppText variant="labelSm" style={{ color: '#64748b' }}>Accuracy</AppText>
              </View>
              <View style={styles.statBox}>
                <AppText variant="headlineMd" style={{ color: colors.primary }}>2</AppText>
                <AppText variant="labelSm" style={{ color: '#64748b' }}>Exercises</AppText>
              </View>
            </View>

            <View style={styles.divider} />
            
            {/* Detailed Summary Mock for Monday Past Workout */}
            <AppText variant="labelSm" style={{ color: '#64748b', marginBottom: spacing.md, fontWeight: '700', letterSpacing: 0.5 }}>
              EXERCISES COMPLETED
            </AppText>
            
            {[{ name: 'Shoulder Flexion', sets: 2, reps: 10, acc: 88, icon: 'body-outline', color: '#2563eb' }, { name: 'Wall Slides', sets: 3, reps: 12, acc: 82, icon: 'barbell-outline', color: '#0f766e' }].map((ex, i) => (
              <View key={i} style={styles.mockSummaryRow}>
                <View style={[styles.mockSummaryIcon, { backgroundColor: ex.color + '1A' }]}>
                  <Ionicons name={ex.icon as any} size={18} color={ex.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" style={{ fontWeight: '600', color: '#0f172a' }}>{ex.name}</AppText>
                  <AppText variant="labelSm" style={{ color: '#64748b', marginTop: 2, marginBottom: spacing.xs }}>
                    {ex.sets} Sets • {ex.reps} Reps • {ex.acc}% Accuracy • {i === 0 ? "06:15" : "08:45"}
                  </AppText>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                    {Array.from({ length: ex.sets }).map((_, setIdx) => (
                      <View key={setIdx} style={styles.mockThumbBox}>
                        <View style={styles.mockThumbVideo}>
                          <Ionicons name="play-circle" size={16} color="#fff" />
                        </View>
                        <AppText style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 2 }}>Set {setIdx + 1}</AppText>
                      </View>
                    ))}
                  </ScrollView>
                </View>
                {/* Checked icon on right */}
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm }} />
              </View>
            ))}

          </View>
        ) : selectedDayIndex === 4 ? (
          /* Mock Future Workout (Friday) - VIEW ONLY */
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
              <AppText variant="labelMd" style={[styles.assignmentLabel, { color: '#64748b' }]}>UPCOMING PLAN (VIEW ONLY)</AppText>
            </View>
            <AppText variant="headlineMd" style={styles.assignmentName}>Shoulder Rehab Phase 2</AppText>
            
            <View style={styles.assignmentMetaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="barbell-outline" size={12} color="#64748b" />
                <AppText variant="bodySm" style={styles.metaText}>3 exercises</AppText>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <AppText variant="bodySm" style={styles.metaText}>20 min</AppText>
              </View>
            </View>

            <View style={{ marginTop: spacing.xs, gap: spacing.sm }}>
              {['Scapular Squeeze', 'External Rotation', 'Arm Raises'].map((name, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.8 }}>
                  <Ionicons name="ellipse" size={6} color="#94a3b8" />
                  <AppText variant="bodyMd" style={{ color: '#475569' }}>{name}</AppText>
                </View>
              ))}
            </View>

            <View style={[styles.cardStartButton, { backgroundColor: '#e2e8f0', shadowOpacity: 0, elevation: 0, marginTop: spacing.lg }]}>
              <Ionicons name="lock-closed" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <AppText variant="labelMd" style={{ color: '#94a3b8', fontWeight: '700' }}>
                Locked Until Friday
              </AppText>
            </View>
          </View>
        ) : (
          /* Future / Pending Schedule Mock */
          <View style={styles.futureDayCard}>
            <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
            <AppText variant="headlineMd" style={{ color: '#475569', marginTop: spacing.md }}>
              No Assignment
            </AppText>
            <AppText variant="bodySm" style={{ color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              You have no workout scheduled for this day.
            </AppText>
          </View>
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
  assignmentName: { color: '#0f172a', fontWeight: '700', fontSize: 22, marginBottom: spacing.md },
  assignmentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    gap: 6,
  },
  cardStartButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.sm,
  },
  detailsHeaderLabel: {
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 11,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
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
  exerciseNotes: { color: '#64748b', fontSize: 12, flex: 1, fontStyle: 'italic' },
  notesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  activeExerciseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryContainer, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, alignSelf: 'flex-start', marginTop: spacing.md },
  completedExerciseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, alignSelf: 'flex-start', marginTop: spacing.md },

  // Sticky Bottom Button
  stickyBottom: {
    padding: spacing.gutter,
    paddingBottom: spacing.xl,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Calendar Strip
  calendarContainer: {
    paddingHorizontal: spacing.gutter,
    marginBottom: spacing.md,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dayPillToday: {
    borderColor: colors.primary + '33', // 20% opacity
    backgroundColor: colors.primary + '08', // 5% opacity
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  dayLabelSelected: {
    color: '#fff',
  },
  dayDotContainer: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPlaceholder: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
  },

  // Past & Future Cards
  pastDayCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'stretch', // Stretch children to allow multi-line blocks
  },
  pastDayHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    marginBottom: spacing.lg,
  },
  pastDayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  reviewBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: colors.primary + '15',
    alignSelf: 'center', // Keep the button centered
  },
  futureDayCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl * 1.5,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Add new mock items
  mockSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mockSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  mockThumbBox: {
    width: 60,
    gap: 2,
    marginRight: 8,
  },
  mockThumbVideo: {
    width: 60,
    height: 36,
    backgroundColor: '#334155',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

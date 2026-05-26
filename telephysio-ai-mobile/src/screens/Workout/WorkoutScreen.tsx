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
import { NotificationBell } from '../../components/NotificationBell';

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
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [doctorName, setDoctorName] = useState<string>('');
  const [incompleteSessions, setIncompleteSessions] = useState<Record<string, IncompleteSession>>({});
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);

  // Date setup for weekly schedule
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(today);
  const dayOffset = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
  startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayIndex = dayOffset;
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const assignments = await getPatientAssignments(uid, 'active');
        setActiveAssignments(assignments);

        if (assignments.length > 0) {
          if (assignments[0].doctorId) {
            const doctor = await getUser(assignments[0].doctorId);
            setDoctorName(doctor?.displayName || 'Your doctor');
          }
          
          const incSess: Record<string, IncompleteSession> = {};
          await Promise.all(assignments.map(async (a) => {
            const inc = await getIncompleteSession(uid, a.id);
            if (inc) {
              incSess[a.id] = inc;
            }
          }));
          setIncompleteSessions(incSess);
        }

        const sessions = await getPatientSessions(uid, 20);
        setWeekSessions(sessions);
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

  const isSameDate = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  const selectedDate = weekDates[selectedDayIndex];
  const isSelectedToday = selectedDayIndex === todayIndex;

  const sessionsForSelectedDay = weekSessions.filter(s => {
    if (!s.date) return false;
    const sDate = (s.date as any).toDate ? (s.date as any).toDate() : new Date(s.date as any);
    return isSameDate(sDate, selectedDate);
  });

  const handleNavigateToDetail = (assignmentId: string) => {
    navigation.navigate('WorkoutDetail', {
      assignmentId,
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
          <NotificationBell />
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile' as any)}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineLg" style={styles.title}>
            {isSelectedToday ? t('workout.title', "Today's Routine") : `${daysOfWeek[selectedDayIndex]}'s Schedule`}
          </AppText>
          <AppText variant="bodyMd" style={styles.subtitle}>
            {isSelectedToday 
              ? t('workout.subtitle', 'Complete these exercises to reach your daily goal.') 
              : 'Check your exercises scheduled for this week.'}
          </AppText>
        </View>

        {/* Weekly Schedule Horizontal Strip */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarRow}>
            {daysOfWeek.map((day, index) => {
              const dateForDay = weekDates[index];
              const isToday = index === todayIndex;
              const isSelected = index === selectedDayIndex;
              
              const hasSession = weekSessions.some(s => {
                if (!s.date) return false;
                const sDate = (s.date as any).toDate ? (s.date as any).toDate() : new Date(s.date as any);
                return isSameDate(sDate, dateForDay);
              });
              
              const hasActiveAssignment = activeAssignments.some(a => {
                const sDate = a.scheduledDate ? ((a.scheduledDate as any).toDate ? (a.scheduledDate as any).toDate() : new Date(a.scheduledDate as any)) : new Date();
                return isSameDate(sDate, dateForDay);
              });
              
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
                    {hasActiveAssignment ? (
                      <Ionicons name="ellipse" size={8} color={isSelected ? "#fff" : colors.primary} />
                    ) : hasSession ? (
                      <Ionicons name="checkmark-circle" size={14} color={isSelected ? "#fff" : "#16a34a"} />
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
        {/* Dynamic Page Content based on Selection */}
        {(() => {
          const hasSessions = sessionsForSelectedDay.length > 0;
          const activeForDay = activeAssignments.filter(a => {
            const sDate = a.scheduledDate ? ((a.scheduledDate as any).toDate ? (a.scheduledDate as any).toDate() : new Date(a.scheduledDate as any)) : new Date();
            return isSameDate(sDate, selectedDate);
          }).sort((a, b) => {
            const dateA = a.scheduledDate ? ((a.scheduledDate as any).toDate ? (a.scheduledDate as any).toDate() : new Date(a.scheduledDate as any)) : new Date(0);
            const dateB = b.scheduledDate ? ((b.scheduledDate as any).toDate ? (b.scheduledDate as any).toDate() : new Date(b.scheduledDate as any)) : new Date(0);
            return dateA.getTime() - dateB.getTime();
          });
          const hasActive = activeForDay.length > 0;

          const totalForDay = sessionsForSelectedDay.length + activeForDay.length;
          const completedForDay = sessionsForSelectedDay.length;

          if (!hasSessions && !hasActive) {
            return (
              /* Empty / Rest Day */
              <View style={selectedDayIndex > todayIndex ? styles.futureDayCard : styles.emptyCard}>
                <Ionicons name={selectedDayIndex > todayIndex ? "calendar-outline" : "clipboard-outline"} size={40} color="#cbd5e1" />
                <AppText variant="headlineMd" style={{ color: '#64748b', marginTop: spacing.md }}>
                  No Assignment
                </AppText>
                <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                  You have no workout scheduled for {selectedDayIndex === todayIndex ? 'today' : 'this day'}.
                </AppText>
              </View>
            );
          }

          return (
            <>
              {/* Daily Progress Header */}
              <View style={{ marginBottom: spacing.lg, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <AppText variant="labelMd" style={{ color: '#475569', fontWeight: '600' }}>
                    Today's Progress
                  </AppText>
                  <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>
                    {completedForDay} / {totalForDay}
                  </AppText>
                </View>
                <View style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <View 
                    style={{ 
                      height: '100%', 
                      backgroundColor: colors.primary, 
                      width: `${(completedForDay / totalForDay) * 100}%`,
                      borderRadius: 4
                    }} 
                  />
                </View>
                <AppText variant="bodySm" style={{ color: '#64748b', marginTop: 8 }}>
                  Completed {completedForDay} out of {totalForDay} sessions
                </AppText>
              </View>

              {/* Render Active Assignments for Selected Day */}
              {activeForDay.map(assignment => {
                const incSession = incompleteSessions[assignment.id];
                const exercises = assignment.exercises || [];
                const isFuture = selectedDayIndex > todayIndex;
                
                return (
                  <View key={assignment.id} style={[styles.assignmentCard, { marginBottom: spacing.lg }]}>
                    <View style={[styles.assignmentHeader, { justifyContent: 'space-between' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={isFuture ? "lock-closed-outline" : "clipboard-outline"} size={18} color={isFuture ? "#64748b" : colors.primary} />
                        <AppText variant="labelMd" style={[styles.assignmentLabel, isFuture && { color: '#64748b' }]}>
                          {isFuture ? "UPCOMING PLAN (VIEW ONLY)" : "ACTIVE PLAN"}
                        </AppText>
                      </View>
                      {assignment.scheduledDate && (
                        <View style={{ backgroundColor: colors.primary + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: '700' }}>
                            {(() => {
                              const sd = (assignment.scheduledDate as any).toDate ? (assignment.scheduledDate as any).toDate() : new Date(assignment.scheduledDate as any);
                              return sd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </AppText>
                        </View>
                      )}
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

                    {isFuture && exercises.length > 0 && (
                      <View style={{ marginTop: spacing.xs, gap: spacing.sm }}>
                        {exercises.slice(0, 3).map((ex: any, idx: number) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.8 }}>
                            <Ionicons name="ellipse" size={6} color="#94a3b8" />
                            <AppText variant="bodyMd" style={{ color: '#475569' }}>{ex.name}</AppText>
                          </View>
                        ))}
                        {exercises.length > 3 && (
                          <AppText variant="bodySm" style={{ color: '#94a3b8', marginLeft: 14 }}>
                            + {exercises.length - 3} more
                          </AppText>
                        )}
                      </View>
                    )}

                    {isFuture ? (
                      <View style={[styles.cardStartButton, { backgroundColor: '#e2e8f0', shadowOpacity: 0, elevation: 0, marginTop: spacing.lg }]}>
                        <Ionicons name="lock-closed" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                        <AppText variant="labelMd" style={{ color: '#94a3b8', fontWeight: '700' }}>
                          Locked Until {daysOfWeek[selectedDayIndex]}
                        </AppText>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.cardStartButton}
                        onPress={() => handleNavigateToDetail(assignment.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={incSession ? "play-forward" : "play"}
                          size={20}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>
                          {incSession 
                            ? t('workout.continueWorkout', 'Continue Session')
                            : t('workout.startSession', 'Start Session')
                          }
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {/* Render completed sessions for the selected day */}
              {hasSessions && (
                <View style={{ marginTop: hasActive ? spacing.lg : 0, marginBottom: spacing.md, paddingHorizontal: 4 }}>
                  <AppText variant="labelMd" style={{ color: '#475569', fontWeight: '700' }}>
                    Completed sessions
                  </AppText>
                </View>
              )}
              {sessionsForSelectedDay.map(session => (
                <View key={session.id} style={[styles.pastDayCard, { marginBottom: spacing.lg }]}>
                  <View style={styles.pastDayHeader}>
                    <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                    <AppText variant="headlineMd" style={{ color: '#0f172a', marginTop: spacing.sm }}>
                      {session.templateName || "Workout Completed"}
                    </AppText>
                    <AppText variant="bodySm" style={{ color: '#64748b', marginTop: 2 }}>
                      Completed • {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </AppText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.pastDayStats}>
                    <View style={styles.statBox}>
                      <AppText variant="headlineMd" style={{ color: colors.primary }}>
                        {Math.floor((session.durationSeconds || 0) / 60)} min
                      </AppText>
                      <AppText variant="labelSm" style={{ color: '#64748b' }}>Duration</AppText>
                    </View>
                    <View style={styles.statBox}>
                      <AppText variant="headlineMd" style={{ color: colors.primary }}>{session.accuracy}%</AppText>
                      <AppText variant="labelSm" style={{ color: '#64748b' }}>Accuracy</AppText>
                    </View>
                    <View style={styles.statBox}>
                      <AppText variant="headlineMd" style={{ color: colors.primary }}>{session.exercisesCompleted || session.completedExercises}</AppText>
                      <AppText variant="labelSm" style={{ color: '#64748b' }}>Exercises</AppText>
                    </View>
                  </View>

                  {session.completedExercisesData && session.completedExercisesData.length > 0 ? (
                    <>
                      <View style={styles.divider} />
                      <AppText variant="labelSm" style={{ color: '#64748b', marginBottom: spacing.md, fontWeight: '700', letterSpacing: 0.5 }}>
                        EXERCISES COMPLETED
                      </AppText>
                      
                      {session.completedExercisesData.map((ex: any, i: number) => (
                        <View key={i} style={styles.mockSummaryRow}>
                          <View style={[styles.mockSummaryIcon, { backgroundColor: (ex.color || colors.primary) + '1A' }]}>
                            <Ionicons name={(ex.icon || 'barbell-outline') as any} size={18} color={ex.color || colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText variant="bodyMd" style={{ fontWeight: '600', color: '#0f172a' }}>{ex.name}</AppText>
                            <AppText variant="labelSm" style={{ color: '#64748b', marginTop: 2, marginBottom: spacing.xs }}>
                              {ex.sets} Sets • {ex.reps} Reps • {ex.accuracy}% Accuracy • {Math.floor((ex.durationSeconds || 0) / 60)}:{((ex.durationSeconds || 0) % 60).toString().padStart(2, '0')}
                            </AppText>
                            
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                              {Array.from({ length: ex.sets || 0 }).map((_, setIdx) => (
                                <View key={setIdx} style={styles.mockThumbBox}>
                                  <View style={styles.mockThumbVideo}>
                                    <Ionicons name="play-circle" size={16} color="#fff" />
                                  </View>
                                  <AppText style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 2 }}>Set {setIdx + 1}</AppText>
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                          <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm }} />
                        </View>
                      ))}
                    </>
                  ) : null}

                  {isSelectedToday && (
                    <>
                      <View style={{ height: spacing.sm }} />
                      <AppText variant="bodySm" style={{ color: '#16a34a', textAlign: 'center', fontWeight: '700' }}>
                        💪 Keep up the momentum for consistent recovery!
                      </AppText>
                    </>
                  )}
                  
                  <View style={styles.divider} />
                  <AppText variant="labelSm" style={{ color: '#64748b', marginBottom: spacing.sm, fontWeight: '700', letterSpacing: 0.5 }}>
                    DOCTOR'S REVIEW
                  </AppText>
                  <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 12 }}>
                    <Ionicons name="medical" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      {((session as any).doctorFeedback || (session as any).doctorReview) ? (
                        <AppText variant="bodyMd" style={{ color: '#334155' }}>
                          {(session as any).doctorFeedback || (session as any).doctorReview}
                        </AppText>
                      ) : (
                        <AppText variant="bodyMd" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          Doctor has not reviewed this session yet. Feedback will appear here once available.
                        </AppText>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </>
          );
        })()}

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

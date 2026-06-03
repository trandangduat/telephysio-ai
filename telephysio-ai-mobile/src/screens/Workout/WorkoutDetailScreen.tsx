/**
 * @file WorkoutDetailScreen.tsx
 * @description Màn hình chi tiết buổi tập của bệnh nhân.
 * Hiển thị danh sách bài tập, tiến độ hiện tại, và cho phép bắt đầu hoặc tiếp tục buổi tập.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { getPatientAssignments, getUser, getIncompleteSession, deleteIncompleteSession } from '../../services/firebase';
import type { Assignment, Exercise, ExerciseDifficulty, IncompleteSession } from '../../services/firebase/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetail'>;

const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: '#166534', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#b45309', bg: '#fef3c7' },
  hard: { label: 'Hard', color: '#991b1b', bg: '#fef2f2' },
};

/**
 * Màn hình chi tiết buổi tập của bệnh nhân.
 * Hiển thị thông tin assignment, các bài tập còn lại và đã hoàn thành,
 * cho phép bắt đầu/tiếp tục buổi tập từ vị trí đã lưu.
 *
 * @param route - Đối tượng route chứa tham số assignmentId.
 * @param navigation - Đối tượng navigation để điều hướng màn hình.
 * @return Component JSX màn hình chi tiết buổi tập.
 */
export const WorkoutDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assignmentId } = route.params;
  const { t } = useTranslation();
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [incompleteSession, setIncompleteSession] = useState<IncompleteSession | null>(null);
  const [recordVideo, setRecordVideo] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!uid || !assignmentId) {
        setLoading(false);
        return;
      }
      try {
        const assignments = await getPatientAssignments(uid, 'active');
        const active = assignments.find(a => a.id === assignmentId);
        
        if (active) {
          setAssignment(active);
          // Fetch doctor name
          if (active.doctorId) {
            const doctor = await getUser(active.doctorId);
            setDoctorName(doctor?.displayName || 'Your therapist');
          }
          // Fetch incomplete session
          const incSession = await getIncompleteSession(uid, active.id);
          setIncompleteSession(incSession);
        }
      } catch (error) {
        console.error('Error loading details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid, assignmentId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <AppText variant="headlineMd" style={{ color: '#64748b' }}>Assignment not found</AppText>
        <TouchableOpacity style={styles.backBtnSmall} onPress={() => navigation.goBack()}>
          <AppText variant="labelMd" style={{ color: colors.primary }}>Go Back</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const exercises = assignment.exercises || [];
  const currentIndex = incompleteSession ? incompleteSession.currentExerciseIndex : 0;

  // Segment the exercises: remaining go first, completed go to bottom as requested by the user.
  const completedExercises = exercises.slice(0, currentIndex);
  const remainingExercises = exercises.slice(currentIndex);

  /**
   * Xử lý bắt đầu hoặc tiếp tục buổi tập.
   * Nếu có buổi tập dở, hiển thị hộp thoại hỏi người dùng muốn tiếp tục hay bắt đầu lại.
   * Sau đó điều hướng đến màn hình Calibration với điểm bắt đầu phù hợp.
   */
  const handleStartWorkout = () => {
    if (incompleteSession) {
      Alert.alert(
        "Tiếp tục buổi tập?",
        "Chúng tôi tìm thấy một buổi tập đang dở của bạn. Bạn có muốn tiếp tục hay bắt đầu lại từ đầu?",
        [
          {
            text: "Bắt đầu lại",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                await deleteIncompleteSession(incompleteSession.id);
                setIncompleteSession(null);
                navigation.navigate('Calibration', {
                  assignmentId: assignment.id,
                  exerciseIndex: 0,
                  recordVideo: recordVideo,
                });
              } catch (err) {
                console.error("Lỗi khi xóa buổi tập cũ:", err);
              } finally {
                setLoading(false);
              }
            }
          },
          {
            text: "Tiếp tục",
            onPress: () => {
              navigation.navigate('Calibration', {
                assignmentId: assignment.id,
                exerciseIndex: currentIndex,
                recordVideo: recordVideo,
              });
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      navigation.navigate('Calibration', {
        assignmentId: assignment.id,
        exerciseIndex: 0,
        recordVideo: recordVideo,
      });
    }
  };

  /**
   * Render một thẻ bài tập (hoàn thành hoặc chưa hoàn thành).
   * Thẻ hoàn thành được hiển thị mờ hơn và có biểu tượng đánh dấu đã xong.
   *
   * @param ex - Dữ liệu bài tập cần hiển thị.
   * @param originalIndex - Chỉ số gốc của bài tập trong danh sách.
   * @param isCompleted - true nếu bài tập đã hoàn thành.
   * @return JSX element thẻ bài tập.
   */
  const renderExerciseCard = (ex: Exercise, originalIndex: number, isCompleted: boolean) => {
    const diffConfig = ex.difficulty ? DIFFICULTY_CONFIG[ex.difficulty] : null;
    
    return (
      <View 
        key={ex.id || originalIndex.toString()} 
        style={[
          styles.exerciseCard, 
          isCompleted && styles.completedExerciseCard
        ]}
      >
        <View style={styles.exerciseHeader}>
          <View 
            style={[
              styles.exerciseIcon, 
              { backgroundColor: isCompleted ? '#f1f5f9' : (ex.color || colors.primary) + '1A' }
            ]}
          >
            <Ionicons 
              name={(ex.icon || 'barbell-outline') as any} 
              size={24} 
              color={isCompleted ? '#94a3b8' : (ex.color || colors.primary)} 
            />
          </View>
          
          <View style={styles.exerciseInfo}>
            <View style={styles.exerciseNameRow}>
              <AppText 
                variant="headlineMd" 
                style={[styles.exerciseName, isCompleted && { color: '#94a3b8' }]}
              >
                {ex.name}
              </AppText>
              
              {!isCompleted && diffConfig && (
                <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg }]}>
                  <AppText variant="labelSm" style={[styles.diffText, { color: diffConfig.color }]}>
                    {diffConfig.label}
                  </AppText>
                </View>
              )}
            </View>
            
            <AppText variant="bodySm" style={[styles.exerciseDetails, isCompleted && { color: '#cbd5e1' }]}>
              {ex.sets} Sets x {ex.reps} Reps {ex.duration ? `(${ex.duration})` : ''}
            </AppText>
            
            {!isCompleted && ex.restBetweenSets ? (
              <AppText variant="bodySm" style={styles.exerciseRest}>
                Rest: {ex.restBetweenSets}s between sets
              </AppText>
            ) : null}
            
            {!isCompleted && ex.notes ? (
              <View style={styles.notesRow}>
                <Ionicons name="document-text-outline" size={12} color="#64748b" />
                <AppText variant="bodySm" style={styles.exerciseNotes}>{ex.notes}</AppText>
              </View>
            ) : null}
          </View>
          
          {isCompleted && (
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>{t('workout.title', 'Session Details')}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Big Hero Summary */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadgeRow}>
            <Ionicons name="clipboard" size={16} color="#fff" />
            <AppText variant="labelSm" style={styles.heroBadgeText}>TARGET PLAN</AppText>
          </View>
          <AppText variant="headlineLg" style={styles.heroTitle}>{assignment.templateName}</AppText>
          
          {doctorName ? (
            <View style={styles.heroDoctorRow}>
              <Ionicons name="medical-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
              <AppText variant="bodySm" style={styles.heroDoctorText}>
                Assigned by Dr. {doctorName}
              </AppText>
            </View>
          ) : null}

          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Ionicons name="barbell" size={20} color="#fff" />
              <AppText variant="headlineMd" style={styles.statVal}>{exercises.length}</AppText>
              <AppText variant="labelSm" style={styles.statLabel}>Exercises</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#fff" />
              <AppText variant="headlineMd" style={styles.statVal}>{assignment.totalDuration}</AppText>
              <AppText variant="labelSm" style={styles.statLabel}>Duration</AppText>
            </View>
            {currentIndex > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="ribbon" size={20} color="#fbbf24" />
                  <AppText variant="headlineMd" style={[styles.statVal, { color: '#fbbf24' }]}>
                    {Math.round((currentIndex / exercises.length) * 100)}%
                  </AppText>
                  <AppText variant="labelSm" style={styles.statLabel}>Done</AppText>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Active/Remaining Exercises */}
        {remainingExercises.length > 0 && (
          <View style={styles.section}>
            <AppText variant="labelMd" style={styles.sectionTitle}>
              {currentIndex > 0 ? "REMAINING EXERCISES" : "UPCOMING ROUTINE"}
            </AppText>
            {remainingExercises.map((ex, index) => 
              renderExerciseCard(ex, currentIndex + index, false)
            )}
          </View>
        )}

        {/* Completed Exercises at the bottom (as requested by the user) */}
        {completedExercises.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="labelMd" style={[styles.sectionTitle, { color: '#94a3b8' }]}>
                COMPLETED EXERCISES
              </AppText>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            </View>
            {completedExercises.map((ex, index) => 
              renderExerciseCard(ex, index, true)
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Action Button at bottom */}
      <View style={styles.footer}>
        <View style={styles.recordToggleRow}>
          <View style={styles.recordToggleTextCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="videocam" size={16} color={colors.primary} />
              <AppText variant="bodyMd" style={{ fontWeight: '700', color: '#0f172a', fontSize: 13 }}>
                Quay video buổi tập
              </AppText>
            </View>
            <AppText variant="bodySm" style={{ color: '#64748b', fontSize: 10, marginTop: 1 }}>
              Lưu trữ cục bộ .mp4 giúp bác sĩ xem lại form dáng
            </AppText>
          </View>
          <Switch
            value={recordVideo}
            onValueChange={setRecordVideo}
            trackColor={{ false: "#cbd5e1", true: colors.primary + "80" }}
            thumbColor={recordVideo ? colors.primary : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={[styles.launchBtn, currentIndex > 0 && styles.resumeBtn]}
          activeOpacity={0.85}
          onPress={handleStartWorkout}
        >
          <Ionicons 
            name={currentIndex > 0 ? "play-forward" : "flash"} 
            size={20} 
            color="#fff" 
            style={{ marginRight: 8 }}
          />
          <AppText variant="labelMd" style={styles.launchBtnText}>
            {currentIndex > 0 
              ? t('workout.continueWorkout', 'Resume Session') 
              : t('workout.beginWorkout', 'Begin Session Now')
            }
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: 6 },
  headerTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.xl, paddingBottom: spacing.xl * 4 },
  
  backBtnSmall: { marginTop: spacing.lg, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: '#e2e8f0' },

  // Hero Section
  heroSection: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: spacing.md,
  },
  heroBadgeText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5, fontSize: 10 },
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 26, marginBottom: spacing.sm },
  heroDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  heroDoctorText: { color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' },
  
  // Stat Grid
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  statLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.2)' },

  // Sections
  section: { gap: spacing.md },
  sectionTitle: {
    color: '#475569',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },

  // Exercise Cards
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  completedExerciseCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
    opacity: 0.75,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  exerciseName: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '600' },
  exerciseDetails: { color: '#64748b', marginTop: 4, fontWeight: '500' },
  exerciseRest: { color: '#94a3b8', marginTop: 2, fontSize: 12 },
  exerciseNotes: { color: '#64748b', fontSize: 12, flex: 1, fontStyle: 'italic' },
  notesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  checkmarkCircle: { paddingLeft: spacing.sm, alignSelf: 'center' },

  // Footer Button
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.gutter,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(248, 250, 253, 0.8)', // matching safe bg but transparent
  },
  launchBtn: {
    backgroundColor: '#2563eb', // Vibrant dynamic blue
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resumeBtn: {
    backgroundColor: '#0f766e', // Secondary elegant teal color
    shadowColor: '#0f766e',
  },
  launchBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  recordToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  recordToggleTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
});

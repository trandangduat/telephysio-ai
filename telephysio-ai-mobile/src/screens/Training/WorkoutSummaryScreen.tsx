/**
 * WorkoutSummaryScreen — Final session results.
 * 
 * Strict Completion Sequence (Section 3.3):
 *   1. Stop video recording -> stopRecording()
 *   2. Write final session -> recordSession()
 *   3. Complete assignment -> completeAssignment()
 *   4. Save progress snapshot -> saveProgressSnapshot()
 *   5. Clean up incomplete session -> deleteIncompleteSession()
 *   6. Show summary UI
 * 
 * Features:
 *   - MET-based Calories Burned calculation
 *   - Average Accuracy calculations (rounded integer)
 *   - Video local path storage display & size
 *   - Dynamic local video file deletion
 *   - Perceived Effort picker (easy, normal, hard) -> Firestore sync
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Video, ResizeMode } from 'expo-av';

import { AppText, AppButton } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPatientAssignments,
  getIncompleteSession,
  deleteIncompleteSession,
  recordSession,
  completeAssignment,
  stopRecording,
  saveProgressSnapshot,
  updateSessionEffort,
  uploadVideoToCloudinary,
} from '../../services/firebase';
import type { Assignment, ExerciseRecord, SetRecord } from '../../services/firebase/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSummary'>;

// MET Calculation Helper (Workout Flow Spec section 10.3)
function getMETValue(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  if (name.includes("plank") || name.includes("core") || name.includes("abdominal")) return 3.5;
  if (name.includes("hiit") || name.includes("burpee") || name.includes("cardio")) return 8.0;
  if (name.includes("stretch") || name.includes("cooldown") || name.includes("yoga")) return 2.5;
  return 5.0; // default Bodyweight exercise
}

export const WorkoutSummaryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assignmentId, recordVideo } = route.params || { assignmentId: '', recordVideo: false };
  const { uid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Workout stats
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [completedExercises, setCompletedExercises] = useState<ExerciseRecord[]>([]);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [calories, setCalories] = useState(0);
  const [completionRateVal, setCompletionRateVal] = useState(0);

  // Perceived effort
  const [effort, setEffort] = useState<"easy" | "normal" | "hard" | null>(null);

  // Video Management
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [thumbPath, setThumbPath] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [videoDeleted, setVideoDeleted] = useState(false);
  const [relativeVideoPathState, setRelativeVideoPathState] = useState<string | null>(null);

  useEffect(() => {
    async function processSummary() {
      if (!uid || !assignmentId) return;
      try {
        console.log("[WorkoutSummary] Starting strict completion sequence...");

        // 1. Stop video recording first if enabled
        let recordedVideoLocalPath: string | null = null;
        let recordedThumbnailPath: string | null = null;
        let relativeVideoPath: string | null = null;
        let relativeThumbnailPath: string | null = null;
        let recordedFileSizeMB = 0;

        if (recordVideo) {
          try {
            const stopResult = await stopRecording();
            recordedVideoLocalPath = stopResult.videoPath;
            recordedThumbnailPath = stopResult.thumbnailPath;
            relativeVideoPath = stopResult.relativeVideoPath;
            relativeThumbnailPath = stopResult.relativeThumbnailPath;
            recordedFileSizeMB = stopResult.fileSizeMB;

            setVideoPath(recordedVideoLocalPath);
            setVideoUrl(relativeVideoPath)
            setThumbPath(recordedThumbnailPath);
            setFileSize(recordedFileSizeMB);
            setRelativeVideoPathState(relativeVideoPath);
            console.log(`[WorkoutSummary] Video stopped: ${recordedVideoLocalPath} (${recordedFileSizeMB} MB)`);
          } catch (videoErr) {
            console.error("[WorkoutSummary] Failed to stop recording cleanly:", videoErr);
          }
        }

        // Fetch active assignment & incomplete session data
        const assignments = await getPatientAssignments(uid, 'active');
        const active = assignments.find((a) => a.id === assignmentId);
        const sessionData = await getIncompleteSession(uid, assignmentId);

        if (active && sessionData) {
          setAssignment(active);

          // Build Exercises & Sets Records from Incomplete Session
          const exercisesList = sessionData.completedExercises || [];
          setCompletedExercises(exercisesList);

          // Calculate accuracy and sums (Workout Flow Spec section 10)
          let totalAcc = 0;
          let totalSecs = 0;
          let sumReps = 0;
          let sumSets = 0;
          let calculatedCalories = 0;

          exercisesList.forEach(ex => {
            totalAcc += ex.accuracy;
            sumSets += ex.sets.length;

            let exSecs = 0;
            ex.sets.forEach(s => {
              sumReps += s.repsCompleted || 0;
              exSecs += s.durationSec || 0;
            });
            totalSecs += exSecs;

            // Met calculations per exercise: MET * weightKg * (durationSecs / 3600)
            const met = getMETValue(ex.exerciseName);
            const durationHours = exSecs / 3600;
            calculatedCalories += met * 65 * durationHours; // Default 65kg weight
          });

          // Average Accuracy (rounded mean accuracy across exercises)
          const avgAcc = exercisesList.length > 0 ? Math.round(totalAcc / exercisesList.length) : 0;
          const finalCalories = Math.round(calculatedCalories);
          const completionRate = parseFloat((exercisesList.length / active.exercises.length).toFixed(2));

          setOverallAccuracy(avgAcc);
          setTotalTime(totalSecs);
          setTotalReps(sumReps);
          setTotalSets(sumSets);
          setCalories(finalCalories);
          setCompletionRateVal(completionRate);

          console.log(`[WorkoutSummary] Calculated stats - Acc: ${avgAcc}%, Secs: ${totalSecs}, Calories: ${finalCalories}, Rate: ${completionRate}`);

          // 2. Save final session to Firestore
          const finalSessionId = await recordSession({
            patientId: uid,
            assignmentId: active.id,
            reps: sumReps,
            accuracy: avgAcc,
            duration: totalSecs, // total seconds
            caloriesBurned: finalCalories,
            completionRate: completionRate,
            perceivedEffort: null, // starts empty, chosen by user below
            exercises: exercisesList,
            videoLocalPath: recordedVideoLocalPath,
            thumbnailPath: relativeThumbnailPath || recordedThumbnailPath,
            videoUrl: relativeVideoPath || "", // Store the relative video reference link!

            // Backward compatibility properties:
            exercisesCompleted: exercisesList.length,
            completedExercises: exercisesList.length,
            accuracyScore: avgAcc,
            durationSeconds: totalSecs,
            totalDuration: `${Math.floor(totalSecs / 60)} min`,
            painLevel: 2, // Default standard pain score
            averagePain: 2,
            completedExercisesData: exercisesList.map((ex) => ({
              name: ex.exerciseName,
              accuracy: ex.accuracy,
              reps: ex.sets.reduce((sum, s) => sum + (s.repsCompleted || 0), 0),
              sets: ex.sets.length,
              durationSeconds: ex.sets.reduce((sum, s) => sum + (s.durationSec || 0), 0),
            }))
          });

          setSessionId(finalSessionId);
          console.log(`[WorkoutSummary] Step 2 - Session recorded with ID: ${finalSessionId}`);

          // 2.2. Automatically download video to local machine on Web
          if (Platform.OS === 'web' && recordedVideoLocalPath && typeof document !== 'undefined') {
            try {
              console.log("[WorkoutSummary] Auto-downloading recorded video to local machine...");
              const link = document.createElement('a');
              link.href = recordedVideoLocalPath;
              const filename = relativeVideoPath ? relativeVideoPath.split('/').pop() : `session_${finalSessionId}.mp4`;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              console.log("[WorkoutSummary] Auto-download completed successfully.");
            } catch (dlErr) {
              console.error("[WorkoutSummary] Failed to auto-download video:", dlErr);
            }
          }

          // 2.5. Upload video to Cloudinary and update session with real URL
          if (recordedVideoLocalPath && recordedVideoLocalPath.startsWith('blob:')) {
            try {
              console.log(`[WorkoutSummary] Step 2.5 - Uploading video to Cloudinary...`);
              const cloudVideoUrl = await uploadVideoToCloudinary(recordedVideoLocalPath, finalSessionId);

              // Update the session document with the real Cloudinary download URL
              const { doc, updateDoc } = await import('firebase/firestore');
              const { db } = await import('../../services/firebase/config');
              await updateDoc(doc(db, 'sessions', finalSessionId), {
                videoUrl: cloudVideoUrl,
              });
              console.log(`[WorkoutSummary] Step 2.5 - Session videoUrl updated in Firestore.`);
            } catch (uploadErr) {
              console.error('[WorkoutSummary] Failed to upload video to Cloudinary:', uploadErr);
              // Non-blocking: session is still saved with the relative path
            }
          }

          // 3. Complete assignment only if 100% finished
          if (completionRate >= 1.0) {
            // Check status first (handled in completeAssignment service)
            await completeAssignment(active.id);
            console.log(`[WorkoutSummary] Step 3 - Assignment ${active.id} completed!`);
          } else {
            console.log(`[WorkoutSummary] Step 3 - Completion rate is ${completionRate}. Left assignment active.`);
          }

          // 4. Save progress snapshot
          const snapshotId = await saveProgressSnapshot({
            patientId: uid,
            movementScore: avgAcc, // Accuracy represents active movement score
            timeActive: Math.round(totalSecs / 60), // Accumulate time active in minutes
            weeklyConsistency: 85, // Mock baseline
            rom: 90, // ROM standard baseline
            strength: 80, // Strength baseline

            // Backward compatibility
            timeActiveMinutes: Math.round(totalSecs / 60),
            dailyGoalPercent: Math.round(completionRate * 100),
            sessionsCompleted: 1,
            sessionsTarget: 3,
            romFlexion: 90,
            romExtension: 0,
            quadricepsStrength: 80,
            hamstringStability: 75,
            aiInsight: `You completed your workout with an outstanding ${avgAcc}% form accuracy score. Awesome work!`
          });
          console.log(`[WorkoutSummary] Step 4 - Progress snapshot saved: ${snapshotId}`);

          // 5. Clean up incomplete session
          await deleteIncompleteSession(sessionData.id);
          console.log(`[WorkoutSummary] Step 5 - Incomplete session state cleaned up.`);
        }
      } catch (error) {
        console.error('[WorkoutSummary] Error executing strict session completion:', error);
      } finally {
        setLoading(false);
        setSaving(false);
      }
    }

    processSummary();
  }, [uid, assignmentId]);

  const handleSelectEffort = async (choice: "easy" | "normal" | "hard") => {
    if (!sessionId) return;
    try {
      console.log(`[WorkoutSummary] Updating perceived effort to: ${choice}`);
      setEffort(choice);
      await updateSessionEffort(sessionId, choice);
    } catch (err) {
      console.error("Failed to select perceived effort:", err);
    }
  };

 


  const handleDone = () => {
    navigation.replace('MainTabs');
  };

  if (loading || saving) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="headlineMd" style={{ marginTop: 16, color: colors.primary, fontWeight: '700' }}>
          Processing Results...
        </AppText>
        <AppText variant="bodySm" style={{ marginTop: 8, color: '#64748b', textAlign: 'center', paddingHorizontal: 40 }}>
          Saving metadata, updating logs, running MET calculations, and closing the active session state.
        </AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Congratulations Header */}
        <View style={styles.header}>
          <View style={styles.trophyIcon}>
            <Ionicons name="trophy" size={48} color="#eab308" />
          </View>
          <AppText variant="headlineXl" style={styles.title}>Buổi Tập Hoàn Thành!</AppText>
          <AppText variant="bodyMd" style={styles.subtitle}>
            Chúc mừng bạn đã kết thúc xuất sắc lộ trình bài tập được giao.
          </AppText>
        </View>

        {/* Dashboard Stat Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            <AppText variant="headlineLg" style={{ color: colors.primary, fontWeight: '800', marginTop: 4 }}>
              {overallAccuracy}%
            </AppText>
            <AppText variant="labelSm" style={styles.statLabel}>Độ Chính Xác</AppText>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#0f172a" />
            <AppText variant="headlineLg" style={{ color: '#0f172a', fontWeight: '800', marginTop: 4 }}>
              {Math.floor(totalTime / 60)}m {totalTime % 60}s
            </AppText>
            <AppText variant="labelSm" style={styles.statLabel}>Tổng Thời Gian</AppText>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={20} color="#f97316" />
            <AppText variant="headlineLg" style={{ color: '#f97316', fontWeight: '800', marginTop: 4 }}>
              {calories} kcal
            </AppText>
            <AppText variant="labelSm" style={styles.statLabel}>Năng Lượng</AppText>
          </View>
        </View>

        {/* Perceived Effort Card */}
        <View style={styles.effortCard}>
          <AppText variant="labelMd" style={styles.cardTitle}>
            ĐÁNH GIÁ MỨC ĐỘ NỖ LỰC (PERCEIVED EFFORT)
          </AppText>
          <AppText variant="bodySm" style={styles.cardSubtitle}>
            Nỗ lực tập hôm nay của bạn cảm thấy như thế nào? Bác sĩ sẽ dùng thông số này để điều chỉnh cường độ bài tập.
          </AppText>
          <View style={styles.effortButtonRow}>
            <TouchableOpacity
              style={[
                styles.effortBtn,
                styles.effortBtnEasy,
                effort === "easy" && styles.effortBtnEasyActive
              ]}
              onPress={() => handleSelectEffort("easy")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="leaf-outline"
                size={16}
                color={effort === "easy" ? "#fff" : "#14b8a6"}
              />
              <AppText variant="labelMd" style={[styles.effortBtnText, effort === "easy" && { color: "#fff" }]}>
                Dễ Dàng
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.effortBtn,
                styles.effortBtnNormal,
                effort === "normal" && styles.effortBtnNormalActive
              ]}
              onPress={() => handleSelectEffort("normal")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="fitness-outline"
                size={16}
                color={effort === "normal" ? "#fff" : "#3b82f6"}
              />
              <AppText variant="labelMd" style={[styles.effortBtnText, effort === "normal" && { color: "#fff" }]}>
                Vừa Sức
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.effortBtn,
                styles.effortBtnHard,
                effort === "hard" && styles.effortBtnHardActive
              ]}
              onPress={() => handleSelectEffort("hard")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="thunderstorm-outline"
                size={16}
                color={effort === "hard" ? "#fff" : "#ef4444"}
              />
              <AppText variant="labelMd" style={[styles.effortBtnText, effort === "hard" && { color: "#fff" }]}>
                Khó Khăn
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercises Breakdown */}
        <View style={styles.exercisesList}>
          <AppText variant="labelMd" style={styles.listTitle}>CHI TIẾT BÀI TẬP ĐÃ TẬP</AppText>
          {completedExercises.map((ex, i) => (
            <View key={i} style={styles.exerciseRow}>
              <View style={[styles.exIcon, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.exInfo}>
                <AppText variant="bodyMd" style={styles.exName}>{ex.exerciseName}</AppText>
                <AppText variant="labelSm" style={styles.exDetail}>
                  {ex.sets.length} Sets • {ex.sets.reduce((sum, s) => sum + (s.repsCompleted || 0), 0)} Reps • {ex.accuracy}% Accuracy
                </AppText>

                {/* Horizontal set details row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbScroll}
                  contentContainerStyle={styles.thumbScrollContent}
                >
                  {ex.sets.map((s, setIdx) => (
                    <View key={setIdx} style={styles.thumbVideoBox}>
                      <View style={styles.thumbVideoPlaceholder}>
                        <AppText style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                          {s.accuracy}%
                        </AppText>
                      </View>
                      <AppText variant="labelSm" style={styles.thumbSetLabel}>
                        Set {s.setNumber} ({s.repsCompleted}r)
                      </AppText>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#16a34a" style={styles.rowCheckmark} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Done Footer */}
      <View style={styles.footer}>
        <AppButton
          label="Về Trang Chủ"
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
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { alignItems: 'center', marginVertical: spacing.lg },
  trophyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef9c3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { color: '#0f172a', fontWeight: '800', textAlign: 'center', fontSize: 22 },
  subtitle: { color: '#64748b', marginTop: 4, textAlign: 'center', fontSize: 14 },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 4 },

  // Effort level
  effortCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.xs,
  },
  cardTitle: { color: '#475569', fontWeight: '800', letterSpacing: 0.8, fontSize: 11 },
  cardSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 16 },
  effortButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  effortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  effortBtnText: { fontWeight: '700', fontSize: 12, color: '#475569' },

  // Effort colors
  effortBtnEasy: { borderColor: '#ccfbf1' },
  effortBtnEasyActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
  effortBtnNormal: { borderColor: '#dbeafe' },
  effortBtnNormalActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  effortBtnHard: { borderColor: '#fee2e2' },
  effortBtnHardActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  // Video Management Card
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.sm,
  },
  videoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  deleteVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  downloadVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  videoPathText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: spacing.sm,
  },
  videoPlayerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: spacing.sm,
  },
  summaryVideo: {
    width: '100%',
    height: '100%',
  },

  // Exercises
  exercisesList: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  listTitle: { color: '#475569', marginBottom: spacing.md, letterSpacing: 0.8, fontSize: 11, fontWeight: '800' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exInfo: { flex: 1 },
  exName: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  exDetail: { color: '#64748b', marginTop: 2, fontSize: 11, fontWeight: '500' },
  rowCheckmark: { alignSelf: 'flex-start', marginTop: 2, marginLeft: spacing.sm },

  // Thumbnails Row
  thumbScroll: {
    marginTop: spacing.sm,
  },
  thumbScrollContent: {
    gap: spacing.sm,
  },
  thumbVideoBox: {
    width: 80,
    alignItems: 'center',
    gap: 4,
  },
  thumbVideoPlaceholder: {
    width: 80,
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbSetLabel: {
    fontSize: 9,
    color: '#64748b',
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

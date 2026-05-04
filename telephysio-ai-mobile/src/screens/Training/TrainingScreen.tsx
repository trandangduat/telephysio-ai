/**
 * TrainingScreen — Live Workout Session
 *
 * Supports toggling between Full-Screen (Compact) and Normal (Detailed) modes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientAssignments, recordSession, completeAssignment } from '../../services/firebase';


type TrainingNavProp = NativeStackNavigationProp<RootStackParamList, 'Training'>;
interface Props { navigation: TrainingNavProp; }

export const TrainingScreen: React.FC<Props> = ({ navigation }) => {
  const { uid } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(true); // Toggle state
  const [currentRep, setCurrentRep] = useState(8);
  const [formAccuracy, setFormAccuracy] = useState(92);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(14 * 60 + 22);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const totalReps = 12;
  const currentSet = 2;
  const totalSets = 3;

  // Simulate timers
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  const handleStop = useCallback(() => { navigation.goBack(); }, [navigation]);

  const handleFinishWorkout = async () => {
    if (!uid) return;
    setIsFinishing(true);
    setPaused(true);
    try {
      // 1. Get active assignment
      const assignments = await getPatientAssignments(uid, 'active');
      const activeAssignment = assignments[0];
      
      if (activeAssignment) {
        // 2. Record Session
        await recordSession({
          patientId: uid,
          assignmentId: activeAssignment.id,
          exercisesCompleted: activeAssignment.exercises.length,
          accuracy: formAccuracy,
          durationSeconds: elapsed,
          duration: `${Math.floor(elapsed / 60)} min`,
          painLevel: 2, // Mock pain level, ideally asked in a modal
          reps: currentRep,
          sets: currentSet,
        });

        // 3. Mark Assignment as Completed
        await completeAssignment(activeAssignment.id);
      }

      Alert.alert('Great job!', 'Your workout session has been recorded.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs' as any) }
      ]);
    } catch (error) {
      console.error('Failed to finish workout:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
      setPaused(false);
    } finally {
      setIsFinishing(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // FULL SCREEN MODE (Compact)
  // ---------------------------------------------------------------------------
  if (isFullScreen) {
    return (
      <View style={styles.fsContainer}>
        {/* CAMERA VIEW (Background) */}
        <View style={styles.cameraBackground}>
          <View style={styles.skeletonCenter}>
            <View style={styles.poseBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#a7f3d0" />
              <AppText variant="labelMd" style={{ color: '#fff', marginLeft: 4 }}>Excellent Depth</AppText>
            </View>
          </View>
        </View>

        {/* TOP OVERLAY (Controls & Timer) */}
        <SafeAreaView style={styles.topOverlay} edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={handleStop}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.timerContainer}>
              <View style={styles.fsLiveBadge}>
                <View style={styles.fsLiveDot} />
                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>LIVE</AppText>
              </View>
              <AppText variant="bodyMd" style={styles.timerText}>{formatTime(elapsed)}</AppText>
            </View>

            <TouchableOpacity style={styles.iconButton} onPress={() => setIsFullScreen(false)}>
              <Ionicons name="contract" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* BOTTOM SHEET */}
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="labelMd" style={styles.grayLabel}>CURRENT SET</AppText>
            <AppText variant="labelMd" style={styles.grayLabel}>REPS</AppText>
          </View>
          
          <View style={styles.dataRow}>
            <AppText variant="headlineXl" style={styles.exerciseName}>Squat</AppText>
            <View style={styles.repContainer}>
              <AppText style={styles.repBig}>{currentRep}</AppText>
              <AppText style={styles.repSmall}> /{totalReps}</AppText>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText variant="labelMd" style={styles.grayLabel}>Form Accuracy</AppText>
              <AppText variant="labelMd" style={styles.accuracyValue}>{formAccuracy}%</AppText>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${formAccuracy}%` }]} />
            </View>
          </View>

          <View style={styles.mediaControls}>
            <TouchableOpacity style={styles.skipButton}>
              <Ionicons name="play-skip-back" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.playPauseButton} onPress={() => setPaused(!paused)}>
              <Ionicons name={paused ? "play" : "pause"} size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.skipButton} onPress={handleFinishWorkout} disabled={isFinishing}>
              {isFinishing ? (
                <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
              ) : (
                <Ionicons name="play-skip-forward" size={20} color={colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // NORMAL MODE (Detailed)
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.normalTopBar}>
        <TouchableOpacity onPress={handleStop}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        <TouchableOpacity style={styles.avatar}>
          <Ionicons name="person" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* VIDEO CONTAINER */}
        <View style={styles.videoContainer}>
          <View style={styles.videoBackground} />

          {/* Top Row: Badges & Expand Button */}
          <View style={styles.videoTopRow}>
            <View style={styles.badgeGroup}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <AppText variant="labelSm" style={styles.badgeText}>LIVE</AppText>
              </View>
              <View style={styles.trackingBadge}>
                <Ionicons name="radio-outline" size={14} color="#fff" />
                <AppText variant="labelSm" style={styles.badgeText}>Tracking Active</AppText>
              </View>
            </View>
            <TouchableOpacity style={styles.expandButton} onPress={() => setIsFullScreen(true)}>
              <Ionicons name="expand" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Form Analysis Overlay */}
          <View style={styles.analysisCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#047857" />
            </View>
            <View style={styles.analysisTextCol}>
              <AppText variant="labelMd" style={styles.analysisLabel}>FORM ANALYSIS</AppText>
              <AppText variant="bodySm" style={styles.analysisText}>Excellent depth. Keep chest up.</AppText>
            </View>
          </View>
        </View>

        {/* CURRENT EXERCISE CARD */}
        <View style={styles.card}>
          <AppText variant="labelMd" style={styles.grayLabel}>CURRENT EXERCISE</AppText>
          <View style={styles.exerciseRow}>
            <AppText style={styles.exerciseName}>Squat</AppText>
            <AppText style={styles.setInfo}>Set {currentSet}/{totalSets}</AppText>
          </View>
          
          <View style={styles.progressBarTrackNormal}>
            <View style={[styles.progressBarFillNormal, { width: `${(currentRep / totalReps) * 100}%` }]} />
          </View>
          
          <View style={styles.repInfoRow}>
            <AppText variant="labelSm" style={styles.repInfoText}>{currentRep} Reps Completed</AppText>
            <AppText variant="labelSm" style={styles.repInfoText}>{totalReps} Reps Goal</AppText>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <Ionicons name="refresh" size={24} color={colors.primary} style={styles.statIcon} />
            <AppText variant="labelMd" style={styles.statLabel}>REPS</AppText>
            <AppText style={styles.statValue}>{currentRep}</AppText>
          </View>

          <View style={[styles.card, styles.statCard]}>
            <Ionicons name="stats-chart" size={24} color="#047857" style={styles.statIcon} />
            <AppText variant="labelMd" style={styles.statLabel}>ACCURACY</AppText>
            <AppText style={[styles.statValue, { color: '#047857' }]}>{formAccuracy}%</AppText>
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.skipButton}>
            <Ionicons name="play-skip-back" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(!paused)}>
            <Ionicons name={paused ? "play" : "pause"} size={20} color="#fff" style={{ marginRight: 8 }} />
            <AppText variant="labelMd" color="#fff">
              {paused ? "RESUME WORKOUT" : "PAUSE WORKOUT"}
            </AppText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleFinishWorkout} disabled={isFinishing}>
            {isFinishing ? (
              <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
            ) : (
              <Ionicons name="play-skip-forward" size={20} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // === SHARED ===
  grayLabel: {
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 10,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // === FULL SCREEN STYLES ===
  fsContainer: { flex: 1, backgroundColor: '#111827' },
  cameraBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  skeletonCenter: { alignItems: 'center', top: -50 },
  poseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.gutter, paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  timerContainer: { alignItems: 'center', gap: 4 },
  fsLiveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 6 },
  fsLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  timerText: { color: '#fff', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: spacing.xl * 2, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  repContainer: { flexDirection: 'row', alignItems: 'baseline' },
  repBig: { fontFamily: typography.headlineXl.fontFamily, fontSize: 36, fontWeight: '700', color: colors.primary },
  repSmall: { fontFamily: typography.bodyMd.fontFamily, fontSize: 18, color: '#64748b', fontWeight: '600' },
  progressContainer: { marginBottom: spacing.xl },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  accuracyValue: { color: '#10b981', fontWeight: '700' },
  progressBarTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 5 },
  mediaControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl },
  playPauseButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },

  // === NORMAL MODE STYLES ===
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  normalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoText: { color: colors.primary, fontSize: 16, letterSpacing: 0.5, fontWeight: '700' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  videoContainer: { height: 380, borderRadius: 20, backgroundColor: '#1f2937', overflow: 'hidden', position: 'relative', justifyContent: 'space-between', padding: spacing.md },
  videoBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1c23' },
  videoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 },
  badgeGroup: { flexDirection: 'row', gap: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  badgeText: { color: '#fff', fontWeight: '600' },
  trackingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
  expandButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  analysisCard: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  analysisTextCol: { flex: 1 },
  analysisLabel: { color: '#047857', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  analysisText: { color: '#0f172a', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  setInfo: { fontFamily: typography.headlineMd.fontFamily, fontSize: 18, color: colors.primary },
  progressBarTrackNormal: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.sm },
  progressBarFillNormal: { height: '100%', backgroundColor: '#0f766e', borderRadius: 6 },
  repInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  repInfoText: { color: '#475569', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  statIcon: { marginBottom: spacing.sm },
  statLabel: { color: '#475569', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontFamily: typography.headlineXl.fontFamily, fontSize: 36, color: '#0f172a' },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  pauseButton: { flexDirection: 'row', height: 56, paddingHorizontal: spacing.xl, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { saveSession } from '../../services/firestore';
import { colors, typography, spacing, radius } from '../../theme';

type PatientStackParamList = {
  Home: undefined;
  Session: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
};

interface Props {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'Session'>;
  route: RouteProp<PatientStackParamList, 'Session'>;
}

type SessionPhase = 'active' | 'resting' | 'completed';

export const SessionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { exerciseId, exerciseName, targetReps, sets } = route.params;
  const { user } = useAuthStore();

  const [phase, setPhase] = useState<SessionPhase>('active');
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [restTime, setRestTime] = useState(30);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('Let\'s go! Focus on good form 💪');

  const repAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  const FEEDBACK_MESSAGES = [
    'Great job! Keep it up! 🔥',
    'Keep your back straight! 📏',
    'Breathe steadily! 🌬️',
    'Excellent form! You\'re doing great! ⭐',
    'Slow and controlled! 🎯',
    'Almost there! Push through! 💪',
  ];

  // Main timer
  useEffect(() => {
    if (phase === 'active' && !paused) {
      timerRef.current = setInterval(() => setTotalTime((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, paused]);

  // Rest timer
  useEffect(() => {
    if (phase === 'resting') {
      setRestTime(30);
      restTimerRef.current = setInterval(() => {
        setRestTime((t) => {
          if (t <= 1) {
            clearInterval(restTimerRef.current!);
            if (currentSet < sets) {
              setCurrentSet((s) => s + 1);
              setReps(0);
              setPhase('active');
              setFeedback('New set! Let\'s go! 🔥');
            } else {
              setPhase('completed');
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current!); };
  }, [phase]);

  // Mock rep counting (simulate AI detection)
  const addRep = useCallback(() => {
    if (phase !== 'active' || paused) return;

    const newReps = reps + 1;
    setReps(newReps);

    // Animate rep counter
    Animated.sequence([
      Animated.timing(repAnim, { toValue: 1.2, duration: 120, useNativeDriver: true }),
      Animated.timing(repAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Random feedback
    if (newReps % 3 === 0) {
      setFeedback(FEEDBACK_MESSAGES[Math.floor(Math.random() * FEEDBACK_MESSAGES.length)]);
    }

    if (newReps >= targetReps) {
      const repScore = Math.floor(70 + Math.random() * 30);
      setScore((s) => Math.round((s + repScore) / (currentSet)));
      if (currentSet < sets) {
        setPhase('resting');
        setFeedback(`Set ${currentSet} done! Rest 30 seconds 👏`);
      } else {
        setPhase('completed');
      }
    }
  }, [phase, paused, reps, targetReps, currentSet, sets]);

  const handleStop = () => {
    Alert.alert('Stop Session', 'Do you want to save your progress?', [
      { text: 'Discard', style: 'destructive', onPress: () => navigation.navigate('Home') },
      { text: 'Save & Exit', onPress: () => saveResult('incomplete') },
    ]);
  };

  const saveResult = async (status: 'completed' | 'incomplete') => {
    if (!user) return;
    setSaving(true);
    try {
      const finalScore = status === 'completed' ? Math.max(60, score) : Math.round(score * 0.7);
      await saveSession({
        userId: user.uid,
        exerciseId,
        exerciseName,
        completedReps: reps + (currentSet - 1) * targetReps,
        targetReps: targetReps * sets,
        completedSets: currentSet,
        targetSets: sets,
        score: finalScore,
        duration: totalTime,
        status,
      });
      navigation.navigate('Home');
    } catch (e) {
      console.error('Save session error:', e);
      Alert.alert('Error', 'Could not save your session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Completion screen
  if (phase === 'completed') {
    const finalScore = Math.max(60, score || Math.floor(70 + Math.random() * 25));
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completedScreen}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>Excellent!</Text>
          <Text style={styles.completedSub}>You've completed your session</Text>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{finalScore}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>

          <View style={styles.completedStats}>
            {[
              { label: 'Sets', value: `${sets}/${sets}` },
              { label: 'Reps', value: `${targetReps * sets}` },
              { label: 'Time', value: formatTime(totalTime) },
            ].map((stat) => (
              <View key={stat.label} style={styles.completedStat}>
                <Text style={styles.completedStatValue}>{stat.value}</Text>
                <Text style={styles.completedStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => saveResult('completed')}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save Results'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleStop} style={styles.stopBtn}>
          <Text style={styles.stopBtnText}>✕ Stop</Text>
        </TouchableOpacity>
        <Text style={styles.exerciseTitleTop}>{exerciseName}</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(totalTime)}</Text>
        </View>
      </View>

      {/* Camera area (mock with body skeleton) */}
      <View style={styles.cameraArea}>
        {/* Human silhouette placeholder */}
        <View style={styles.silhouettePlaceholder}>
          <Text style={styles.silhouetteIcon}>🧍</Text>
        </View>

        {/* Rep counter overlay */}
        <View style={styles.repOverlay}>
          <Text style={styles.repLabel}>REPS</Text>
          <Animated.Text
            style={[styles.repCount, { transform: [{ scale: repAnim }] }]}
          >
            {reps}
          </Animated.Text>
          <Text style={styles.repTotal}>/ {targetReps}</Text>
        </View>

        {/* Feedback banner */}
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText} numberOfLines={1}>{feedback}</Text>
        </View>

        {/* Set indicator top right */}
        <View style={styles.setBadge}>
          <Text style={styles.setBadgeText}>Set {currentSet}/{sets}</Text>
        </View>
      </View>

      {/* Rest overlay */}
      {phase === 'resting' && (
        <View style={styles.restOverlay}>
          <Text style={styles.restTitle}>Rest Time</Text>
          <Text style={styles.restTimer}>{restTime}s</Text>
          <Text style={styles.restSub}>Next set: {currentSet + 1}/{sets}</Text>
          <TouchableOpacity
            style={styles.skipRestBtn}
            onPress={() => {
              clearInterval(restTimerRef.current!);
              setCurrentSet((s) => s + 1);
              setReps(0);
              setPhase('active');
            }}
          >
            <Text style={styles.skipRestText}>Skip rest →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Progress bar */}
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>
            Set {currentSet} progress: {reps}/{targetReps}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((reps / targetReps) * 100, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Tap to count + pause */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() => setPaused((p) => !p)}
          >
            <Text style={styles.pauseBtnIcon}>{paused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.repBtn}
            onPress={addRep}
            disabled={phase !== 'active' || paused}
            activeOpacity={0.85}
          >
            <Text style={styles.repBtnText}>
              {paused ? '⏸ Paused' : '👆 Count Rep'}
            </Text>
            <Text style={styles.repBtnSub}>Tap after each repetition</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a1520' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  stopBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(186,26,26,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.5)',
  },
  stopBtnText: { color: '#ff8a80', ...typography.labelMd },
  exerciseTitleTop: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)', flex: 1, textAlign: 'center' },
  timerBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  timerText: { ...typography.labelMd, color: colors.inverseOnSurface, fontVariant: ['tabular-nums'] },

  cameraArea: {
    flex: 1,
    backgroundColor: '#0a1520',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouettePlaceholder: {
    width: 160,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  silhouetteIcon: { fontSize: 80 },
  repOverlay: {
    position: 'absolute',
    right: spacing.gutter,
    top: '20%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  repLabel: { ...typography.labelSm, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  repCount: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.primaryFixedDim,
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  repTotal: { ...typography.bodyMd, color: 'rgba(255,255,255,0.5)' },
  feedbackBanner: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.gutter,
    right: spacing.gutter,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  feedbackText: { ...typography.bodyMd, color: colors.inverseOnSurface, textAlign: 'center' },
  setBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.gutter,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  setBadgeText: { ...typography.labelSm, color: colors.onPrimaryContainer },

  restOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,21,32,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 10,
  },
  restTitle: { ...typography.headlineLg, color: colors.inverseOnSurface },
  restTimer: { fontSize: 72, fontWeight: '700', color: colors.primaryFixedDim, fontVariant: ['tabular-nums'] },
  restSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.6)' },
  skipRestBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skipRestText: { ...typography.labelMd, color: colors.inverseOnSurface },

  controls: {
    backgroundColor: colors.background,
    padding: spacing.gutter,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  progressInfo: { gap: spacing.xs },
  progressLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pauseBtnIcon: { fontSize: 20 },
  repBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    boxShadow: '0px 4px 16px rgba(0,71,141,0.3)',
  } as any,
  repBtnText: { ...typography.headlineMd, color: colors.onPrimary },
  repBtnSub: { ...typography.labelSm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Completed screen
  completedScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  completedEmoji: { fontSize: 64 },
  completedTitle: { ...typography.headlineXl, color: colors.onSurface },
  completedSub: { ...typography.bodyLg, color: colors.onSurfaceVariant },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryFixed,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { fontSize: 48, fontWeight: '700', color: colors.primary },
  scoreLabel: { ...typography.labelMd, color: colors.onPrimaryFixedVariant },
  completedStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    width: '100%',
    justifyContent: 'space-around',
  },
  completedStat: { alignItems: 'center', gap: spacing.xs },
  completedStatValue: { ...typography.headlineLg, color: colors.onSurface },
  completedStatLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  saveBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: radius.lg,
    alignItems: 'center',
    boxShadow: '0px 4px 16px rgba(0,71,141,0.3)',
  } as any,
  saveBtnText: { ...typography.headlineMd, color: colors.onPrimary },
});

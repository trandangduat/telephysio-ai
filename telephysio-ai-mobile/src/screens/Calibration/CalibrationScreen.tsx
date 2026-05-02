import React, { useState, useEffect, useRef } from 'react';
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
import { colors, typography, spacing, radius } from '../../theme';
import { Button } from '../../components/ui/Button';

type PatientStackParamList = {
  Calibration: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
  Session: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
};

interface Props {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'Calibration'>;
  route: RouteProp<PatientStackParamList, 'Calibration'>;
}

type CalibrationStatus = 'idle' | 'detecting' | 'partial' | 'ready';

const JOINT_POINTS = [
  { id: 'head', label: 'Head', x: 50, y: 8 },
  { id: 'lShoulder', label: 'L Shoulder', x: 32, y: 20 },
  { id: 'rShoulder', label: 'R Shoulder', x: 68, y: 20 },
  { id: 'lElbow', label: 'L Elbow', x: 20, y: 34 },
  { id: 'rElbow', label: 'R Elbow', x: 80, y: 34 },
  { id: 'lHip', label: 'L Hip', x: 36, y: 50 },
  { id: 'rHip', label: 'R Hip', x: 64, y: 50 },
  { id: 'lKnee', label: 'L Knee', x: 30, y: 67 },
  { id: 'rKnee', label: 'R Knee', x: 70, y: 67 },
  { id: 'lAnkle', label: 'L Ankle', x: 28, y: 84 },
  { id: 'rAnkle', label: 'R Ankle', x: 72, y: 84 },
];

export const CalibrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { exerciseId, exerciseName, targetReps, sets } = route.params;
  const [status, setStatus] = useState<CalibrationStatus>('idle');
  const [detectedCount, setDetectedCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Simulate calibration process
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStatus('detecting');
      const detectTimer = setInterval(() => {
        setDetectedCount((prev) => {
          const next = prev + 1;
          if (next >= JOINT_POINTS.length) {
            clearInterval(detectTimer);
            setStatus('ready');
            return JOINT_POINTS.length;
          }
          if (next >= 5) setStatus('partial');
          return next;
        });
      }, 400);
      return () => clearInterval(detectTimer);
    }, 1000);
    return () => clearTimeout(startTimer);
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: detectedCount / JOINT_POINTS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [detectedCount]);

  // Pulse animation for scanning indicator
  useEffect(() => {
    if (status === 'detecting' || status === 'partial') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const statusConfig = {
    idle: {
      message: 'Preparing calibration',
      sub: 'Stand 2–3 meters from your phone so the camera can see your full body',
      color: colors.onSurfaceVariant,
      bgColor: colors.surfaceContainerHighest,
    },
    detecting: {
      message: 'Detecting your body...',
      sub: 'Stand straight with arms relaxed at your sides',
      color: colors.primary,
      bgColor: colors.primaryFixed,
    },
    partial: {
      message: `Detected ${detectedCount}/${JOINT_POINTS.length} joint points`,
      sub: 'Step back or adjust the camera angle',
      color: '#e65100',
      bgColor: '#ffeedd',
    },
    ready: {
      message: '✅ Ready! Full body detected',
      sub: 'Press "Start Exercise" when you are ready',
      color: colors.tertiary,
      bgColor: colors.tertiaryFixed,
    },
  };

  const cfg = statusConfig[status];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Exercise info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        <Text style={styles.exerciseMeta}>{sets} sets × {targetReps} reps</Text>
      </View>

      {/* Camera preview (mock) */}
      <View style={styles.cameraArea}>
        {/* Grid overlay */}
        <View style={styles.gridOverlay}>
          <View style={[styles.gridLine, { top: '33%' }]} />
          <View style={[styles.gridLine, { top: '66%' }]} />
          <View style={[styles.gridLineV, { left: '33%' }]} />
          <View style={[styles.gridLineV, { left: '66%' }]} />
        </View>

        {/* Safe zone indicator */}
        <View style={styles.safeZone} />

        {/* Skeleton joints */}
        {JOINT_POINTS.slice(0, detectedCount).map((joint) => (
          <View
            key={joint.id}
            style={[
              styles.jointDot,
              {
                left: `${joint.x}%`,
                top: `${joint.y}%`,
                backgroundColor: status === 'ready' ? colors.tertiaryFixed : colors.primaryFixedDim,
                borderColor: status === 'ready' ? colors.tertiary : colors.primary,
              },
            ]}
          />
        ))}

        {/* Center instruction */}
        {status === 'idle' && (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderIcon}>📷</Text>
            <Text style={styles.cameraPlaceholderText}>Camera starting up</Text>
          </View>
        )}

        {/* Corner guides */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <View
            key={pos}
            style={[
              styles.corner,
              pos.includes('t') ? { top: 16 } : { bottom: 16 },
              pos.includes('l') ? { left: 16 } : { right: 16 },
              {
                borderTopWidth: pos.includes('t') ? 3 : 0,
                borderBottomWidth: pos.includes('b') ? 3 : 0,
                borderLeftWidth: pos.includes('l') ? 3 : 0,
                borderRightWidth: pos.includes('r') ? 3 : 0,
                borderColor: status === 'ready' ? colors.tertiary : colors.primary,
              },
            ]}
          />
        ))}
      </View>

      {/* Status card */}
      <View style={styles.statusArea}>
        <Animated.View
          style={[
            styles.statusCard,
            { backgroundColor: cfg.bgColor },
            (status === 'detecting' || status === 'partial') && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={[styles.statusMsg, { color: cfg.color }]}>{cfg.message}</Text>
          <Text style={styles.statusSub}>{cfg.sub}</Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: status === 'ready' ? colors.tertiary : colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {detectedCount}/{JOINT_POINTS.length} joint points
          </Text>
        </Animated.View>

        <Button
          title="▶ Start Exercise"
          onPress={() => navigation.replace('Session', { exerciseId, exerciseName, targetReps, sets })}
          disabled={status !== 'ready'}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.inverseSurface },
  infoBanner: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.inverseSurface,
  },
  exerciseName: { ...typography.headlineMd, color: colors.inverseOnSurface },
  exerciseMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  cameraArea: {
    flex: 1,
    backgroundColor: '#0a1520',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  safeZone: {
    position: 'absolute',
    top: '5%', left: '10%', right: '10%', bottom: '5%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xl,
    borderStyle: 'dashed',
  },
  jointDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginLeft: -6,
    marginTop: -6,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  cameraPlaceholderIcon: { fontSize: 48 },
  cameraPlaceholderText: { color: 'rgba(255,255,255,0.5)', ...typography.bodyMd },
  corner: { position: 'absolute', width: 24, height: 24 },
  statusArea: {
    backgroundColor: colors.background,
    padding: spacing.gutter,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  statusCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  statusMsg: { ...typography.headlineMd },
  statusSub: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'right' },
});

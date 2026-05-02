/**
 * TrainingScreen — UC2 (training), UC3 (pose warning)
 *
 * Full-screen camera with PoseWarningOverlay, WorkoutCounter, VideoPreview PiP,
 * Pause/Stop buttons, Form Accuracy progress bar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText, AppButton, ProgressBar } from '../../components/ui';
import { WorkoutCounter } from '../../components/training/WorkoutCounter';
import { PoseWarningOverlay } from '../../components/training/PoseWarningOverlay';
import { VideoPreview } from '../../components/training/VideoPreview';
import { colors, spacing, radius } from '../../theme';
import { mockSession } from '../../mocks/workout.mock';
import type { RootStackParamList } from '../../navigation/types';

type TrainingNavProp = NativeStackNavigationProp<RootStackParamList, 'Training'>;
interface Props { navigation: TrainingNavProp; }
type PoseSeverity = 'ok' | 'warn' | 'stop';

export const TrainingScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [currentRep, setCurrentRep] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [formAccuracy, setFormAccuracy] = useState(0);
  const [severity, setSeverity] = useState<PoseSeverity>('ok');
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const totalReps = mockSession.totalReps;
  const totalSets = mockSession.totalSets;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrentRep((prev) => (prev >= totalReps ? prev : prev + 1));
      setFormAccuracy((prev) => Math.min(98, prev + Math.random() * 8));
    }, 2000);
    return () => clearInterval(timer);
  }, [paused, totalReps]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const r = Math.random();
      if (r < 0.1) setSeverity('stop');
      else if (r < 0.3) setSeverity('warn');
      else setSeverity('ok');
    }, 4000);
    return () => clearInterval(timer);
  }, [paused]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = useCallback(() => { navigation.goBack(); }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.cameraArea}>
        <View style={styles.cameraPlaceholder} />
        <PoseWarningOverlay severity={severity} />
        <View style={styles.timerBadge}>
          <View style={styles.liveDot} />
          <AppText variant="labelMd" color={colors.onPrimary}>{t('training.live')}</AppText>
          <AppText variant="bodyMd" color={colors.onPrimary} style={{ fontVariant: ['tabular-nums'] }}>
            {formatTime(elapsed)}
          </AppText>
        </View>
        <VideoPreview />
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.infoRow}>
          <View style={styles.exerciseInfo}>
            <AppText variant="labelMd" color={colors.onSurfaceVariant}>
              {t('training.set', { current: currentSet, total: totalSets })}
            </AppText>
            <AppText variant="headlineMd">{mockSession.exerciseName}</AppText>
          </View>
          <View style={styles.repDisplay}>
            <AppText variant="labelMd" color={colors.onSurfaceVariant}>
              {t('training.repCount')}
            </AppText>
            <View style={styles.repRow}>
              <AppText variant="headlineXl" color={colors.primary} style={{ fontVariant: ['tabular-nums'] }}>
                {currentRep}
              </AppText>
              <AppText variant="headlineMd" color={colors.onSurfaceVariant}>
                /{totalReps}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.accuracySection}>
          <View style={styles.accuracyHeader}>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              {t('training.formAccuracy')}
            </AppText>
            <AppText variant="bodySm" color={colors.tertiary} style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round(formAccuracy)}%
            </AppText>
          </View>
          <ProgressBar progress={formAccuracy / 100} variant="ai" />
        </View>

        <View style={styles.controls}>
          <AppButton label="⏮" variant="ghost" size="sm" onPress={() => {}} />
          <AppButton
            label={paused ? '▶' : '⏸'}
            variant="primary"
            size="lg"
            onPress={() => setPaused((p) => !p)}
            style={styles.pauseBtn}
          />
          <AppButton label="⏭" variant="ghost" size="sm" onPress={handleStop} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  cameraArea: { flex: 1, position: 'relative' },
  cameraPlaceholder: { flex: 1, backgroundColor: '#2a2a2a' },
  timerBadge: { position: 'absolute', top: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(19, 29, 35, 0.7)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full } as ViewStyle,
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  bottomPanel: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl + spacing.md } as ViewStyle,
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exerciseInfo: { flex: 1, gap: spacing.xs },
  repDisplay: { alignItems: 'flex-end', gap: spacing.xs },
  repRow: { flexDirection: 'row', alignItems: 'baseline' },
  accuracySection: { gap: spacing.sm },
  accuracyHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  pauseBtn: { width: 64, height: 64, borderRadius: 32 } as ViewStyle,
});

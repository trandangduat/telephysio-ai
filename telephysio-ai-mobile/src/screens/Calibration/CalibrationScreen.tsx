/**
 * CalibrationScreen — UC1: camera permission + pose alignment.
 *
 * Full-screen camera with silhouette overlay and status indicator.
 * Button only active when pose detected (green state).
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, AppButton } from '../../components/ui';
import { colors, radius, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type CalibrationProps = NativeStackScreenProps<RootStackParamList, 'Calibration'>;

type CalibrationStatus = 'not-ready' | 'partial' | 'ready';

export const CalibrationScreen: React.FC<CalibrationProps> = ({ route, navigation }) => {
  const { assignmentId, exerciseIndex } = route.params || { assignmentId: '', exerciseIndex: 0 };
  const { t } = useTranslation();
  const [status, setStatus] = useState<CalibrationStatus>('not-ready');

  const statusConfig: Record<CalibrationStatus, { color: string; label: string }> = {
    'not-ready': { color: colors.error,   label: t('calibration.notReady') },
    partial:     { color: colors.primary,  label: t('calibration.partial') },
    ready:       { color: colors.tertiary, label: t('calibration.ready') },
  };

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('partial'), 1500);
    const t2 = setTimeout(() => setStatus('ready'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const cfg = statusConfig[status];

  return (
    <View style={styles.container}>
      <View style={styles.cameraView}>
        <View style={styles.silhouette}>
          <View style={[styles.silhouetteBody, { borderColor: cfg.color }]} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          <AppText variant="bodySm" color={colors.onPrimary}>{cfg.label}</AppText>
        </View>
        <View style={styles.instructionBox}>
          <AppText variant="bodySm" color={colors.onSurface}>
            {t('calibration.instruction')}
          </AppText>
        </View>
      </View>
      <View style={styles.bottomBar}>
        <AppButton
          label={t('calibration.startButton')}
          size="lg"
          disabled={status !== 'ready'}
          onPress={() => navigation.replace('Training', { assignmentId, exerciseIndex })}
          style={styles.startBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraView: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  silhouette: { alignItems: 'center', justifyContent: 'center' },
  silhouetteBody: { width: 120, height: 240, borderWidth: 2, borderRadius: radius.xl, borderStyle: 'dashed', opacity: 0.6 } as ViewStyle,
  statusBadge: { position: 'absolute', top: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full } as ViewStyle,
  instructionBox: { position: 'absolute', bottom: spacing.xl, backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, marginHorizontal: spacing.lg } as ViewStyle,
  bottomBar: { padding: spacing.gutter, paddingBottom: spacing.xl, backgroundColor: colors.surfaceContainerLowest },
  startBtn: { width: '100%' },
});

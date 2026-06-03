/**
 * CalibrationScreen.tsx — Màn hình hiệu chỉnh tư thế trước khi tập luyện.
 *
 * <p>Triển khai Use Case UC1: xầy dựng luồng xin quyền camera và định vị tư thế người dùng
 * trước khi bắt đầu phương àn tập.
 * </p>
 *
 * <p>Giao diện toàn màn hình với camera trước, lớp phủ silhouette mô phỏng tư thế
 * và bảng trạng thái nhận diện. Nút bắt đầu chỉ được kích hoạt khi tư thế
 * đã sẵn sàng (trạng thái green/ready).
 * </p>
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, AppButton } from '../../components/ui';
import { colors, radius, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { CameraView, useCameraPermissions } from 'expo-camera';

type CalibrationProps = NativeStackScreenProps<RootStackParamList, 'Calibration'>;

/**
 * Kiểu trạng thái hiệu chỉnh tư thế.
 *
 * <ul>
 *   <li>{@code not-ready} — Chưa phát hiện được tư thế người dùng (hiển thị màu đỏ)</li>
 *   <li>{@code partial} — Phát hiện được một phần tư thế (hiển thị màu primary)</li>
 *   <li>{@code ready} — Tư thế đúng, sẵn sàng bắt đầu (hiển thị màu xanh tertiary)</li>
 * </ul>
 */
type CalibrationStatus = 'not-ready' | 'partial' | 'ready';

/**
 * Component màn hình hiệu chỉnh tư thế trước khi tập.
 *
 * <p>Hiển thị camera mặt trước để phát hiện và hướng dẫn người dùng đồng bộ tư thế.
 * Sau khi tư thế sẵn sàng ({@code ready}), người dùng có thể nhấn nút để
 * chuyển sang màn hình Training.
 * </p>
 *
 * @param route - Tham số route chứa {@code assignmentId}, {@code exerciseIndex}
 *                và {@code recordVideo} tùy chọn
 * @param navigation - Đối tượng điều hướng để chuyển sang màn hình Training
 * @return JSX element hiển thị giao diện hiệu chỉnh toàn màn hình
 */
export const CalibrationScreen: React.FC<CalibrationProps> = ({ route, navigation }) => {
  const { assignmentId, exerciseIndex, recordVideo } = route.params || { assignmentId: '', exerciseIndex: 0, recordVideo: false };
  const { t } = useTranslation();
  const [status, setStatus] = useState<CalibrationStatus>('not-ready');
  const [permission, requestPermission] = useCameraPermissions();

  const statusConfig: Record<CalibrationStatus, { color: string; label: string }> = {
    'not-ready': { color: colors.error,   label: t('calibration.notReady') },
    partial:     { color: colors.primary,  label: t('calibration.partial') },
    ready:       { color: colors.tertiary, label: t('calibration.ready') },
  };

  /**
   * Giả lập quá trình nhận diện tư thế theo thời gian.
   *
   * <p>Sau 1,5 giây chuyển sang trạng thái {@code partial};
   * sau 3,5 giây chuyển sang trạng thái {@code ready}.
   * Dọn dẹp bộ đếm thời gian khi component bị hủy.
   * </p>
   */
  useEffect(() => {
    const t1 = setTimeout(() => setStatus('partial'), 1500);
    const t2 = setTimeout(() => setStatus('ready'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /**
   * Tự động yêu cầu quyền camera khi component được mount
   * nếu quyền chưa được cấp và hệ thống còn cho phép hỏi lại.
   */
  // Automatically request camera permission on mount if not yet decided
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <AppText variant="bodyMd" color={colors.onSurface} style={{ textAlign: 'center', marginBottom: spacing.lg }}>
          The app needs camera access to perform pose calibration before your workout.
        </AppText>
        <AppButton label="Cấp quyền Camera" onPress={requestPermission} />
      </View>
    );
  }

  const cfg = statusConfig[status];

  return (
    <View style={styles.container}>
      <View style={styles.cameraView}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="front"
          mute={true}
        />
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
          onPress={() => navigation.replace('Training', { assignmentId, exerciseIndex, recordVideo })}
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

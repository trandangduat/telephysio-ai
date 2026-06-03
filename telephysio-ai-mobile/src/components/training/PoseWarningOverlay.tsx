/**
 * @file PoseWarningOverlay.tsx
 * @description Lớp phủ cảnh báo tư thế hiển thị trên màn hình camera.
 * Hỗ trợ 3 trạng thái: ok, warn (cảnh báo nhẹ), stop (lỗi nghiêm trọng).
 * Được hiển thị TRONG khu vực camera thay vì rìa trên cùng.
 */

import React from 'react';
import { View, StyleSheet, Vibration, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../ui';
import { colors, radius, spacing } from '../../theme';

type PoseSeverity = 'ok' | 'warn' | 'stop';

interface PoseWarningOverlayProps {
    severity: PoseSeverity;
}

/**
 * Component hiển thị thông báo cảnh báo tư thế tập luyện.
 * Khi ở mức độ 'stop', thiết bị sẽ rung để cảnh báo người dùng.
 * 
 * @param {PoseWarningOverlayProps} props Thuộc tính của component
 * @param {PoseSeverity} props.severity Mức độ cảnh báo tư thế ('ok', 'warn', 'stop')
 * @return {React.FC<PoseWarningOverlayProps> | null} Component lớp phủ cảnh báo hoặc null
 */
export const PoseWarningOverlay: React.FC<PoseWarningOverlayProps> = ({ severity }) => {
    const { t } = useTranslation();

    if (severity === 'ok') return null;

    // Vibrate when severity = stop
    React.useEffect(() => {
        if (severity === 'stop') {
            Vibration.vibrate([0, 400, 100, 400]);
        }
    }, [severity]);

    const isStop = severity === 'stop';

    return (
        <View
            style={[
                styles.base,
                isStop ? styles.stop : styles.warn,
            ]}
        >
            <AppText
                variant={isStop ? 'headlineMd' : 'bodyMd'}
                color={isStop ? colors.onError : colors.onErrorContainer}
            >
                {isStop ? t('training.poseStop') : t('training.poseWarn')}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        position: 'absolute',
        alignSelf: 'center',
        top: '40%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        zIndex: 10,
    } as ViewStyle,
    warn: {
        backgroundColor: colors.errorContainer,
        borderColor: colors.error,
        borderWidth: 1,
    },
    stop: {
        backgroundColor: colors.error,
    },
});

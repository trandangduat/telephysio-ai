/**
 * VideoPreview — PiP card showing reference video, góc dưới phải.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from '../ui';
import { colors, radius, shadows, spacing } from '../../theme';

export const VideoPreview: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Placeholder — replace with actual Video component later */}
            <View style={styles.videoPlaceholder}>
                <AppText variant="labelSm" color={colors.onSurfaceVariant}>
          Video hướng dẫn
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.md,
        width: 120,
        height: 160,
        borderRadius: radius.xxl,
        overflow: 'hidden',
        backgroundColor: colors.surfaceContainerLowest,
        ...shadows.card,
        borderCurve: 'continuous',
    } as ViewStyle,
    videoPlaceholder: {
        flex: 1,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

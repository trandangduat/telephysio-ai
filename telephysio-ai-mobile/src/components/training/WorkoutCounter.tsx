/**
 * @file WorkoutCounter.tsx
 * @description Component hiển thị bộ đếm số lần tập và số hiệp hiện tại. 
 * Kèm theo thanh tiến trình (progress bar) thể hiện quá trình luyện tập của hiệp đó.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, ProgressBar } from '../ui';
import { colors, spacing } from '../../theme';

interface WorkoutCounterProps {
    currentRep: number;
    totalReps: number;
    currentSet: number;
    totalSets: number;
}

/**
 * Component hiển thị giao diện đếm số rep/set trong lúc luyện tập.
 * 
 * @param {WorkoutCounterProps} props Thuộc tính của component
 * @param {number} props.currentRep Số rep hiện tại đã hoàn thành
 * @param {number} props.totalReps Tổng số rep yêu cầu trong hiệp
 * @param {number} props.currentSet Số hiệp hiện tại
 * @param {number} props.totalSets Tổng số hiệp
 * @return {React.FC<WorkoutCounterProps>} Component bộ đếm luyện tập
 */
export const WorkoutCounter: React.FC<WorkoutCounterProps> = ({
    currentRep,
    totalReps,
    currentSet,
    totalSets,
}) => {
    return (
        <View style={styles.container}>
            <AppText variant="labelMd" color={colors.onSurfaceVariant}>
        HIỆP {currentSet}/{totalSets}
            </AppText>
            <View style={styles.repRow}>
                <AppText
                    variant="headlineXl"
                    style={{ fontVariant: ['tabular-nums'] }}
                >
                    {currentRep}
                </AppText>
                <AppText variant="headlineMd" color={colors.onSurfaceVariant}>
          /{totalReps}
                </AppText>
            </View>
            <ProgressBar progress={currentRep / totalReps} variant="standard" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.sm,
    },
    repRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.xs,
    },
});

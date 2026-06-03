/**
 * @file MilestoneRow.tsx
 * @description Component hiển thị một hàng mục tiêu (milestone) đơn lẻ với trạng thái đã hoàn thành (achieved) hoặc đang chờ (pending).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui';
import { colors, spacing } from '../../theme';

export interface Milestone {
    id: string;
    label: string;
    achieved: boolean;
    date?: string;
}

interface MilestoneRowProps {
    milestone: Milestone;
}

/**
 * Component hiển thị thông tin về một cột mốc (milestone).
 * 
 * @param {MilestoneRowProps} props Thuộc tính của component
 * @param {Milestone} props.milestone Dữ liệu cột mốc chứa id, nhãn, trạng thái và ngày hoàn thành
 * @return {React.FC<MilestoneRowProps>} Component hàng cột mốc
 */
export const MilestoneRow: React.FC<MilestoneRowProps> = ({ milestone }) => {
    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.dot,
                    { backgroundColor: milestone.achieved ? colors.tertiary : colors.outlineVariant },
                ]}
            />
            <View style={styles.content}>
                <AppText
                    variant="bodySm"
                    color={milestone.achieved ? colors.onSurface : colors.onSurfaceVariant}
                >
                    {milestone.label}
                </AppText>
                {milestone.date && (
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                        {milestone.date}
                    </AppText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    content: {
        flex: 1,
        gap: 2,
    },
});

/**
 * MilestoneRow — single milestone item with achieved/pending state.
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

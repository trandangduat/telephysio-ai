/**
 * SummaryTextCard — Level 2 floating card showing AI summary text.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '../ui';
import { colors, spacing } from '../../theme';

interface SummaryTextCardProps {
  text: string;
}

export const SummaryTextCard: React.FC<SummaryTextCardProps> = ({ text }) => {
  return (
    <Card level={2}>
      <View style={styles.iconRow}>
        <AppText variant="headlineMd">📊</AppText>
        <AppText variant="labelMd" color={colors.primary}>
          Tóm tắt AI
        </AppText>
      </View>
      <AppText variant="bodyLg" style={styles.text}>
        {text}
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    lineHeight: 26,
  },
});

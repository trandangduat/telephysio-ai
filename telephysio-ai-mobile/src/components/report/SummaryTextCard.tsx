/**
 * @file SummaryTextCard.tsx
 * @description Component thẻ nổi mức 2 dùng để hiển thị đoạn văn bản tóm tắt được tạo bởi AI.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '../ui';
import { colors, spacing } from '../../theme';

interface SummaryTextCardProps {
  text: string;
}

/**
 * Component hiển thị thẻ tóm tắt phân tích của AI.
 * 
 * @param {SummaryTextCardProps} props Thuộc tính của component
 * @param {string} props.text Nội dung tóm tắt do AI tạo ra
 * @return {React.FC<SummaryTextCardProps>} Component thẻ tóm tắt văn bản
 */
export const SummaryTextCard: React.FC<SummaryTextCardProps> = ({ text }) => {
  return (
    <Card level={2}>
      <View style={styles.iconRow}>
        <AppText variant="headlineMd">📊</AppText>
        <AppText variant="labelMd" color={colors.primary}>
          AI Summary
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

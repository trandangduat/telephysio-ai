/**
 * DoctorNoticeCard — Card Level 1 showing doctor notification/feedback.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, AppText, Badge } from '../ui';
import { colors, spacing } from '../../theme';

interface DoctorNoticeCardProps {
  doctorName?: string;
  message?: string;
  date?: string;
}

export const DoctorNoticeCard: React.FC<DoctorNoticeCardProps> = ({
  doctorName = 'BS. Nguyễn Thị Hoa',
  message = 'You are making good progress! This week, focus on your elbow range of motion. Remember to keep your movements slow and controlled.',
  date,
}) => {
  const { t } = useTranslation();

  return (
    <Card level={1}>
      <View style={styles.header}>
        <Badge variant="primary" label={t('home.newNoticeBadge')} />
        <AppText variant="labelSm" color={colors.onSurfaceVariant}>
          {date ?? t('common.today')}
        </AppText>
      </View>
      <AppText variant="bodySm" color={colors.onSurfaceVariant} style={styles.doctor}>
        {doctorName}
      </AppText>
      <AppText variant="bodyMd" style={styles.message}>
        {message}
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  doctor: {
    marginBottom: spacing.xs,
  },
  message: {
    lineHeight: 22,
  },
});

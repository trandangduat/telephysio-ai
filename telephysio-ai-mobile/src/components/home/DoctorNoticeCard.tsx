/**
 * @file DoctorNoticeCard.tsx
 * @description Component thẻ (card) mức 1 dùng để hiển thị thông báo, lời khuyên hoặc phản hồi từ bác sĩ.
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

/**
 * Component thẻ hiển thị thông báo từ bác sĩ.
 * 
 * @param {DoctorNoticeCardProps} props Thuộc tính của component
 * @param {string} [props.doctorName] Tên bác sĩ (Mặc định: 'BS. Nguyễn Thị Hoa')
 * @param {string} [props.message] Nội dung tin nhắn của bác sĩ
 * @param {string} [props.date] Ngày gửi thông báo
 * @return {React.FC<DoctorNoticeCardProps>} Component thẻ thông báo
 */
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

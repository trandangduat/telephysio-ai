/**
 * FeedbackScreen — UC6: submit post-workout feelings, read doctor feedback.
 *
 * PainScale → QuickSelect → Notes → Submit → Doctor Responses
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, AppButton, Card, Input } from '../../components/ui';
import { PainScaleButtons } from '../../components/feedback/PainScaleButtons';
import { QuickSelectChips } from '../../components/feedback/QuickSelectChips';
import { colors, spacing } from '../../theme';

interface DoctorResponse {
  id: string;
  doctorName: string;
  date: string;
  message: string;
}

const mockDoctorResponses: DoctorResponse[] = [
  {
    id: 'dr1',
    doctorName: 'BS. Nguyễn Thị Hoa',
    date: '01/05/2026',
    message:
      'Bạn đang tiến bộ rất tốt! Biên độ khuỷu tay đã cải thiện 12%. Tuần tới hãy tăng thêm 2 lần lặp mỗi hiệp.',
  },
  {
    id: 'dr2',
    doctorName: 'BS. Nguyễn Thị Hoa',
    date: '28/04/2026',
    message:
      'Tôi thấy bạn có báo đau nhẹ ở vùng khuỷu. Hãy giảm tốc độ và tập trung vào kiểm soát động tác. Nếu vẫn đau, liên hệ ngay.',
  },
];

export const FeedbackScreen: React.FC = () => {
  const { t } = useTranslation();
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const symptomOptions = [
    { id: 'pain',     label: t('symptoms.pain'),     description: t('symptoms.painDesc') },
    { id: 'stiff',    label: t('symptoms.stiff'),    description: t('symptoms.stiffDesc') },
    { id: 'swelling', label: t('symptoms.swelling'), description: t('symptoms.swellingDesc') },
    { id: 'tired',    label: t('symptoms.tired'),    description: t('symptoms.tiredDesc') },
    { id: 'good',     label: t('symptoms.good'),     description: t('symptoms.goodDesc') },
    { id: 'better',   label: t('symptoms.better'),   description: t('symptoms.betterDesc') },
  ];

  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = () => {
    Alert.alert(
      t('feedback.submitSuccessTitle'),
      t('feedback.submitSuccessMessage'),
      [{ text: t('common.ok') }],
    );
    setPainLevel(null);
    setSelectedSymptoms([]);
    setNotes('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pain Scale */}
        <View style={styles.section}>
          <AppText variant="headlineMd">{t('feedback.painTitle')}</AppText>
          <AppText variant="bodySm" color={colors.onSurfaceVariant}>
            {t('feedback.painDescription')}
          </AppText>
          <PainScaleButtons value={painLevel} onSelect={setPainLevel} />
        </View>

        {/* Quick Select */}
        <View style={styles.section}>
          <AppText variant="headlineMd">{t('feedback.symptomsTitle')}</AppText>
          <QuickSelectChips
            options={symptomOptions}
            selected={selectedSymptoms}
            onToggle={handleToggleSymptom}
          />
        </View>

        {/* Notes */}
        <Input
          label={t('feedback.notesLabel')}
          placeholder={t('feedback.notesPlaceholder')}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        {/* Submit */}
        <AppButton
          label={t('feedback.submitButton')}
          size="lg"
          onPress={handleSubmit}
          disabled={painLevel === null}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Doctor Responses */}
        <View style={styles.section}>
          <AppText variant="headlineMd">{t('feedback.doctorResponses')}</AppText>
          {mockDoctorResponses.map((resp) => (
            <Card level={1} key={resp.id}>
              <View style={styles.respHeader}>
                <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                  {resp.doctorName}
                </AppText>
                <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                  {resp.date}
                </AppText>
              </View>
              <AppText variant="bodyMd" style={styles.respMessage}>
                {resp.message}
              </AppText>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  respHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  respMessage: {
    lineHeight: 22,
  },
});

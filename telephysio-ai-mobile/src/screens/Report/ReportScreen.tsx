/**
 * ReportScreen — UC5: recovery progress report.
 *
 * SummaryTextCard (Level 2) → ProgressChart → CompletionRate → MilestoneList → HistoryList
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Card, SkeletonLoader } from '../../components/ui';
import { SummaryTextCard } from '../../components/report/SummaryTextCard';
import { ProgressChart } from '../../components/report/ProgressChart';
import { MilestoneRow } from '../../components/report/MilestoneRow';
import { colors, spacing } from '../../theme';
import {
  mockProgress,
  mockMilestones,
  mockSessionHistory,
} from '../../mocks/report.mock';

export const ReportScreen: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="headlineLg">{t('report.title')}</AppText>

        {/* Summary — render trước */}
        <SummaryTextCard text={mockProgress.summaryText} />

        {/* Chart — skeleton while loading */}
        {loading ? (
          <SkeletonLoader height={220} borderRadius={12} />
        ) : (
          <ProgressChart scores={mockProgress.weeklyScores} />
        )}

        {/* Completion Rate */}
        <Card level={1}>
          <AppText variant="labelMd" color={colors.onSurfaceVariant}>
            {t('report.completionRate')}
          </AppText>
          <View style={styles.completionRow}>
            <AppText
              variant="headlineXl"
              color={colors.primary}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {mockProgress.overallCompletion}%
            </AppText>
            <View style={styles.statsCol}>
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                {t('report.sessions', {
                  count: mockProgress.totalSessions,
                  minutes: mockProgress.totalMinutes,
                })}
              </AppText>
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                {t('report.avgAccuracy', {
                  percent: mockProgress.averageAccuracy,
                })}
              </AppText>
            </View>
          </View>
        </Card>

        {/* Milestones */}
        <View style={styles.section}>
          <AppText variant="headlineMd">{t('report.milestones')}</AppText>
          {mockMilestones.map((m) => (
            <MilestoneRow key={m.id} milestone={m} />
          ))}
        </View>

        {/* History */}
        <View style={styles.section}>
          <AppText variant="headlineMd">{t('report.history')}</AppText>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLoader key={i} height={60} style={{ marginBottom: spacing.sm }} />
              ))
            : mockSessionHistory.map((session) => (
                <Card level={1} key={session.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyInfo}>
                      <AppText variant="bodySm">{session.exerciseName}</AppText>
                      <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                        {session.date} · {session.duration}
                      </AppText>
                    </View>
                    <AppText
                      variant="labelMd"
                      color={colors.tertiary}
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {session.formAccuracy}%
                    </AppText>
                  </View>
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
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  statsCol: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  historyCard: {
    padding: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
});

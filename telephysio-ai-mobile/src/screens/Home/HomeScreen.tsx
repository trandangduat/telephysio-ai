/**
 * HomeScreen — UC1 (entry), UC6 (doctor notice)
 *
 * Layout: Header → TodayCard (Level 2) → RecoveryProgressBar → DoctorNoticeCard → WeekCalendar
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText, ProgressBar } from '../../components/ui';
import { TodayCard } from '../../components/home/TodayCard';
import { WeekCalendar } from '../../components/home/WeekCalendar';
import { DoctorNoticeCard } from '../../components/home/DoctorNoticeCard';
import { colors, spacing } from '../../theme';
import type { RootStackParamList, BottomTabParamList } from '../../navigation/types';

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeNavProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const userName = 'Minh An';

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const today = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineMd">{t('home.greeting', { name: userName })}</AppText>
          <AppText variant="bodySm" color={colors.onSurfaceVariant}>
            {today}
          </AppText>
        </View>

        {/* Today's Workout — Level 2 (floating) */}
        <TodayCard onStart={() => navigation.navigate('Calibration')} />

        {/* Recovery Progress */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <AppText variant="labelMd" color={colors.onSurfaceVariant}>
              {t('home.recoveryProgress')}
            </AppText>
            <AppText variant="labelMd" color={colors.tertiary}>
              72%
            </AppText>
          </View>
          <ProgressBar progress={0.72} variant="standard" />
        </View>

        {/* Doctor Notice */}
        <DoctorNoticeCard />

        {/* Week Calendar */}
        <View style={styles.section}>
          <AppText variant="labelMd" color={colors.onSurfaceVariant} style={styles.sectionLabel}>
            {t('home.weekSchedule')}
          </AppText>
          <WeekCalendar />
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

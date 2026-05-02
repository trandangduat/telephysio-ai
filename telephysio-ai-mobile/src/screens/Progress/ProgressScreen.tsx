import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { getActiveTreatmentPlan, getLatestProgress } from '../../services/firebase';
import type { TreatmentPlan, ProgressSnapshot } from '../../services/firebase/types';

export const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { uid } = useAuth();
  
  const [activeChart, setActiveChart] = useState<'Flexion' | 'Extension'>('Flexion');
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const [fetchedPlan, fetchedProgress] = await Promise.all([
          getActiveTreatmentPlan(uid),
          getLatestProgress(uid),
        ]);
        setPlan(fetchedPlan);
        setProgress(fetchedProgress);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Fallback values if progress is not yet recorded
  const consistency = progress?.weeklyConsistency ?? 0;
  const daysActive = Math.round((consistency / 100) * 7);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Unified Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DoctorChat' as any)}>
            <Ionicons name="chatbubbles-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile' as any)}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineLg" style={styles.pageTitle}>{t('progress.title', 'Your Recovery Journey')}</AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>
            {plan ? `Week ${plan.currentWeek} of ${plan.condition} • Phase ${plan.currentPhase}` : 'No active treatment plan'}
          </AppText>
        </View>

        {/* Weekly Consistency */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>{t('progress.weeklyConsistency', 'Weekly Consistency')}</AppText>
            <View style={styles.scoreBadge}>
              <AppText variant="labelSm" style={{ color: '#166534' }}>{consistency}% {t('progress.score', 'Score')}</AppText>
            </View>
          </View>
          
          <View style={styles.daysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.dayCircle, i < daysActive ? styles.dayCircleActive : {}]}>
                  <Ionicons name="checkmark" size={14} color={i < daysActive ? "#fff" : "transparent"} />
                </View>
                <AppText variant="labelSm" style={styles.dayLabel}>{day}</AppText>
              </View>
            ))}
          </View>
          
          <AppText variant="bodySm" style={styles.cardDesc}>
            {t('progress.greatJob', `Great job! You've hit your goals ${daysActive} out of 7 days this week.`)}
          </AppText>
        </View>

        {/* Range of Motion */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="headlineMd" style={styles.cardTitle}>
                {activeChart === 'Flexion' ? t('progress.rom', 'Range of Motion (Knee Flexion)') : t('progress.romExt', 'Range of Motion (Knee Extension)')}
              </AppText>
              <AppText variant="bodySm" style={styles.cardDesc}>
                {t('progress.romDesc', 'Measured in degrees via AI Analysis')} 
                ({activeChart === 'Flexion' ? `${progress?.romFlexion ?? 0}°` : `${progress?.romExtension ?? 0}°`})
              </AppText>
            </View>
            <View style={styles.toggleGroup}>
              <TouchableOpacity 
                style={[styles.toggleBtn, activeChart === 'Flexion' && styles.toggleBtnActive]}
                onPress={() => setActiveChart('Flexion')}
              >
                <AppText variant="labelSm" style={{ color: activeChart === 'Flexion' ? '#fff' : '#475569' }}>{t('progress.flexion', 'Flexion')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, activeChart === 'Extension' && styles.toggleBtnActive]}
                onPress={() => setActiveChart('Extension')}
              >
                <AppText variant="labelSm" style={{ color: activeChart === 'Extension' ? '#fff' : '#475569' }}>{t('progress.extension', 'Extension')}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fake Chart Placeholder */}
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartLine} />
            <View style={styles.chartLabels}>
              <AppText style={styles.chartLabelText}>Week 1</AppText>
              <AppText style={styles.chartLabelText}>Week 3</AppText>
              <AppText style={styles.chartLabelText}>Week 5</AppText>
              <AppText style={styles.chartLabelText}>Now</AppText>
            </View>
          </View>
        </View>

        {/* Strength Improvement */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md }}>
            <View style={styles.iconBox}>
              <Ionicons name="barbell-outline" size={20} color={colors.primary} />
            </View>
            <AppText variant="headlineMd" style={styles.cardTitle}>{t('progress.strength', 'Strength Improvement')}</AppText>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressHeader}>
              <AppText variant="labelMd" style={styles.progressLabel}>{t('progress.quadriceps', 'Quadriceps Strength')}</AppText>
              <AppText variant="labelMd" style={{ color: colors.primary }}>{progress?.quadricepsStrength ?? 0}%</AppText>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress?.quadricepsStrength ?? 0}%` }]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressHeader}>
              <AppText variant="labelMd" style={styles.progressLabel}>{t('progress.hamstring', 'Hamstring Stability')}</AppText>
              <AppText variant="labelMd" style={{ color: colors.primary }}>{progress?.hamstringStability ?? 0}%</AppText>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress?.hamstringStability ?? 0}%` }]} />
            </View>
          </View>
        </View>

        {/* AI Insight */}
        {progress?.aiInsight && (
          <View style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <AppText variant="headlineMd" style={{ color: '#fff', fontWeight: '700' }}>{t('progress.aiInsight', 'AI Recovery Insight')}</AppText>
            </View>
            <AppText variant="bodyMd" style={{ color: '#e0f2fe', lineHeight: 22, marginBottom: spacing.lg }}>
              {progress.aiInsight}
            </AppText>
            <TouchableOpacity style={styles.insightBtn} onPress={() => navigation.navigate('Workout' as any)}>
              <AppText variant="labelMd" style={{ color: colors.primary }}>{t('progress.viewRecommended', 'View Recommended Exercises')}</AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Milestones */}
        <AppText variant="headlineMd" style={styles.sectionTitle}>{t('progress.recentMilestones', 'Recent Milestones')}</AppText>

        <View style={styles.milestoneCard}>
          <View style={styles.milestoneIconGreen}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="labelMd" style={styles.milestoneTitle}>{t('progress.flexionGoal', '120° Flexion Goal')}</AppText>
            <AppText variant="bodySm" style={styles.milestoneDesc}>{t('progress.flexionGoalDesc', 'Achieved recently')}</AppText>
          </View>
        </View>

        <View style={styles.milestoneCard}>
          <View style={styles.milestoneIconBlue}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="labelMd" style={styles.milestoneTitle}>{t('progress.streak', 'Consistency Streak')}</AppText>
            <AppText variant="bodySm" style={styles.milestoneDesc}>{t('progress.streakDesc', `${daysActive} days active this week`)}</AppText>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  header: { marginBottom: spacing.xs },
  pageTitle: { color: colors.primary, fontWeight: '800', fontSize: 24, marginBottom: 4 },
  pageSubtitle: { color: '#64748b' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  scoreBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  cardDesc: { color: '#475569', marginTop: spacing.sm },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm },
  dayCol: { alignItems: 'center', gap: 8 },
  dayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.primary },
  dayLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },

  toggleGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.primary },

  chartPlaceholder: { height: 160, marginTop: spacing.md, justifyContent: 'flex-end' },
  chartLine: { height: '100%', borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#cbd5e1', position: 'absolute', bottom: 20, left: 0, right: 0, borderRadius: 4 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 10 },
  chartLabelText: { color: '#94a3b8', fontSize: 10 },

  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  progressRow: { marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { color: '#475569', fontWeight: '600' },
  progressBarTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  insightBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },

  sectionTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18, marginTop: spacing.sm, marginBottom: -spacing.sm },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: spacing.md, borderRadius: 16, gap: 16 },
  milestoneIconGreen: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  milestoneIconBlue: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  milestoneTitle: { color: '#0f172a', fontWeight: '700', marginBottom: 2 },
  milestoneDesc: { color: '#64748b' },
});

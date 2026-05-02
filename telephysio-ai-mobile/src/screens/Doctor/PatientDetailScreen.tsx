/**
 * PatientDetailScreen — Detailed view of a single patient's recovery.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/types';

const SESSION_HISTORY = [
  { date: 'May 2', exercises: 6, accuracy: 89, duration: '42 min', pain: 3 },
  { date: 'May 1', exercises: 5, accuracy: 85, duration: '38 min', pain: 4 },
  { date: 'Apr 30', exercises: 6, accuracy: 91, duration: '45 min', pain: 2 },
  { date: 'Apr 29', exercises: 4, accuracy: 78, duration: '30 min', pain: 5 },
  { date: 'Apr 28', exercises: 6, accuracy: 87, duration: '40 min', pain: 3 },
];

export const PatientDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const route = useRoute<RouteProp<DoctorStackParamList, 'PatientDetail'>>();
  const { t } = useTranslation();
  const { patientName } = route.params;
  const [activeChart, setActiveChart] = useState('ROM');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.navTitle}>Patient Details</AppText>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorChat')}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={36} color="#94a3b8" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headlineMd" style={styles.profileName}>{patientName}</AppText>
            <AppText variant="bodySm" style={styles.profileCondition}>ACL Recovery · Week 6 · Phase 2</AppText>
            <View style={styles.profileBadges}>
              <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                <AppText variant="labelSm" style={{ color: '#166534', fontSize: 10 }}>On Track</AppText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
                <AppText variant="labelSm" style={{ color: colors.primary, fontSize: 10 }}>18 Sessions</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {[
            { label: 'Accuracy', value: '87%', icon: 'analytics', color: colors.primary },
            { label: 'Sessions', value: '18', icon: 'calendar', color: '#0f766e' },
            { label: 'Streak', value: '14d', icon: 'flame', color: '#b45309' },
            { label: 'Pain Avg', value: '3/10', icon: 'pulse', color: '#dc2626' },
          ].map((stat) => (
            <View key={stat.label} style={styles.quickStatItem}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <AppText variant="headlineMd" style={[styles.quickStatValue, { color: stat.color }]}>{stat.value}</AppText>
              <AppText variant="bodySm" style={styles.quickStatLabel}>{stat.label}</AppText>
            </View>
          ))}
        </View>

        {/* Chart Toggle */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>Recovery Progress</AppText>
            <View style={styles.toggleGroup}>
              {['ROM', 'Pain', 'Accuracy'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.toggleBtn, activeChart === tab && styles.toggleBtnActive]}
                  onPress={() => setActiveChart(tab)}
                >
                  <AppText variant="labelSm" style={{ color: activeChart === tab ? '#fff' : '#475569' }}>{tab}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chart Placeholder */}
          <View style={styles.chartArea}>
            <View style={styles.chartLine} />
            <View style={styles.chartLabels}>
              <AppText style={styles.chartLabelText}>Week 1</AppText>
              <AppText style={styles.chartLabelText}>Week 3</AppText>
              <AppText style={styles.chartLabelText}>Week 5</AppText>
              <AppText style={styles.chartLabelText}>Now</AppText>
            </View>
          </View>
        </View>

        {/* Session History */}
        <View style={styles.card}>
          <AppText variant="headlineMd" style={[styles.cardTitle, { marginBottom: spacing.md }]}>Session History</AppText>

          {SESSION_HISTORY.map((session, i) => (
            <View key={i} style={styles.sessionRow}>
              <View style={styles.sessionDate}>
                <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>{session.date}</AppText>
              </View>
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Ionicons name="barbell-outline" size={12} color="#64748b" />
                  <AppText variant="bodySm" style={styles.sessionStatText}>{session.exercises} exercises</AppText>
                </View>
                <View style={styles.sessionStat}>
                  <Ionicons name="analytics-outline" size={12} color="#64748b" />
                  <AppText variant="bodySm" style={styles.sessionStatText}>{session.accuracy}%</AppText>
                </View>
                <View style={styles.sessionStat}>
                  <Ionicons name="time-outline" size={12} color="#64748b" />
                  <AppText variant="bodySm" style={styles.sessionStatText}>{session.duration}</AppText>
                </View>
                <View style={styles.sessionStat}>
                  <Ionicons name="pulse-outline" size={12} color={session.pain > 5 ? '#dc2626' : '#64748b'} />
                  <AppText variant="bodySm" style={[styles.sessionStatText, session.pain > 5 && { color: '#dc2626' }]}>Pain {session.pain}</AppText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionPrimary} onPress={() => Alert.alert('Assign', `Assign new exercises to ${patientName}`)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>Assign Exercises</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary} onPress={() => navigation.navigate('DoctorChat')}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>Send Message</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  navBackBtn: { padding: 4, marginLeft: -4 },
  navTitle: { color: colors.onSurface, fontWeight: '700', fontSize: 18 },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0' },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: '#0f172a', fontWeight: '800', fontSize: 20 },
  profileCondition: { color: '#64748b', marginTop: 4, marginBottom: 8 },
  profileBadges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },

  quickStats: { flexDirection: 'row', gap: spacing.sm },
  quickStatItem: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', gap: 4 },
  quickStatValue: { fontWeight: '800', fontSize: 18 },
  quickStatLabel: { color: '#64748b', fontSize: 10 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  toggleGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.primary },

  chartArea: { height: 140, justifyContent: 'flex-end' },
  chartLine: { height: '100%', borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#cbd5e1', position: 'absolute', bottom: 20, left: 0, right: 0, borderRadius: 4 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 10 },
  chartLabelText: { color: '#94a3b8', fontSize: 10 },

  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  sessionDate: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sessionStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sessionStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionStatText: { color: '#64748b', fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16 },
  actionSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e0f2fe', paddingVertical: 16, borderRadius: 16 },
});

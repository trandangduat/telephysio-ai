/**
 * DoctorDashboardScreen — Overview of all patients & stats.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { DoctorStackParamList } from '../../navigation/types';

const STATS = [
  { label: 'Active Patients', value: '24', icon: 'people', color: colors.primary, bg: '#e0f2fe' },
  { label: 'Sessions Today', value: '8', icon: 'calendar', color: '#0f766e', bg: '#ccfbf1' },
  { label: 'Pending Reviews', value: '5', icon: 'clipboard', color: '#b45309', bg: '#fef3c7' },
  { label: 'Avg Accuracy', value: '87%', icon: 'analytics', color: '#7c3aed', bg: '#ede9fe' },
];

const RECENT_PATIENTS = [
  { id: '1', name: 'Cody Li', condition: 'ACL Recovery - Week 6', progress: 85, status: 'active' },
  { id: '2', name: 'Emma Wilson', condition: 'Rotator Cuff - Week 3', progress: 62, status: 'active' },
  { id: '3', name: 'James Park', condition: 'Knee Replacement - Week 8', progress: 91, status: 'review' },
  { id: '4', name: 'Maria Santos', condition: 'Ankle Sprain - Week 2', progress: 45, status: 'active' },
];

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { t } = useTranslation();
  const { userName, switchRole } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
          <View style={styles.roleBadge}>
            <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700', fontSize: 9 }}>DOCTOR</AppText>
          </View>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DoctorChat')}>
            <Ionicons name="chatbubbles-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notifDot} />
            <Ionicons name="notifications-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('DoctorProfile')}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.header}>
          <AppText variant="bodyMd" style={styles.greeting}>Good morning,</AppText>
          <AppText variant="headlineLg" style={styles.doctorName}>{userName}</AppText>
          <AppText variant="bodySm" style={styles.subtitle}>Orthopedic Physiotherapist</AppText>
        </View>

        {/* Role Switcher (Dev only) */}
        <TouchableOpacity style={styles.devSwitch} onPress={() => switchRole('patient')}>
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <AppText variant="labelSm" style={{ color: colors.primary }}>Switch to Patient View</AppText>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <AppText variant="headlineLg" style={styles.statValue}>{stat.value}</AppText>
              <AppText variant="bodySm" style={styles.statLabel}>{stat.label}</AppText>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>Today's Schedule</AppText>
            <View style={styles.todayBadge}>
              <AppText variant="labelSm" style={{ color: colors.primary }}>8 sessions</AppText>
            </View>
          </View>

          {[
            { time: '09:00', patient: 'Cody Li', type: 'Virtual Session', status: 'upcoming' },
            { time: '10:30', patient: 'Emma Wilson', type: 'Progress Review', status: 'upcoming' },
            { time: '14:00', patient: 'James Park', type: 'Post-Op Assessment', status: 'upcoming' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.scheduleItem}>
              <View style={styles.scheduleTimeBox}>
                <AppText variant="labelMd" style={styles.scheduleTime}>{item.time}</AppText>
              </View>
              <View style={styles.scheduleInfo}>
                <AppText variant="labelMd" style={styles.scheduleName}>{item.patient}</AppText>
                <AppText variant="bodySm" style={styles.scheduleType}>{item.type}</AppText>
              </View>
              <View style={[styles.scheduleStatusDot, { backgroundColor: '#10b981' }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Patients */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="headlineMd" style={styles.cardTitle}>Recent Patients</AppText>
            <TouchableOpacity>
              <AppText variant="labelSm" style={{ color: colors.primary }}>View All</AppText>
            </TouchableOpacity>
          </View>

          {RECENT_PATIENTS.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientRow}
              onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id, patientName: patient.name })}
            >
              <View style={styles.patientAvatar}>
                <Ionicons name="person" size={18} color="#94a3b8" />
              </View>
              <View style={styles.patientInfo}>
                <AppText variant="labelMd" style={styles.patientName}>{patient.name}</AppText>
                <AppText variant="bodySm" style={styles.patientCondition}>{patient.condition}</AppText>
              </View>
              <View style={styles.patientProgress}>
                <AppText variant="labelMd" style={{ color: colors.primary }}>{patient.progress}%</AppText>
                <View style={styles.miniBarTrack}>
                  <View style={[styles.miniBarFill, { width: `${patient.progress}%` }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Alerts */}
        <View style={[styles.card, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Ionicons name="warning-outline" size={20} color="#dc2626" />
            <AppText variant="headlineMd" style={{ color: '#991b1b', fontWeight: '700', fontSize: 16 }}>Attention Required</AppText>
          </View>
          <AppText variant="bodyMd" style={{ color: '#7f1d1d', lineHeight: 22 }}>
            Maria Santos reported increased pain (Level 7) during yesterday's ankle exercises. Consider adjusting her treatment plan.
          </AppText>
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
  roleBadge: { backgroundColor: '#0f766e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4, position: 'relative' },
  notifDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', zIndex: 1 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  header: { marginBottom: spacing.xs },
  greeting: { color: '#64748b', marginBottom: 2 },
  doctorName: { color: colors.onSurface, fontWeight: '800', fontSize: 26 },
  subtitle: { color: '#64748b', marginTop: 4 },

  devSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e0f2fe', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0' },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { color: colors.onSurface, fontWeight: '800', fontSize: 28, marginBottom: 2 },
  statLabel: { color: '#64748b' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  todayBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },

  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  scheduleTimeBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  scheduleTime: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  scheduleInfo: { flex: 1 },
  scheduleName: { color: '#0f172a', fontWeight: '700' },
  scheduleType: { color: '#64748b', marginTop: 2 },
  scheduleStatusDot: { width: 10, height: 10, borderRadius: 5 },

  patientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  patientInfo: { flex: 1 },
  patientName: { color: '#0f172a', fontWeight: '700' },
  patientCondition: { color: '#64748b', marginTop: 2 },
  patientProgress: { alignItems: 'flex-end', gap: 4 },
  miniBarTrack: { width: 50, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
});

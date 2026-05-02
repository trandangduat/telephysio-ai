/**
 * DoctorPatientsScreen — Patient list + progress tracking.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/types';

const ALL_PATIENTS = [
  { id: '1', name: 'Cody Li', condition: 'ACL Recovery', week: 6, phase: 2, progress: 85, sessions: 18, accuracy: 87, lastActive: 'Today', status: 'on-track' as const },
  { id: '2', name: 'Emma Wilson', condition: 'Rotator Cuff', week: 3, phase: 1, progress: 62, sessions: 9, accuracy: 79, lastActive: 'Yesterday', status: 'on-track' as const },
  { id: '3', name: 'James Park', condition: 'Knee Replacement', week: 8, phase: 3, progress: 91, sessions: 24, accuracy: 92, lastActive: 'Today', status: 'ahead' as const },
  { id: '4', name: 'Maria Santos', condition: 'Ankle Sprain', week: 2, phase: 1, progress: 45, sessions: 5, accuracy: 71, lastActive: '3 days ago', status: 'at-risk' as const },
  { id: '5', name: 'Alex Chen', condition: 'Shoulder Rehab', week: 4, phase: 2, progress: 73, sessions: 12, accuracy: 83, lastActive: 'Today', status: 'on-track' as const },
];

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', color: '#166534', bg: '#dcfce7' },
  'ahead': { label: 'Ahead', color: '#1e40af', bg: '#dbeafe' },
  'at-risk': { label: 'At Risk', color: '#991b1b', bg: '#fef2f2' },
};

export const DoctorPatientsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = ALL_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DoctorChat')}>
            <Ionicons name="chatbubbles-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('DoctorProfile')}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineLg" style={styles.pageTitle}>Patients Progress</AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>Track recovery of all patients</AppText>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name or condition..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="headlineMd" style={styles.summaryValue}>{ALL_PATIENTS.length}</AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>Total</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="headlineMd" style={[styles.summaryValue, { color: '#166534' }]}>{ALL_PATIENTS.filter(p => p.status === 'on-track').length}</AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>On Track</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="headlineMd" style={[styles.summaryValue, { color: '#991b1b' }]}>{ALL_PATIENTS.filter(p => p.status === 'at-risk').length}</AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>At Risk</AppText>
          </View>
        </View>

        {/* Patient Cards */}
        {filtered.map((patient) => {
          const statusCfg = STATUS_CONFIG[patient.status];
          return (
            <TouchableOpacity
              key={patient.id}
              style={styles.card}
              onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id, patientName: patient.name })}
            >
              <View style={styles.cardTop}>
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={20} color="#94a3b8" />
                </View>
                <View style={styles.patientInfo}>
                  <AppText variant="labelMd" style={styles.patientName}>{patient.name}</AppText>
                  <AppText variant="bodySm" style={styles.patientCondition}>
                    {patient.condition} · Week {patient.week} · Phase {patient.phase}
                  </AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <AppText variant="labelSm" style={{ color: statusCfg.color, fontSize: 10, fontWeight: '700' }}>{statusCfg.label}</AppText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <AppText variant="bodySm" style={styles.progressLabel}>Overall Progress</AppText>
                  <AppText variant="labelMd" style={{ color: colors.primary }}>{patient.progress}%</AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${patient.progress}%` }]} />
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.statText}>{patient.sessions} sessions</AppText>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="analytics-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.statText}>{patient.accuracy}% accuracy</AppText>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.statText}>{patient.lastActive}</AppText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  header: { marginBottom: spacing.xs },
  pageTitle: { color: colors.primary, fontWeight: '800', fontSize: 24, marginBottom: 4 },
  pageSubtitle: { color: '#64748b' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },

  summaryRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.onSurface, fontWeight: '800', fontSize: 22 },
  summaryLabel: { color: '#64748b', marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  patientInfo: { flex: 1 },
  patientName: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  patientCondition: { color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },

  progressSection: { marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#64748b' },
  progressTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  statsRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#64748b' },
});

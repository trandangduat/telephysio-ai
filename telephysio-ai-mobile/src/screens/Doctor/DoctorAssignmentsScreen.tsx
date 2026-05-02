/**
 * DoctorAssignmentsScreen — Create, edit, assign exercises to patients.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/types';

const TEMPLATES = [
  { id: '1', name: 'ACL Recovery - Phase 2', exercises: 6, duration: '45 min', patients: 4, color: colors.primary },
  { id: '2', name: 'Post-Op Knee Flexion', exercises: 4, duration: '30 min', patients: 2, color: '#0f766e' },
  { id: '3', name: 'Rotator Cuff Rehab', exercises: 5, duration: '35 min', patients: 3, color: '#7c3aed' },
  { id: '4', name: 'Ankle Stability Program', exercises: 3, duration: '20 min', patients: 1, color: '#b45309' },
];

const RECENT_ASSIGNS = [
  { patient: 'Cody Li', template: 'ACL Recovery - Phase 2', date: 'Today', status: 'active' },
  { patient: 'Emma Wilson', template: 'Rotator Cuff Rehab', date: 'Yesterday', status: 'active' },
  { patient: 'James Park', template: 'Post-Op Knee Flexion', date: '2 days ago', status: 'completed' },
];

export const DoctorAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('templates');

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
          <AppText variant="headlineLg" style={styles.pageTitle}>Assignments</AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>Create and manage exercise protocols</AppText>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]}
            onPress={() => setActiveTab('templates')}
          >
            <AppText variant="labelMd" style={{ color: activeTab === 'templates' ? '#fff' : '#475569' }}>Templates</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'assigned' && styles.tabBtnActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <AppText variant="labelMd" style={{ color: activeTab === 'assigned' ? '#fff' : '#475569' }}>Assigned</AppText>
          </TouchableOpacity>
        </View>

        {activeTab === 'templates' ? (
          <>
            {/* Create New */}
            <TouchableOpacity style={styles.createBtn} onPress={() => Alert.alert('New Template', 'Exercise template editor coming soon.')}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>Create New Template</AppText>
            </TouchableOpacity>

            {/* Template Cards */}
            {TEMPLATES.map((tpl) => (
              <TouchableOpacity key={tpl.id} style={styles.card} onPress={() => Alert.alert(tpl.name, `${tpl.exercises} exercises · ${tpl.duration}`)}>
                <View style={styles.cardRow}>
                  <View style={[styles.templateIcon, { backgroundColor: tpl.color + '20' }]}>
                    <Ionicons name="barbell-outline" size={24} color={tpl.color} />
                  </View>
                  <View style={styles.templateInfo}>
                    <AppText variant="labelMd" style={styles.templateName}>{tpl.name}</AppText>
                    <AppText variant="bodySm" style={styles.templateMeta}>
                      {tpl.exercises} exercises · {tpl.duration} · {tpl.patients} patients
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </View>

                <View style={styles.templateActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Edit', `Editing ${tpl.name}`)}>
                    <Ionicons name="pencil-outline" size={16} color="#475569" />
                    <AppText variant="labelSm" style={{ color: '#475569' }}>Edit</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.assignBtn]} onPress={() => Alert.alert('Assign', `Assigning "${tpl.name}" to patients.`)}>
                    <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                    <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: '700' }}>Assign</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Duplicate', `Duplicating ${tpl.name}`)}>
                    <Ionicons name="copy-outline" size={16} color="#475569" />
                    <AppText variant="labelSm" style={{ color: '#475569' }}>Duplicate</AppText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            {/* Recent Assignments */}
            {RECENT_ASSIGNS.map((assign, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.assignRow}>
                  <View style={styles.assignAvatar}>
                    <Ionicons name="person" size={16} color="#94a3b8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="labelMd" style={styles.assignPatient}>{assign.patient}</AppText>
                    <AppText variant="bodySm" style={styles.assignTemplate}>{assign.template}</AppText>
                    <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 2 }}>{assign.date}</AppText>
                  </View>
                  <View style={[styles.statusBadge, assign.status === 'completed' ? styles.statusCompleted : styles.statusActive]}>
                    <AppText variant="labelSm" style={{ color: assign.status === 'completed' ? '#166534' : colors.primary, fontSize: 10 }}>
                      {assign.status === 'completed' ? 'Completed' : 'Active'}
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
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

  tabToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.primary },

  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  templateInfo: { flex: 1 },
  templateName: { color: '#0f172a', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  templateMeta: { color: '#64748b' },

  templateActions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f8fafc' },
  assignBtn: { backgroundColor: '#e0f2fe' },

  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  assignPatient: { color: '#0f172a', fontWeight: '700' },
  assignTemplate: { color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusActive: { backgroundColor: '#e0f2fe' },
  statusCompleted: { backgroundColor: '#dcfce7' },
});

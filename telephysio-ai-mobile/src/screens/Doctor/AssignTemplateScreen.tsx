import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { DoctorStackParamList } from '../../navigation/types';
import type { UserProfile, ExerciseTemplate } from '../../services/firebase/types';
import {
  getPatients,
  getExerciseTemplates,
  createAssignment,
} from '../../services/firebase';

type AssignTemplateNavProp = NativeStackNavigationProp<DoctorStackParamList, 'AssignTemplate'>;
type AssignTemplateRouteProp = RouteProp<DoctorStackParamList, 'AssignTemplate'>;

export const AssignTemplateScreen: React.FC = () => {
  const navigation = useNavigation<AssignTemplateNavProp>();
  const route = useRoute<AssignTemplateRouteProp>();
  const { uid } = useAuth();

  const { templateId, templateName } = route.params;

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [template, setTemplate] = useState<ExerciseTemplate | null>(null);
  const [assignmentName, setAssignmentName] = useState(templateName);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [uid]);

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [patientsData, templatesData] = await Promise.all([
        getPatients(uid),
        getExerciseTemplates(uid),
      ]);
      setPatients(patientsData);
      const found = templatesData.find(t => t.id === templateId);
      setTemplate(found || null);
      if (found) {
        setAssignmentName(found.name);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!uid) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }
    if (!selectedPatientId) {
      Alert.alert('Error', 'Please select a patient first');
      return;
    }
    if (!template) {
      Alert.alert('Error', 'Template data is not loaded yet. Please try again.');
      return;
    }

    const selectedPatient = patients.find(p => p.uid === selectedPatientId);
    if (!selectedPatient) {
      Alert.alert('Error', 'Selected patient not found');
      return;
    }

    Alert.alert(
      'Confirm Assignment',
      `Assign "${templateName}" to ${selectedPatient.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            setAssigning(true);
            try {
              await createAssignment({
                doctorId: uid,
                patientId: selectedPatientId,
                templateName: assignmentName,
                exercises: template.exercises,
                totalDuration: template.totalDuration,
                status: 'active',
              });
              Alert.alert('Success', `Exercises assigned to ${selectedPatient.displayName}!`, [
                { text: 'OK', onPress: () => navigation.popToTop() },
              ]);
            } catch (error) {
              console.error('Error assigning template:', error);
              Alert.alert('Error', 'Failed to assign template. Please try again.');
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Assign Template</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Info */}
        <View style={styles.templateCard}>
          <View style={styles.templateIcon}>
            <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.templateInfo}>
            <AppText variant="headlineMd" style={styles.templateName}>{templateName}</AppText>
            <AppText variant="bodySm" style={styles.templateMeta}>
              {template?.exercises.length || 0} exercises - {template?.totalDuration || '0 min'}
            </AppText>
          </View>
        </View>

        {/* Assignment Name Input */}
        <View style={styles.section}>
          <AppText variant="labelMd" style={styles.sectionLabel}>ASSIGNMENT NAME</AppText>
          <TextInput
            style={[styles.searchBox, { fontSize: 16, fontWeight: '500', color: '#0f172a' }]}
            value={assignmentName}
            onChangeText={setAssignmentName}
            placeholder="e.g. Morning routine for John"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Select Patient */}
        <View style={styles.section}>
          <AppText variant="labelMd" style={styles.sectionLabel}>SELECT PATIENT</AppText>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredPatients.length > 0 ? filteredPatients.map(patient => {
            const isSelected = selectedPatientId === patient.uid;
            return (
              <TouchableOpacity
                key={patient.uid}
                style={[styles.patientCard, isSelected && styles.patientCardSelected]}
                onPress={() => setSelectedPatientId(patient.uid)}
              >
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={20} color={isSelected ? colors.primary : '#94a3b8'} />
                </View>
                <View style={styles.patientInfo}>
                  <AppText variant="labelMd" style={styles.patientName}>{patient.displayName}</AppText>
                  <AppText variant="bodySm" style={styles.patientMeta}>
                    {patient.email}
                  </AppText>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          }) : (
            <AppText variant="bodyMd" style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
              No patients found.
            </AppText>
          )}
        </View>
      </ScrollView>

      {/* Assign Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.assignBtn, !selectedPatientId && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={!selectedPatientId || assigning}
        >
          {assigning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>
                Assign Template
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: { flex: 1 },
  templateName: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  templateMeta: { color: '#64748b', marginTop: 2 },

  section: {},
  sectionLabel: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },

  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.sm,
  },
  patientCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#f8faff',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: { flex: 1 },
  patientName: { color: '#0f172a', fontWeight: '600' },
  patientMeta: { color: '#64748b', fontSize: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  bottomBar: {
    padding: spacing.gutter,
    paddingBottom: spacing.xl,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  assignBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
});

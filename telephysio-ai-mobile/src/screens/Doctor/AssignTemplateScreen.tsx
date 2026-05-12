import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { DoctorStackParamList } from '../../navigation/types';
import type { UserProfile, ExerciseTemplate, Exercise } from '../../services/firebase/types';
import {
  getAllPatients,
  getExerciseTemplates,
  createAssignment,
} from '../../services/firebase';

type AssignTemplateNavProp = NativeStackNavigationProp<DoctorStackParamList, 'AssignTemplate'>;
type AssignTemplateRouteProp = RouteProp<DoctorStackParamList, 'AssignTemplate'>;

export const AssignTemplateScreen: React.FC = () => {
  const navigation = useNavigation<AssignTemplateNavProp>();
  const route = useRoute<AssignTemplateRouteProp>();
  const { uid } = useAuth();

  const initialTemplateId = route.params?.templateId;

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [allPatients, setAllPatients] = useState<UserProfile[]>([]);
  const [allTemplates, setAllTemplates] = useState<ExerciseTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    initialTemplateId ? [initialTemplateId] : []
  );
  // Multi-select patients
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, [uid]);

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [patientsData, templatesData] = await Promise.all([
        getAllPatients(),
        getExerciseTemplates(uid),
      ]);
      setAllPatients(patientsData);
      setAllTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const togglePatient = (id: string) => {
    setSelectedPatientIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const getCombinedDetails = () => {
    const selected = allTemplates.filter(t => selectedTemplateIds.includes(t.id));
    const allEx: Exercise[] = [];
    let totalMins = 0;
    selected.forEach(t => {
      allEx.push(...(t.exercises || []));
      const mins = parseInt(t.totalDuration) || 0;
      totalMins += mins;
    });
    return {
      exercises: allEx,
      duration: `${totalMins} min`,
      names: selected.map(t => t.name).join(' + '),
    };
  };

  // Smart search: match email OR name, case-insensitive, partial match
  const filteredPatients = searchQuery.trim()
    ? allPatients.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          (p.email || '').toLowerCase().includes(q) ||
          (p.displayName || '').toLowerCase().includes(q)
        );
      })
    : allPatients;

  const handleAssign = async () => {
    if (!uid) return;
    if (selectedTemplateIds.length === 0) {
      Alert.alert('Error', 'Please select at least one template');
      return;
    }
    if (selectedPatientIds.length === 0) {
      Alert.alert('Error', 'Please select at least one patient');
      return;
    }

    const { exercises, duration, names } = getCombinedDetails();

    setAssigning(true);
    try {
      // Create one assignment per selected patient
      await Promise.all(
        selectedPatientIds.map(patientId =>
          createAssignment({
            doctorId: uid,
            patientId,
            templateName: names,
            exercises,
            totalDuration: duration,
            status: 'active',
          })
        )
      );

      const patientNames = allPatients
        .filter(p => selectedPatientIds.includes(p.uid))
        .map(p => p.displayName || p.email)
        .join(', ');

      navigation.goBack();
      setTimeout(() => {
        if (Platform.OS !== 'web') {
          Alert.alert('Success', `Assigned to: ${patientNames}`);
        }
      }, 300);
    } catch (error) {
      console.error('Error assigning:', error);
      Alert.alert('Error', 'Failed to assign templates.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const { exercises, duration } = getCombinedDetails();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Assign Session</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Select Templates */}
        <View style={styles.section}>
          <AppText variant="labelMd" style={styles.sectionLabel}>
            STEP 1: SELECT TEMPLATES ({selectedTemplateIds.length})
          </AppText>
          <View style={styles.listBox}>
            {allTemplates.map(tpl => {
              const isSelected = selectedTemplateIds.includes(tpl.id);
              return (
                <TouchableOpacity
                  key={tpl.id}
                  style={[styles.rowItem, isSelected && styles.rowItemActive]}
                  onPress={() => toggleTemplate(tpl.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText variant="labelMd" style={[styles.rowName, isSelected && { color: colors.primary }]}>
                      {tpl.name}
                    </AppText>
                    <AppText variant="bodySm" style={styles.rowMeta}>
                      {tpl.exercises?.length || 0} exercises · {tpl.totalDuration}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary Box */}
        {selectedTemplateIds.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryStat}>
              <AppText variant="labelSm" style={styles.summaryLabel}>TOTAL EXERCISES</AppText>
              <AppText variant="headlineMd" style={styles.summaryValue}>{exercises.length}</AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <AppText variant="labelSm" style={styles.summaryLabel}>TOTAL DURATION</AppText>
              <AppText variant="headlineMd" style={styles.summaryValue}>{duration}</AppText>
            </View>
          </View>
        )}

        {/* Step 2: Select Patients */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <AppText variant="labelMd" style={styles.sectionLabel}>
              STEP 2: SELECT PATIENTS ({selectedPatientIds.length} selected)
            </AppText>
            {selectedPatientIds.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedPatientIds([])}>
                <AppText variant="labelSm" style={{ color: '#ef4444', fontSize: 11 }}>Clear all</AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* Search box */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email or name..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Patient list */}
          {filteredPatients.length === 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="person-outline" size={36} color="#cbd5e1" />
              <AppText variant="bodySm" style={{ color: '#94a3b8', marginTop: 8 }}>
                {searchQuery ? 'No patients match your search.' : 'No patients found in database.'}
              </AppText>
            </View>
          ) : (
            <View style={styles.listBox}>
              {filteredPatients.map(patient => {
                const isSelected = selectedPatientIds.includes(patient.uid);
                const initial = (patient.displayName || patient.email || '?')[0].toUpperCase();
                return (
                  <TouchableOpacity
                    key={patient.uid}
                    style={[styles.patientRow, isSelected && styles.patientRowActive]}
                    onPress={() => togglePatient(patient.uid)}
                    activeOpacity={0.8}
                  >
                    {/* Avatar */}
                    <View style={[styles.patientAvatar, isSelected && { backgroundColor: colors.primary + '22' }]}>
                      <AppText style={{ fontSize: 16, fontWeight: '700', color: isSelected ? colors.primary : '#94a3b8' }}>
                        {initial}
                      </AppText>
                    </View>
                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <AppText variant="labelMd" style={[styles.patientName, isSelected && { color: colors.primary }]}>
                        {patient.displayName || '—'}
                      </AppText>
                      <AppText variant="bodySm" style={styles.patientEmail}>
                        {patient.email}
                      </AppText>
                    </View>
                    {/* Checkbox */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {selectedPatientIds.length > 0 && (
          <AppText variant="bodySm" style={styles.selectedCount}>
            {selectedPatientIds.length} patient{selectedPatientIds.length > 1 ? 's' : ''} selected
          </AppText>
        )}
        <TouchableOpacity
          style={[
            styles.assignBtn,
            (!selectedPatientIds.length || !selectedTemplateIds.length) && styles.assignBtnDisabled,
          ]}
          onPress={handleAssign}
          disabled={!selectedPatientIds.length || !selectedTemplateIds.length || assigning}
        >
          {assigning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <AppText variant="labelMd" style={styles.assignBtnText}>
                Assign to {selectedPatientIds.length > 0 ? `${selectedPatientIds.length} Patient${selectedPatientIds.length > 1 ? 's' : ''}` : 'Patients'}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter, paddingVertical: spacing.md,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 120 },

  section: { gap: spacing.sm },
  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },

  listBox: { gap: spacing.sm },

  // Template / generic rows
  rowItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  rowItemActive: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  rowName: { fontWeight: '700', fontSize: 14, marginBottom: 2, color: '#0f172a' },
  rowMeta: { color: '#64748b', fontSize: 12 },

  // Checkbox
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#cbd5e1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  // Summary
  summaryBox: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    borderRadius: 20, padding: spacing.lg, alignItems: 'center',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  summaryValue: { color: '#fff', fontWeight: '800' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#334155' },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', fontFamily: 'Inter' },

  emptySearch: { alignItems: 'center', paddingVertical: 32 },

  // Patient rows
  patientRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  patientRowActive: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  patientAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  patientName: { fontWeight: '700', fontSize: 14, color: '#0f172a', marginBottom: 2 },
  patientEmail: { color: '#64748b', fontSize: 12 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.gutter, paddingBottom: 28,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    gap: 8,
  },
  selectedCount: { color: '#64748b', textAlign: 'center', fontSize: 12 },
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 16,
  },
  assignBtnDisabled: { backgroundColor: '#cbd5e1' },
  assignBtnText: { color: '#fff', fontWeight: '700' },
});

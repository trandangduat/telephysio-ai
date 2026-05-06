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
import type { UserProfile, ExerciseTemplate, Exercise } from '../../services/firebase/types';
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

  const initialTemplateId = route.params?.templateId;

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [allTemplates, setAllTemplates] = useState<ExerciseTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(initialTemplateId ? [initialTemplateId] : []);
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
      setAllTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplateIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
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
      names: selected.map(t => t.name).join(' + ')
    };
  };

  const filteredPatients = patients.filter(p =>
    (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!uid) return;
    if (selectedTemplateIds.length === 0) {
      Alert.alert('Error', 'Please select at least one template');
      return;
    }
    if (!selectedPatientId) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    const { exercises, duration, names } = getCombinedDetails();
    const selectedPatient = patients.find(p => p.uid === selectedPatientId);

    setAssigning(true);
    try {
      await createAssignment({
        doctorId: uid,
        patientId: selectedPatientId,
        templateName: names,
        exercises: exercises,
        totalDuration: duration,
        status: 'active',
      });
      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Success', `Templates assigned to ${selectedPatient?.displayName || 'patient'}!`);
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Assign Session</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Templates */}
        <View style={styles.section}>
          <AppText variant="labelMd" style={styles.sectionLabel}>STEP 1: SELECT TEMPLATES ({selectedTemplateIds.length})</AppText>
          <View style={styles.templateList}>
            {allTemplates.map(tpl => {
              const isSelected = selectedTemplateIds.includes(tpl.id);
              return (
                <TouchableOpacity
                  key={tpl.id}
                  style={[styles.tplItem, isSelected && styles.tplItemActive]}
                  onPress={() => toggleTemplateSelection(tpl.id)}
                >
                  <Ionicons 
                    name={isSelected ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={isSelected ? colors.primary : "#94a3b8"} 
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText variant="labelMd" style={[styles.tplName, isSelected && { color: colors.primary }]}>{tpl.name}</AppText>
                    <AppText variant="bodySm" style={{ color: '#64748b' }}>{tpl.exercises?.length || 0} exercises · {tpl.totalDuration}</AppText>
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

        {/* Step 2: Select Patient */}
        <View style={styles.section}>
          <AppText variant="labelMd" style={styles.sectionLabel}>STEP 2: SELECT PATIENT</AppText>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredPatients.map(patient => {
            const isSelected = selectedPatientId === patient.uid;
            return (
              <TouchableOpacity
                key={patient.uid}
                style={[styles.patientCard, isSelected && styles.patientCardActive]}
                onPress={() => setSelectedPatientId(patient.uid)}
              >
                <View style={[styles.avatar, isSelected && { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={18} color={isSelected ? colors.primary : '#94a3b8'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText variant="labelMd" style={styles.patientName}>{patient.displayName}</AppText>
                  <AppText variant="bodySm" style={{ color: '#64748b' }}>{patient.email}</AppText>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.assignBtn, (!selectedPatientId || selectedTemplateIds.length === 0) && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={!selectedPatientId || selectedTemplateIds.length === 0 || assigning}
        >
          {assigning ? <ActivityIndicator color="#fff" /> : <AppText variant="labelMd" style={styles.assignBtnText}>Assign Selection</AppText>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingVertical: spacing.md },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 100 },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  templateList: { gap: spacing.sm },
  tplItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  tplItemActive: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  tplName: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  summaryBox: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 20, padding: spacing.lg, alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  summaryValue: { color: '#fff', fontWeight: '800' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#334155' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 14 },
  patientCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  patientCardActive: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  patientName: { fontWeight: '700', fontSize: 15 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.gutter, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  assignBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  assignBtnDisabled: { backgroundColor: '#cbd5e1' },
  assignBtnText: { color: '#fff', fontWeight: '700' },
});

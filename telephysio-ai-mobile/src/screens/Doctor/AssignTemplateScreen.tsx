import React, { useState, useEffect } from 'react';
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
import type { UserProfile, ExerciseTemplate, Exercise, Assignment } from '../../services/firebase/types';
import {
  getAllPatients,
  getExerciseTemplates,
  createAssignment,
  getDoctorAssignments,
} from '../../services/firebase';
import { Timestamp } from 'firebase/firestore';

type AssignTemplateNavProp = NativeStackNavigationProp<DoctorStackParamList, 'AssignTemplate'>;
type AssignTemplateRouteProp = RouteProp<DoctorStackParamList, 'AssignTemplate'>;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const dateKey = (date: Date) => {
  const local = startOfDay(date);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
};

const getAssignmentDate = (assignment: Assignment) =>
  ((assignment.scheduledDate ?? assignment.assignedAt) as any)?.toDate?.() ?? null;

export const AssignTemplateScreen: React.FC = () => {
  const navigation = useNavigation<AssignTemplateNavProp>();
  const route = useRoute<AssignTemplateRouteProp>();
  const { uid } = useAuth();

  const initialTemplateId = route.params?.templateId;
  const initialPatientId = route.params?.patientId;
  const isPatientScoped = !!initialPatientId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [allPatients, setAllPatients] = useState<UserProfile[]>([]);
  const [allTemplates, setAllTemplates] = useState<ExerciseTemplate[]>([]);
  const [patientAssignments, setPatientAssignments] = useState<Assignment[]>([]);
  
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    initialTemplateId ? [initialTemplateId] : []
  );
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>(
    initialPatientId ? [initialPatientId] : []
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => { loadData(); }, [uid]);

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [patientsData, templatesData, assignmentsData] = await Promise.all([
        getAllPatients(),
        getExerciseTemplates(uid),
        getDoctorAssignments(uid),
      ]);
      setAllPatients(patientsData);
      setAllTemplates(templatesData);
      setPatientAssignments(
        initialPatientId
          ? assignmentsData.filter(a => a.patientId === initialPatientId)
          : assignmentsData
      );
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
    if (selectedTemplateIds.length === 0 || selectedPatientIds.length === 0) return;

    const { exercises, duration, names } = getCombinedDetails();
    setAssigning(true);
    try {
      await Promise.all(
        selectedPatientIds.map(patientId =>
          createAssignment({
            doctorId: uid,
            patientId,
            templateName: names,
            exercises,
            totalDuration: duration,
            status: 'active',
            scheduledDate: Timestamp.fromDate(selectedDate),
          })
        )
      );
      const patientNames = allPatients
        .filter(p => selectedPatientIds.includes(p.uid))
        .map(p => p.displayName || p.email)
        .join(', ');
      navigation.goBack();
      setTimeout(() => {
        if (Platform.OS !== 'web') Alert.alert('Success', `Assigned to: ${patientNames}`);
      }, 300);
    } catch (error) {
      console.error('Error assigning:', error);
      Alert.alert('Error', 'Failed to assign templates.');
    } finally {
      setAssigning(false);
    }
  };

  const assignedDayCounts = patientAssignments.reduce<Record<string, number>>((acc, assignment) => {
    const date = getAssignmentDate(assignment);
    if (!date) return acc;
    const key = dateKey(date);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const selectedDateKey = dateKey(selectedDate);
  const calendarLead = startOfMonth(visibleMonth).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: calendarLead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)),
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const { exercises, duration } = getCombinedDetails();
  const totalSteps = isPatientScoped ? 3 : 4;
  const isLastStep = step === totalSteps;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Assign Session</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeaderRow}>
              <AppText variant="headlineMd" style={styles.stepTitle}>Select Templates</AppText>
              <AppText variant="labelMd" style={styles.stepCount}>Step 1 of {totalSteps}</AppText>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={colors.outline} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search templates..."
                placeholderTextColor={colors.outline}
                value={templateSearchQuery}
                onChangeText={setTemplateSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.listBox}>
              {allTemplates
                .filter(t => !templateSearchQuery.trim() || t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                .map(tpl => {
                const isSelected = selectedTemplateIds.includes(tpl.id);
                const exerciseNames = (tpl.exercises || []).map(ex => ex.name || 'Unnamed Exercise').join(', ');
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    style={[styles.rowItem, isSelected && styles.rowItemActive]}
                    onPress={() => toggleTemplate(tpl.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <AppText variant="headlineMd" style={[styles.rowName, isSelected && { color: colors.primary }]}>{tpl.name}</AppText>
                      <AppText variant="bodySm" style={styles.rowMeta}>{tpl.exercises?.length || 0} exercises • {tpl.totalDuration}</AppText>
                      {exerciseNames ? (
                        <AppText variant="labelSm" style={{ color: colors.outline, marginTop: 6 }} numberOfLines={2}>
                          {exerciseNames}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeaderRow}>
              <AppText variant="headlineMd" style={styles.stepTitle}>Schedule Session</AppText>
              <AppText variant="labelMd" style={styles.stepCount}>Step 2 of {totalSteps}</AppText>
            </View>

            <View style={[styles.calendarSheet, { padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceContainerHighest }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
                  <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <AppText variant="headlineMd" style={styles.calendarTitle}>
                  {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </AppText>
                <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <AppText key={i} variant="labelMd" style={styles.weekHeaderText}>{day}</AppText>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarCells.map((date, index) => {
                  if (!date) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                  const key = dateKey(date);
                  const active = key === selectedDateKey;
                  const count = assignedDayCounts[key] || 0;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.calendarDay, active && styles.calendarDayActive]}
                      onPress={() => setSelectedDate(startOfDay(date))}
                    >
                      <AppText variant="labelMd" style={[styles.calendarDayText, active && styles.calendarDayTextActive]}>
                        {date.getDate()}
                      </AppText>
                      {count > 0 && (
                        <View style={[styles.calendarCountBadge, active && styles.calendarCountBadgeActive]}>
                          <AppText style={[styles.calendarCountText, active && styles.calendarCountTextActive]}>{count}</AppText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.calendarLegend}>
                <View style={styles.calendarLegendIcon}>
                  <View style={styles.calendarCountBadgeLegend}>
                    <AppText style={styles.calendarCountTextLegend}>1</AppText>
                  </View>
                </View>
                <AppText variant="labelSm" style={styles.calendarLegendText}>
                  Number of sessions already assigned to {isPatientScoped ? 'this patient' : 'patients'} on this date
                </AppText>
              </View>
            </View>
          </View>
        )}

        {step === 3 && !isPatientScoped && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeaderRow}>
              <AppText variant="headlineMd" style={styles.stepTitle}>Select Patients</AppText>
              <AppText variant="labelMd" style={styles.stepCount}>Step 3 of {totalSteps}</AppText>
            </View>
            
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={colors.outline} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                placeholderTextColor={colors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.listBox}>
              {filteredPatients.map(patient => {
                const isSelected = selectedPatientIds.includes(patient.uid);
                return (
                  <TouchableOpacity
                    key={patient.uid}
                    style={[styles.patientRow, isSelected && styles.patientRowActive]}
                    onPress={() => togglePatient(patient.uid)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.patientAvatar}>
                      <Ionicons name="person" size={20} color={colors.surfaceTint} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <AppText variant="headlineMd" style={[styles.patientName, isSelected && { color: colors.primary }]}>{patient.displayName || '—'}</AppText>
                      <AppText variant="bodySm" style={styles.patientEmail}>{patient.email}</AppText>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {((step === 4 && !isPatientScoped) || (step === 3 && isPatientScoped)) && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeaderRow}>
              <AppText variant="headlineMd" style={styles.stepTitle}>Confirm Assignment</AppText>
              <AppText variant="labelMd" style={styles.stepCount}>Step {totalSteps} of {totalSteps}</AppText>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryStat}>
                <Ionicons name="fitness-outline" size={24} color={colors.primary} style={{marginBottom: 8}} />
                <AppText variant="headlineMd" style={styles.summaryValue}>{exercises.length}</AppText>
                <AppText variant="labelSm" style={styles.summaryLabel}>Exercises</AppText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Ionicons name="time-outline" size={24} color={colors.tertiary} style={{marginBottom: 8}} />
                <AppText variant="headlineMd" style={[styles.summaryValue, {color: colors.tertiary}]}>{duration}</AppText>
                <AppText variant="labelSm" style={styles.summaryLabel}>Duration</AppText>
              </View>
            </View>

            <View style={[styles.card, { marginTop: spacing.md }]}>
               <View style={styles.cardHeader}>
                 <Ionicons name="folder-open" size={20} color={colors.primary} />
                 <AppText variant="labelMd" style={styles.cardTitle}>SELECTED TEMPLATES</AppText>
               </View>
               <View style={{gap: 8}}>
                 {allTemplates.filter(t => selectedTemplateIds.includes(t.id)).map(t => (
                   <View key={t.id} style={styles.confirmListItem}>
                     <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                     <AppText variant="bodyMd" style={styles.confirmListText}>{t.name}</AppText>
                   </View>
                 ))}
               </View>
            </View>

            <View style={[styles.card, { marginTop: spacing.md }]}>
               <View style={styles.cardHeader}>
                 <Ionicons name="calendar" size={20} color={colors.primary} />
                 <AppText variant="labelMd" style={styles.cardTitle}>SCHEDULED DATE</AppText>
               </View>
               <View style={styles.dateBox}>
                 <View style={styles.dateIconWrapper}>
                   <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: '700', fontSize: 10 }}>{selectedDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</AppText>
                   <AppText variant="headlineMd" style={{ color: colors.onSurface, fontSize: 20 }}>{selectedDate.getDate()}</AppText>
                 </View>
                 <View>
                   <AppText variant="bodyMd" style={{ color: colors.onSurface, fontWeight: '600', fontSize: 16 }}>
                     {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                   </AppText>
                   <AppText variant="bodySm" style={{ color: colors.onSurfaceVariant }}>
                     {selectedDate.toLocaleDateString(undefined, { year: 'numeric' })}
                   </AppText>
                 </View>
               </View>
            </View>

            <View style={[styles.card, { marginTop: spacing.md }]}>
               <View style={styles.cardHeader}>
                 <Ionicons name="people" size={20} color={colors.primary} />
                 <AppText variant="labelMd" style={styles.cardTitle}>ASSIGNED PATIENTS</AppText>
               </View>
               <View style={{gap: 8}}>
                 {allPatients.filter(p => selectedPatientIds.includes(p.uid)).map(p => (
                   <View key={p.uid} style={styles.confirmListItem}>
                     <View style={styles.patientAvatarSmall}>
                       <Ionicons name="person" size={16} color={colors.surfaceTint} />
                     </View>
                     <View>
                       <AppText variant="bodyMd" style={styles.confirmListText}>{p.displayName || p.email}</AppText>
                       {!!p.displayName && <AppText variant="labelSm" style={{ color: colors.onSurfaceVariant }}>{p.email}</AppText>}
                     </View>
                   </View>
                 ))}
               </View>
            </View>

          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {isLastStep ? (
          <TouchableOpacity
            style={[styles.primaryBtn, (!selectedPatientIds.length || !selectedTemplateIds.length) && styles.primaryBtnDisabled]}
            onPress={handleAssign}
            disabled={!selectedPatientIds.length || !selectedTemplateIds.length || assigning}
          >
            {assigning ? <ActivityIndicator color={colors.onPrimary} /> : (
               <View style={styles.btnContent}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.onPrimary} style={{marginRight: 8}} />
                  <AppText variant="labelMd" style={styles.primaryBtnText}>Confirm & Assign</AppText>
               </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryBtn, 
              (step === 1 && selectedTemplateIds.length === 0) && styles.primaryBtnDisabled,
              (step === 3 && !isPatientScoped && selectedPatientIds.length === 0) && styles.primaryBtnDisabled,
            ]}
            onPress={() => setStep(step + 1)}
            disabled={
              (step === 1 && selectedTemplateIds.length === 0) || 
              (step === 3 && !isPatientScoped && selectedPatientIds.length === 0)
            }
          >
            <AppText variant="labelMd" style={styles.primaryBtnText}>Next Step</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter, paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, color: colors.onSurface, fontWeight: '600' },
  
  progressBarContainer: {
    height: 3,
    backgroundColor: colors.surfaceContainerHighest,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 120 },
  stepContainer: { gap: spacing.md },
  
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  stepTitle: { fontSize: 18, color: colors.onSurface, fontWeight: '600' },
  stepCount: { color: colors.outline, fontSize: 13 },
  
  listBox: { gap: spacing.md },
  
  rowItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerHighest,
  },
  rowItemActive: { 
    borderColor: colors.primary, 
    backgroundColor: colors.surfaceContainerLowest,
  },
  rowName: { fontSize: 16, marginBottom: 4, color: colors.onSurface, fontWeight: '600' },
  rowMeta: { color: colors.onSurfaceVariant, fontSize: 13 },
  
  checkbox: { 
    width: 24, height: 24, borderRadius: 8, 
    borderWidth: 1.5, borderColor: colors.outlineVariant, 
    alignItems: 'center', justifyContent: 'center' 
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  searchBox: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, 
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, 
    borderWidth: 1, borderColor: colors.surfaceContainerHighest 
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.onSurface },

  patientRow: { 
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, 
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceContainerHighest 
  },
  patientRowActive: { borderColor: colors.primary },
  patientAvatar: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: colors.surfaceContainerLow, 
    alignItems: 'center', justifyContent: 'center' 
  },
  patientName: { fontSize: 16, color: colors.onSurface, marginBottom: 2, fontWeight: '600' },
  patientEmail: { color: colors.onSurfaceVariant, fontSize: 13 },

  calendarSheet: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  calendarTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '600' },
  weekHeader: { flexDirection: 'row', marginBottom: spacing.md },
  weekHeaderText: { flex: 1, textAlign: 'center', color: colors.outline, fontSize: 13 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 8, position: 'relative' },
  calendarDayActive: { backgroundColor: colors.primary },
  calendarDayText: { color: colors.onSurface, fontSize: 15 },
  calendarDayTextActive: { color: colors.onPrimary },
  calendarCountBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.tertiaryContainer, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  calendarCountBadgeActive: { backgroundColor: colors.onPrimary },
  calendarCountText: { color: colors.onTertiaryContainer, fontSize: 9, fontWeight: 'bold' },
  calendarCountTextActive: { color: colors.primary },
  calendarLegend: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surfaceContainerHighest, gap: 8 },
  calendarLegendIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  calendarCountBadgeLegend: { backgroundColor: colors.tertiaryContainer, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  calendarCountTextLegend: { color: colors.onTertiaryContainer, fontSize: 9, fontWeight: 'bold' },
  calendarLegendText: { flex: 1, color: colors.outline, fontSize: 12 },

  summaryCard: {
    flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, padding: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceContainerHighest, 
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 },
  summaryValue: { color: colors.primary, fontSize: 24, fontWeight: '600' },
  summaryDivider: { width: 1, height: 60, backgroundColor: colors.surfaceContainerHighest },

  card: { 
    backgroundColor: colors.surfaceContainerLowest, 
    borderRadius: 16, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.surfaceContainerHighest 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle: { fontWeight: '700', fontSize: 13, color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  confirmListItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceContainerHighest },
  confirmListText: { color: colors.onSurface, fontWeight: '600' },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceContainerHighest },
  dateIconWrapper: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceContainerHighest },
  patientAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },

  bottomBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: spacing.gutter, paddingBottom: Platform.OS === 'ios' ? 32 : 24, 
    backgroundColor: colors.background 
  },
  primaryBtn: { 
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { backgroundColor: colors.outlineVariant },
  primaryBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '600' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

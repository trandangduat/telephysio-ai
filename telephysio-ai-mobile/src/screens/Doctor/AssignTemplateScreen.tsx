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
  Modal,
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

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

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
  const initialPatientName = route.params?.patientName;
  const isPatientScoped = !!initialPatientId;

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [allPatients, setAllPatients] = useState<UserProfile[]>([]);
  const [allTemplates, setAllTemplates] = useState<ExerciseTemplate[]>([]);
  const [patientAssignments, setPatientAssignments] = useState<Assignment[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    initialTemplateId ? [initialTemplateId] : []
  );
  // Multi-select patients
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>(
    initialPatientId ? [initialPatientId] : []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const assignedDayCounts = patientAssignments.reduce<Record<string, number>>((acc, assignment) => {
    const date = getAssignmentDate(assignment);
    if (!date) return acc;
    const key = dateKey(date);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const quickDates = Array.from({ length: 14 }, (_, index) => addDays(new Date(), index));
  const selectedDateKey = dateKey(selectedDate);
  const calendarLead = startOfMonth(visibleMonth).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: calendarLead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)),
  ];

  const selectedPatientLabel = initialPatientName || allPatients.find(p => p.uid === initialPatientId)?.displayName || 'Selected patient';

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

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <AppText variant="labelMd" style={styles.sectionLabel}>
              STEP 2: SCHEDULE SESSION
            </AppText>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: '800' }}>
                Open calendar
              </AppText>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View>
                <AppText variant="labelMd" style={styles.scheduleDate}>
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </AppText>
                <AppText variant="bodySm" style={{ color: '#64748b', marginTop: 2 }}>
                  {assignedDayCounts[selectedDateKey]
                    ? `${assignedDayCounts[selectedDateKey]} existing assignment${assignedDayCounts[selectedDateKey] > 1 ? 's' : ''} on this day`
                    : 'No assignments scheduled on this day'}
                </AppText>
              </View>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDateRail}>
              {quickDates.map((date) => {
                const key = dateKey(date);
                const active = key === selectedDateKey;
                const count = assignedDayCounts[key] || 0;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.quickDate, active && styles.quickDateActive]}
                    onPress={() => setSelectedDate(startOfDay(date))}
                    activeOpacity={0.85}
                  >
                    <AppText variant="labelSm" style={[styles.quickWeekday, active && styles.quickTextActive]}>
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </AppText>
                    <AppText variant="headlineMd" style={[styles.quickDay, active && styles.quickTextActive]}>
                      {date.getDate()}
                    </AppText>
                    <View style={[styles.assignmentDot, count > 0 && styles.assignmentDotFilled, active && { backgroundColor: '#fff' }]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Step 2: Select Patients */}
        {!isPatientScoped ? <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <AppText variant="labelMd" style={styles.sectionLabel}>
              STEP 3: SELECT PATIENTS ({selectedPatientIds.length} selected)
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
        </View> : (
          <View style={styles.lockedPatientCard}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="labelMd" style={{ color: '#0f172a', fontWeight: '800' }}>
                Assigning to {selectedPatientLabel}
              </AppText>
              <AppText variant="bodySm" style={{ color: '#64748b', marginTop: 2 }}>
                Patient is locked from Patient Details.
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showDatePicker} animationType="slide" transparent onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </TouchableOpacity>
              <AppText variant="headlineMd" style={styles.calendarTitle}>
                {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </AppText>
              <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <AppText key={`${day}-${index}`} variant="labelSm" style={styles.weekHeaderText}>{day}</AppText>
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
                    activeOpacity={0.85}
                  >
                    <AppText variant="labelMd" style={[styles.calendarDayText, active && styles.calendarDayTextActive]}>
                      {date.getDate()}
                    </AppText>
                    {count > 0 && <View style={[styles.calendarAssignedPill, active && { backgroundColor: '#fff' }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.calendarDoneBtn} onPress={() => setShowDatePicker(false)}>
              <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '800' }}>Use this date</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {selectedPatientIds.length > 0 && !isPatientScoped && (
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
                {isPatientScoped
                  ? `Assign to ${selectedPatientLabel}`
                  : `Assign to ${selectedPatientIds.length > 0 ? `${selectedPatientIds.length} Patient${selectedPatientIds.length > 1 ? 's' : ''}` : 'Patients'}`}
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

  scheduleCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: spacing.md,
    borderWidth: 1.5, borderColor: '#dbeafe', gap: spacing.md,
  },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleDate: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  quickDateRail: { gap: spacing.sm, paddingRight: spacing.md },
  quickDate: {
    width: 68, alignItems: 'center', borderRadius: 18, paddingVertical: 12,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  quickDateActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickWeekday: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  quickDay: { color: '#0f172a', fontSize: 22, fontWeight: '800', marginTop: 2 },
  quickTextActive: { color: '#fff' },
  assignmentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent', marginTop: 6 },
  assignmentDotFilled: { backgroundColor: '#f59e0b' },
  lockedPatientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ecfeff', borderRadius: 18, padding: spacing.md,
    borderWidth: 1, borderColor: '#bae6fd',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  calendarSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.lg, paddingBottom: 32,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  calendarTitle: { color: '#0f172a', fontWeight: '800', fontSize: 18 },
  weekHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  weekHeaderText: { flex: 1, textAlign: 'center', color: '#94a3b8', fontWeight: '800' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, marginBottom: 4,
  },
  calendarDayActive: { backgroundColor: colors.primary },
  calendarDayText: { color: '#0f172a', fontWeight: '700' },
  calendarDayTextActive: { color: '#fff' },
  calendarAssignedPill: { width: 16, height: 4, borderRadius: 99, backgroundColor: '#f59e0b', marginTop: 3 },
  calendarDoneBtn: {
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, marginTop: spacing.md,
  },

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

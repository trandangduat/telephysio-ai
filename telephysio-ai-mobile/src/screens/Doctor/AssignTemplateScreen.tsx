import React, { useState, useEffect, useMemo } from 'react';
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
import { Timestamp } from 'firebase/firestore';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import type { DoctorStackParamList } from '../../navigation/types';
import type { ExerciseTemplate, Assignment, Exercise, Session } from '../../services/firebase/types';
import {
  getExerciseTemplates,
  createAssignment,
  getDoctorAssignments,
  getPatientSessions,
} from '../../services/firebase';

type AssignTemplateNavProp = NativeStackNavigationProp<DoctorStackParamList, 'AssignTemplate'>;
type AssignTemplateRouteProp = RouteProp<DoctorStackParamList, 'AssignTemplate'>;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getAssignmentDate = (assignment: Assignment) =>
  ((assignment.scheduledDate ?? assignment.assignedAt) as any)?.toDate?.() ?? null;

const getSessionDate = (session: Session) =>
  (session.date as any)?.toDate?.() ?? new Date();

export const AssignTemplateScreen: React.FC = () => {
  const navigation = useNavigation<AssignTemplateNavProp>();
  const route = useRoute<AssignTemplateRouteProp>();
  const { uid } = useAuth();
  const { t } = useTranslation();

  const patientId = route.params?.patientId;
  const patientName = (route.params as any)?.patientName || 'Patient';

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [allTemplates, setAllTemplates] = useState<ExerciseTemplate[]>([]);
  const [patientAssignments, setPatientAssignments] = useState<Assignment[]>([]);
  const [patientSessions, setPatientSessions] = useState<Session[]>([]);
  
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isTemplateSearchVisible, setIsTemplateSearchVisible] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentHour, setAssignmentHour] = useState<number>(13);

  useEffect(() => {
    loadData();
  }, [uid, patientId]);

  const loadData = async () => {
    if (!uid || !patientId) return;
    setLoading(true);
    try {
      const [templatesData, assignmentsData, sessionsData] = await Promise.all([
        getExerciseTemplates(uid),
        getDoctorAssignments(uid),
        getPatientSessions(patientId, 100),
      ]);
      setAllTemplates(templatesData);
      setPatientAssignments(assignmentsData.filter(a => a.patientId === patientId));
      setPatientSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return allTemplates;
    const q = templateSearchQuery.toLowerCase();
    return allTemplates.filter(t => t.name.toLowerCase().includes(q));
  }, [allTemplates, templateSearchQuery]);

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplateIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!uid || !patientId || selectedTemplateIds.length === 0) return;
    
    const selectedTemplates = allTemplates.filter(t => selectedTemplateIds.includes(t.id));
    if (selectedTemplates.length === 0) return;

    setAssigning(true);
    try {
      const scheduleDate = new Date(selectedDate);
      scheduleDate.setHours(assignmentHour, 0, 0, 0);

      // Combine exercises and calculate total duration
      let allEx: Exercise[] = [];
      let totalMins = 0;
      selectedTemplates.forEach(t => {
         allEx.push(...(t.exercises || []));
         totalMins += parseInt(t.totalDuration) || 0;
      });
      const generatedName = selectedTemplates.map(t => t.name).join(' + ');

      await createAssignment({
        doctorId: uid,
        patientId,
        templateName: assignmentTitle || generatedName,
        exercises: allEx,
        totalDuration: `${totalMins} min`,
        status: 'active',
        scheduledDate: Timestamp.fromDate(scheduleDate),
      });
      
      setIsAddModalVisible(false);
      setSelectedTemplateIds([]);
      setAssignmentTitle('');
      loadData();
      if (Platform.OS !== 'web') Alert.alert('Success', 'Session assigned successfully.');
    } catch (error) {
      console.error('Error assigning:', error);
      Alert.alert('Error', 'Failed to assign template.');
    } finally {
      setAssigning(false);
    }
  };

  const renderMonthView = () => {
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const startDay = visibleMonth.getDay();
    
    const totalCells = Math.ceil((daysInMonth + startDay) / 7) * 7;
    const calendarCells = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < startDay || i >= startDay + daysInMonth) {
        calendarCells.push(null);
      } else {
        calendarCells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), i - startDay + 1));
      }
    }

    const weeks = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      weeks.push(calendarCells.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <AppText variant="headlineMd" style={styles.monthTitle}>
            {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </AppText>
          <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} style={styles.monthNavBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <AppText key={i} variant="labelMd" style={styles.weekHeaderText}>{day}</AppText>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={styles.weekRow}>
              {week.map((date, index) => {
                if (!date) return <View key={`empty-${wIndex}-${index}`} style={styles.calendarDay} />;
                
                const isToday = startOfDay(new Date()).getTime() === date.getTime();
                const isSelected = selectedDate.getTime() === date.getTime();
                const assignmentsToday = patientAssignments.filter(a => {
                  const d = getAssignmentDate(a);
                  return d && startOfDay(d).getTime() === date.getTime();
                });

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.calendarDay, isToday && styles.calendarDayToday, isSelected && styles.calendarDaySelected]}
                    onPress={() => {
                      setSelectedDate(date);
                      setViewMode('day');
                    }}
                    activeOpacity={0.7}
                  >
                    <AppText variant="labelMd" style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
                      {date.getDate()}
                    </AppText>
                    {assignmentsToday.slice(0, 2).map((a, i) => (
                      <View key={i} style={styles.assignmentBlockMonth}>
                         <AppText style={styles.assignmentBlockTextMonth} numberOfLines={1}>
                           {a.templateName}
                         </AppText>
                      </View>
                    ))}
                    {assignmentsToday.length > 2 && (
                       <AppText style={styles.moreText}>{t('doctor.assignTemplate.moreText', { count: assignmentsToday.length - 2 })}</AppText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDayView = () => {
    const sessionsToday = patientSessions.filter(s => {
      const d = getSessionDate(s);
      return startOfDay(d).getTime() === startOfDay(selectedDate).getTime();
    });

    return (
      <ScrollView style={styles.dayViewScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.dayHeader}>
           <AppText variant="headlineMd" style={styles.dayHeaderTitle}>
             {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
           </AppText>
        </View>
        <View style={styles.sessionsList}>
          {sessionsToday.length === 0 ? (
            <AppText variant="bodyMd" style={styles.noSessionsText}>
              No sessions for this date.
            </AppText>
          ) : (
            sessionsToday.map((session, i) => (
              <TouchableOpacity
                key={i}
                style={styles.sessionCard}
                onPress={() => navigation.navigate("DoctorSessionDetail", { session, patientName })}
              >
                <View style={styles.sessionCardHeader}>
                  <View style={styles.sessionIconBox}>
                    <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <AppText variant="labelMd" style={styles.sessionTitle}>Session Completed</AppText>
                    <AppText variant="bodySm" style={styles.sessionMeta}>
                      {session.exercisesCompleted} exercises • {session.durationSeconds ? Math.floor(session.durationSeconds / 60) : 0} min
                    </AppText>
                  </View>
                </View>
                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <AppText variant="labelMd" style={{ color: colors.primary }}>{session.accuracyScore}%</AppText>
                    <AppText variant="labelSm" style={{ color: "#64748b" }}>Accuracy</AppText>
                  </View>
                  <View style={styles.statItem}>
                    <AppText variant="labelMd" style={{ color: "#f59e0b" }}>{session.averagePain}/10</AppText>
                    <AppText variant="labelSm" style={{ color: "#64748b" }}>Pain</AppText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
           if (viewMode === 'day') {
              setViewMode('month');
           } else {
              navigation.goBack();
           }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>
          {t('doctor.assignTemplate.title')}
        </AppText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {viewMode === 'month' ? renderMonthView() : renderDayView()}
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Add Assignment Form Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={28} color={colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAssign} disabled={assigning || selectedTemplateIds.length === 0}>
              <View style={[styles.saveBtn, (selectedTemplateIds.length === 0 || assigning) && styles.saveBtnDisabled]}>
                {assigning ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <AppText style={styles.saveBtnText}>{t('doctor.assignTemplate.saveBtn')}</AppText>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
             <View style={styles.titleInputContainer}>
               <TextInput
                 style={styles.titleInput}
                 placeholder={t('doctor.assignTemplate.addTitlePlaceholder')}
                 placeholderTextColor={colors.outline}
                 value={assignmentTitle}
                 onChangeText={setAssignmentTitle}
               />
             </View>

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={24} color={colors.outline} style={styles.inputIcon} />
              <View style={styles.inputBody}>
                 <AppText style={styles.inputLabel}>{t('doctor.assignTemplate.patientLabel')}</AppText>
                 <AppText style={styles.inputValue}>{patientName}</AppText>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Ionicons name="document-text-outline" size={24} color={colors.outline} style={styles.inputIcon} />
              <View style={styles.inputBody}>
                <AppText style={styles.inputLabel}>{t('doctor.assignTemplate.templateLabel')}</AppText>
                
                <View style={styles.templatesWrap}>
                  {selectedTemplateIds.map(tid => {
                     const t = allTemplates.find(x => x.id === tid);
                     if (!t) return null;
                     return (
                        <TouchableOpacity 
                          key={tid}
                          style={styles.selectedTemplateBox}
                          onPress={() => setIsTemplateSearchVisible(true)}
                        >
                           <AppText style={styles.selectedTemplateText}>{t.name}</AppText>
                        </TouchableOpacity>
                     );
                  })}
                  <TouchableOpacity 
                     style={styles.selectTemplateBtn}
                     onPress={() => setIsTemplateSearchVisible(true)}
                   >
                     <AppText style={styles.selectTemplateBtnText}>{t('doctor.assignTemplate.addTemplateBtn')}</AppText>
                   </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="time-outline" size={24} color={colors.outline} style={styles.inputIcon} />
              <View style={styles.inputBody}>
                 <AppText style={styles.inputLabel}>{t('doctor.assignTemplate.dateTimeLabel')}</AppText>
                 <AppText style={styles.inputValue}>
                   {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                 </AppText>
                 
                 <View style={styles.hourSelectorRow}>
                   <AppText style={styles.hourSelectorLabel}>{t('doctor.assignTemplate.hourLabel')}</AppText>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourScroll}>
                     {Array.from({length: 24}, (_, i) => i).map(h => (
                       <TouchableOpacity
                         key={h}
                         style={[styles.hourChip, assignmentHour === h && styles.hourChipSelected]}
                         onPress={() => setAssignmentHour(h)}
                       >
                         <AppText style={[styles.hourChipText, assignmentHour === h && styles.hourChipTextSelected]}>
                           {`${h.toString().padStart(2, '0')}:00`}
                         </AppText>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Template Search Modal */}
      <Modal
        visible={isTemplateSearchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsTemplateSearchVisible(false)}
      >
         <SafeAreaView style={styles.modalContainer}>
            <View style={styles.searchModalHeader}>
               <TouchableOpacity onPress={() => setIsTemplateSearchVisible(false)}>
                  <Ionicons name="close" size={28} color={colors.onSurface} />
               </TouchableOpacity>
               <AppText style={styles.searchModalTitle}>{t('doctor.assignTemplate.selectTemplateTitle')}</AppText>
               <TouchableOpacity onPress={() => setIsTemplateSearchVisible(false)}>
                 <AppText style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>{t('report.done')}</AppText>
               </TouchableOpacity>
            </View>
            <View style={styles.searchBarContainer}>
               <Ionicons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
               <TextInput
                  style={styles.searchBarInput}
                  placeholder={t('doctor.assignTemplate.searchTemplates')}
                  placeholderTextColor={colors.outline}
                  value={templateSearchQuery}
                  onChangeText={setTemplateSearchQuery}
               />
            </View>
            <ScrollView style={styles.searchResults}>
               {filteredTemplates.map(t => {
                  const isSelected = selectedTemplateIds.includes(t.id);
                  return (
                     <TouchableOpacity
                        key={t.id}
                        style={[styles.searchResultItem, isSelected && { backgroundColor: colors.surfaceContainerLow }]}
                        onPress={() => toggleTemplateSelection(t.id)}
                     >
                        <View style={styles.searchResultIcon}>
                           <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.searchResultTextContainer}>
                           <AppText style={styles.searchResultName}>{t.name}</AppText>
                           <AppText style={styles.searchResultMeta}>{t.exercises?.length || 0} exercises • {t.totalDuration}</AppText>
                        </View>
                        {isSelected && (
                           <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                     </TouchableOpacity>
                  );
               })}
               {filteredTemplates.length === 0 && (
                  <View style={styles.emptyState}>
                     <AppText style={styles.emptyStateText}>{t('doctor.assignTemplate.noTemplates')}</AppText>
                  </View>
               )}
            </ScrollView>
         </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  backBtn: {
    position: 'absolute',
    left: spacing.gutter,
    height: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: { fontSize: 18, color: colors.onSurface, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  
  calendarContainer: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  monthNavBtn: { padding: spacing.xs },
  monthTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '600' },
  
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  weekHeaderText: { flex: 1, textAlign: 'center', color: colors.outline, fontSize: 13, fontWeight: '600' },
  
  calendarGrid: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.surfaceContainerHighest,
  },
  weekRow: {
    flex: 1,
    flexDirection: 'row',
  },
  calendarDay: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    padding: 2,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
  calendarDayToday: { backgroundColor: colors.surfaceContainerLow },
  calendarDaySelected: { backgroundColor: colors.surfaceContainerHigh },
  calendarDayText: { color: colors.onSurface, fontSize: 14, fontWeight: '500', marginTop: 4, marginBottom: 2 },
  calendarDayTextToday: { color: colors.primary, fontWeight: 'bold' },
  
  assignmentBlockMonth: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    marginBottom: 2,
    width: '94%',
  },
  assignmentBlockTextMonth: { color: colors.onPrimary, fontSize: 9, textAlign: 'center', fontWeight: '500' },
  moreText: { fontSize: 9, color: colors.outline, marginTop: 1 },

  dayViewScroll: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  dayHeader: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  dayHeaderTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '600' },
  sessionsList: { padding: spacing.md, gap: spacing.md },
  noSessionsText: { textAlign: 'center', color: '#64748b', marginTop: spacing.xl },
  sessionCard: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sessionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  sessionIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  sessionMeta: { color: '#64748b', marginTop: 2 },
  sessionStats: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },


  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
  },
  modalCloseBtn: { padding: spacing.xs },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 15 },
  
  modalContent: { padding: spacing.lg, paddingBottom: 100 },
  titleInputContainer: {
    borderWidth: 1,
    borderColor: colors.onSurface,
    borderRadius: 4,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
  },
  titleInput: {
    fontSize: 22,
    color: colors.onSurface,
    padding: spacing.md,
  },
  
  inputGroup: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl },
  inputIcon: { marginTop: 2, marginRight: spacing.md },
  inputBody: { flex: 1 },
  inputLabel: { color: colors.outline, fontSize: 13, marginBottom: 8 },
  inputValue: { color: colors.onSurface, fontSize: 16, fontWeight: '500' },
  
  templatesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  selectTemplateBtnText: { color: colors.onSurfaceVariant, fontWeight: '500', fontSize: 14 },
  selectedTemplateBox: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectedTemplateText: { color: colors.onPrimary, fontWeight: '500', fontSize: 14 },

  hourSelectorRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  hourSelectorLabel: { color: colors.onSurface, marginRight: spacing.md, fontWeight: '500' },
  hourScroll: { paddingVertical: spacing.xs },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  hourChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  hourChipText: { color: colors.onSurface, fontSize: 14 },
  hourChipTextSelected: { color: colors.onPrimary, fontWeight: '600' },

  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHighest,
  },
  searchModalTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.gutter,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
  },
  searchIcon: { marginRight: spacing.sm },
  searchBarInput: { flex: 1, fontSize: 16, color: colors.onSurface },
  searchResults: { flex: 1 },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHighest,
    backgroundColor: colors.surfaceContainerLowest,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  searchResultTextContainer: { flex: 1 },
  searchResultName: { fontSize: 16, fontWeight: '500', color: colors.onSurface, marginBottom: 4 },
  searchResultMeta: { fontSize: 13, color: colors.outline },
  emptyState: { padding: spacing.xl, alignItems: 'center' },
  emptyStateText: { color: colors.outline, fontSize: 16 },
});

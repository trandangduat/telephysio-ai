/**
 * FeedbackScreen
 *
 * Displays the Exercise Feedback List and handles the Submit Feedback dialog.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const openFeedbackModal = () => setModalVisible(true);
  const closeFeedbackModal = () => {
    setModalVisible(false);
    setNotes('');
    setSelectedDifficulty(null);
  };

  const submitFeedback = () => {
    closeFeedbackModal();
    // In a real app, this would submit data, then maybe navigate or show success
    navigation.navigate('DoctorChat' as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorChat' as any)} style={styles.iconBtn}>
            <Ionicons name="chatbubbles-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={'#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile' as any)}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="headlineLg" style={styles.pageTitle}>Exercise Feedback List</AppText>
        <AppText variant="bodyMd" style={styles.pageSubtitle}>
          Review your recently completed sessions and provide feedback to help our AI adjust your recovery plan for better results.
        </AppText>

        {/* Priority Review Card */}
        <View style={styles.priorityCard}>
          <View style={styles.priorityImagePlaceholder}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
              <AppText variant="labelSm" style={{ color: '#fff' }}>Completed Today</AppText>
            </View>
          </View>
          <View style={styles.priorityContent}>
            <AppText variant="labelSm" style={styles.priorityLabel}>PRIORITY REVIEW</AppText>
            <AppText variant="headlineMd" style={styles.priorityTitle}>Knee Extension</AppText>
            <AppText variant="bodySm" style={styles.priorityDesc}>
              You completed 3 sets of 12 reps with high form accuracy. How did your joint feel during the final set?
            </AppText>
            <TouchableOpacity style={styles.primaryButton} onPress={openFeedbackModal}>
              <AppText variant="labelMd" style={{ color: '#fff' }}>Give Feedback</AppText>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Goal Card */}
        <View style={styles.weeklyGoalCard}>
          <AppText variant="labelMd" style={{ color: '#e0e7ff' }}>Weekly Goal</AppText>
          <AppText variant="bodySm" style={{ color: '#e0e7ff', marginBottom: spacing.md }}>Progress towards your recovery target.</AppText>
          
          <View style={styles.goalRow}>
            <AppText style={styles.goalPercent}>85%</AppText>
            <AppText variant="labelSm" style={{ color: '#e0e7ff' }}>12/14 SESSIONS</AppText>
          </View>
          
          <View style={styles.goalBarTrack}>
            <View style={[styles.goalBarFill, { width: '85%' }]} />
          </View>
          
          <View style={styles.goalFooter}>
            <Ionicons name="trending-up" size={16} color="#34d399" />
            <AppText variant="labelSm" style={{ color: '#e0e7ff', marginLeft: 8 }}>You're ahead of schedule this week!</AppText>
          </View>
        </View>

        {/* List Items */}
        <FeedbackListItem 
          title="Bodyweight Squats" 
          desc="Completed yesterday. AI detected a slight tilt in your pelvis during descent." 
          icon="resize-outline"
          onPress={openFeedbackModal} 
        />
        <FeedbackListItem 
          title="Wall Slides" 
          desc="Targeted shoulder mobility session. 2 sets of 10 reps completed." 
          icon="body-outline"
          onPress={openFeedbackModal} 
        />
        <FeedbackListItem 
          title="Ankle Circles" 
          desc="Morning flexibility routine. AI noted improved range of motion in right ankle." 
          icon="footsteps-outline"
          onPress={openFeedbackModal} 
        />

        {/* Why feedback matters */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
          </View>
          <AppText variant="labelMd" style={styles.infoTitle}>Why feedback matters</AppText>
          <AppText variant="bodySm" style={styles.infoDesc}>
            Your subjective input on pain and difficulty levels is crucial for our AI to differentiate between "good muscle fatigue" and "injury-related pain," ensuring your plan remains safe and effective.
          </AppText>
        </View>
      </ScrollView>

      {/* SUBMIT FEEDBACK MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Submit Feedback</AppText>
            <AppText variant="bodySm" style={styles.modalSubtitle}>
              Great job finishing your set! Please let us know how you're feeling to help your AI therapist adjust your plan.
            </AppText>

            <View style={styles.inputGroup}>
              <View style={styles.rowBetween}>
                <AppText variant="labelMd" style={styles.inputLabel}>PAIN LEVEL</AppText>
                <AppText variant="labelMd" style={{ color: colors.primary }}>5/10</AppText>
              </View>
              {/* Fake Slider */}
              <View style={styles.fakeSliderTrack}>
                <View style={[styles.fakeSliderFill, { width: '50%' }]} />
                <View style={[styles.fakeSliderThumb, { left: '50%' }]} />
              </View>
              <View style={styles.rowBetween}>
                <AppText variant="labelSm" style={styles.grayText}>No Pain</AppText>
                <AppText variant="labelSm" style={styles.grayText}>Moderate</AppText>
                <AppText variant="labelSm" style={styles.grayText}>Severe</AppText>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>WORKOUT DIFFICULTY</AppText>
              <View style={styles.difficultyRow}>
                <DifficultyButton emoji="😊" label="Easy" selected={selectedDifficulty === 'easy'} onPress={() => setSelectedDifficulty('easy')} />
                <DifficultyButton emoji="😐" label="Medium" selected={selectedDifficulty === 'medium'} onPress={() => setSelectedDifficulty('medium')} />
                <DifficultyButton emoji="🥵" label="Hard" selected={selectedDifficulty === 'hard'} onPress={() => setSelectedDifficulty('hard')} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>ADDITIONAL NOTES</AppText>
              <TextInput
                style={styles.textArea}
                placeholder="Describe any tightness or specific discomfort..."
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <AppText variant="labelMd" style={{ color: '#fff' }}>Submit Feedback</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={closeFeedbackModal}>
              <AppText variant="labelMd" style={{ color: '#475569' }}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const FeedbackListItem = ({ title, desc, icon, onPress }: any) => (
  <View style={styles.listItem}>
    <View style={styles.listHeader}>
      <View style={styles.listIconBox}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.doneBadge}>
        <AppText variant="labelSm" style={{ color: '#fff', fontSize: 10 }}>Done</AppText>
      </View>
    </View>
    <AppText variant="headlineMd" style={styles.listTitle}>{title}</AppText>
    <AppText variant="bodySm" style={styles.listDesc}>{desc}</AppText>
    <TouchableOpacity style={styles.outlineButton} onPress={onPress}>
      <AppText variant="labelMd" style={{ color: colors.primary }}>Give Feedback</AppText>
    </TouchableOpacity>
  </View>
);

const DifficultyButton = ({ emoji, label, selected, onPress }: any) => (
  <TouchableOpacity style={[styles.diffBtn, selected && styles.diffBtnSelected]} onPress={onPress}>
    <AppText style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</AppText>
    <AppText variant="labelMd" style={{ color: selected ? colors.primary : '#475569' }}>{label}</AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  pageTitle: { color: '#0f172a', fontWeight: '800' },
  pageSubtitle: { color: '#64748b', marginTop: 4 },
  
  priorityCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  priorityImagePlaceholder: { height: 160, backgroundColor: '#1e293b', padding: spacing.md },
  completedBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  priorityContent: { padding: spacing.lg },
  priorityLabel: { color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  priorityTitle: { color: '#0f172a', fontWeight: '700', fontSize: 20, marginBottom: 8 },
  priorityDesc: { color: '#475569', marginBottom: spacing.lg },
  primaryButton: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  weeklyGoalCard: { backgroundColor: '#1d4ed8', borderRadius: 20, padding: spacing.lg, elevation: 2, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  goalPercent: { color: '#fff', fontSize: 36, fontFamily: typography.headlineXl.fontFamily, fontWeight: '700' },
  goalBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: spacing.md },
  goalBarFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', alignItems: 'center' },

  listItem: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  listIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  doneBadge: { backgroundColor: '#34d399', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  listTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18, marginBottom: 6 },
  listDesc: { color: '#475569', marginBottom: spacing.lg },
  outlineButton: { borderWidth: 1, borderColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  infoIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  infoTitle: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  infoDesc: { color: '#64748b', textAlign: 'center', lineHeight: 20 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.gutter },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl, elevation: 10 },
  modalTitle: { fontFamily: typography.headlineMd.fontFamily, fontSize: 20, color: '#0f172a', fontWeight: '700', marginBottom: 8 },
  modalSubtitle: { color: '#475569', marginBottom: spacing.xl },
  inputGroup: { marginBottom: spacing.xl },
  inputLabel: { color: '#475569', fontWeight: '700', fontSize: 12, letterSpacing: 0.5, marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fakeSliderTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginVertical: spacing.md, position: 'relative' },
  fakeSliderFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  fakeSliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, position: 'absolute', top: -6, marginLeft: -10, borderWidth: 3, borderColor: '#fff' },
  grayText: { color: '#64748b' },
  difficultyRow: { flexDirection: 'row', gap: spacing.md },
  diffBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 },
  diffBtnSelected: { borderColor: colors.primary, backgroundColor: '#eff6ff', borderWidth: 2 },
  textArea: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: spacing.md, minHeight: 100, textAlignVertical: 'top', color: '#0f172a', fontFamily: typography.bodyMd.fontFamily },
  submitBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  cancelBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
});

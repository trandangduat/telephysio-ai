/**
 * DoctorChatScreen
 *
 * Displays doctor's feedback notes and allows the user to chat with the doctor.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export const DoctorChatScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [inputText, setInputText] = useState('');

  const chatData = [
    {
      id: 'm0',
      type: 'patient_feedback',
      sender: 'user',
      patientName: 'You',
      patientTitle: 'Lateral Lunges • Session Feedback',
      text: "I felt a bit of a pinch on my outer knee during the descent. It wasn't sharp pain, but enough to make me pause and lose balance.",
      tags: ['Pain: 5/10', 'Difficulty: Medium 😐'],
      time: 'Yesterday, 4:10 PM'
    },
    {
      id: 'm1',
      type: 'feedback',
      sender: 'doctor',
      doctorName: 'Dr. Marcus Sterling',
      doctorTitle: 'Lead Physiotherapist • Knee Recovery Specialist',
      text: "Hello! I've reviewed your last three AI-guided exercise sessions. Your range of motion in the left knee has improved by 12% since last Tuesday. However, the AI sensor noted some instability during the lateral lunges. Please focus on engaging your core more specifically during those reps to stabilize the joint. Let's aim to increase the lunge depth by just a few centimeters this week.",
      tags: ['12% Mobility Gain', 'Avg. 15min Sessions'],
      time: 'Yesterday, 9:00 AM'
    },
    {
      id: 'm2',
      type: 'text',
      sender: 'user',
      text: 'Thank you, Doctor. I did feel that instability too. Should I wear the brace during the lateral lunges?',
      time: 'Yesterday, 4:12 PM'
    },
    {
      id: 'm3',
      type: 'text',
      sender: 'doctor',
      text: 'Yes, please wear the sleeve for support for the next 2 sessions while we build that stability back up. Let me know how it feels.',
      time: 'Today, 9:05 AM'
    }
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <AppText variant="headlineMd" style={styles.headerTitle}>Doctor Feedback & Chat</AppText>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="bodyMd" style={styles.headerSubtitle}>
            Review your latest progress notes from Dr. Sterling.
          </AppText>

          <View style={styles.chatSection}>
            {chatData.map((msg) => {
              if (msg.type === 'patient_feedback') {
                return (
                  <View key={msg.id} style={styles.patientNoteCard}>
                    <View style={styles.doctorHeader}>
                      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                      <View style={styles.doctorInfo}>
                        <AppText variant="headlineMd" style={styles.doctorName}>{msg.patientName}</AppText>
                        <AppText variant="labelSm" style={styles.doctorTitle}>{msg.patientTitle}</AppText>
                      </View>
                      <View style={[styles.newBadge, { backgroundColor: '#dcfce7' }]}>
                        <AppText variant="labelSm" style={{ color: '#166534', fontSize: 10 }}>Self Report</AppText>
                      </View>
                    </View>

                    <View style={[styles.messageBox, { backgroundColor: '#f0fdf4' }]}>
                      <View style={[styles.messageIndicator, { backgroundColor: '#10b981' }]} />
                      <AppText variant="bodyMd" style={styles.doctorMessage}>
                        "{msg.text}"
                      </AppText>
                    </View>

                    <View style={styles.tagRow}>
                      {msg.tags?.map((tag, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: idx === 0 ? '#fee2e2' : '#fef3c7' }]}>
                          <Ionicons name={idx === 0 ? "pulse" : "barbell"} size={14} color={idx === 0 ? "#ef4444" : "#f59e0b"} />
                          <AppText variant="labelSm" style={styles.tagText}>{tag}</AppText>
                        </View>
                      ))}
                    </View>
                    <AppText style={styles.chatTimePatientMsg}>{msg.time}</AppText>
                  </View>
                );
              }

              if (msg.type === 'feedback') {
                return (
                  <View key={msg.id} style={styles.noteCard}>
                    <View style={styles.doctorHeader}>
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                      <View style={styles.doctorInfo}>
                        <AppText variant="headlineMd" style={styles.doctorName}>{msg.doctorName}</AppText>
                        <AppText variant="labelSm" style={styles.doctorTitle}>{msg.doctorTitle}</AppText>
                      </View>
                      <View style={styles.newBadge}>
                        <AppText variant="labelSm" style={{ color: colors.primary, fontSize: 10 }}>New Assessment</AppText>
                      </View>
                    </View>

                    <View style={styles.messageBox}>
                      <View style={styles.messageIndicator} />
                      <AppText variant="bodyMd" style={styles.doctorMessage}>
                        "{msg.text}"
                      </AppText>
                    </View>

                    <View style={styles.tagRow}>
                      {msg.tags?.map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Ionicons name={idx === 0 ? "trending-up" : "time-outline"} size={14} color={idx === 0 ? "#047857" : colors.primary} />
                          <AppText variant="labelSm" style={styles.tagText}>{tag}</AppText>
                        </View>
                      ))}
                    </View>
                    <AppText style={styles.chatTimeFeedbackMsg}>{msg.time}</AppText>
                  </View>
                );
              }

              if (msg.sender === 'user') {
                return (
                  <View key={msg.id} style={styles.chatBubbleUser}>
                    <AppText style={styles.chatTextUser}>{msg.text}</AppText>
                    <AppText style={styles.chatTimeUser}>{msg.time}</AppText>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={styles.chatBubbleDoctor}>
                  <AppText style={styles.chatTextDoctor}>{msg.text}</AppText>
                  <AppText style={styles.chatTimeDoctor}>{msg.time}</AppText>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add-circle-outline" size={24} color="#64748b" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Reply to Doctor..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendBtn}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  keyboardAvoid: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { color: '#0f172a', fontWeight: '700', fontSize: 20 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl },
  headerSubtitle: { color: '#475569', marginBottom: spacing.sm },

  noteCard: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  patientNoteCard: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#a7f3d0', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, position: 'relative' },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  doctorInfo: { flex: 1 },
  doctorName: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  doctorTitle: { color: '#475569', marginTop: 2, fontSize: 11, lineHeight: 14 },
  newBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  
  messageBox: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  messageIndicator: { width: 4, backgroundColor: colors.primary, borderRadius: 2, marginRight: spacing.md },
  doctorMessage: { flex: 1, color: '#334155', fontStyle: 'italic', lineHeight: 22 },

  tagRow: { flexDirection: 'row', gap: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
  tagText: { color: '#0f172a', fontWeight: '600' },
  chatTimeFeedbackMsg: { color: '#64748b', fontSize: 10, alignSelf: 'flex-start', marginTop: spacing.sm },
  chatTimePatientMsg: { color: '#64748b', fontSize: 10, alignSelf: 'flex-end', marginTop: spacing.sm },

  chatSection: { marginTop: spacing.md },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  chatTitle: { color: '#475569', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },

  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#0369a1', padding: spacing.md, borderRadius: 16, borderBottomRightRadius: 4, maxWidth: '85%', marginBottom: spacing.md },
  chatTextUser: { color: '#fff', lineHeight: 20, marginBottom: 4 },
  chatTimeUser: { color: 'rgba(255,255,255,0.7)', fontSize: 10, alignSelf: 'flex-end' },

  feedbackMsgCard: { alignSelf: 'flex-end', backgroundColor: '#f0fdf4', padding: spacing.md, borderRadius: 16, borderBottomRightRadius: 4, width: '85%', marginBottom: spacing.md, borderWidth: 1, borderColor: '#bbf7d0' },
  feedbackMsgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  feedbackMsgTitle: { color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  feedbackMsgExercise: { color: '#0f172a', fontWeight: '700', fontSize: 18, marginBottom: spacing.md },
  feedbackMsgData: { backgroundColor: '#fff', borderRadius: 8, padding: spacing.sm, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  feedbackMsgRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  feedbackMsgLabel: { color: '#64748b' },
  chatTimeFeedback: { color: '#64748b', fontSize: 10, alignSelf: 'flex-end' },

  chatBubbleDoctor: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0', padding: spacing.md, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '85%', marginBottom: spacing.md },
  chatTextDoctor: { color: '#0f172a', lineHeight: 20, marginBottom: 4 },
  chatTimeDoctor: { color: '#64748b', fontSize: 10, alignSelf: 'flex-start' },

  inputArea: { padding: spacing.gutter, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  attachBtn: { padding: spacing.sm },
  textInput: { flex: 1, height: 40, fontFamily: typography.bodyMd.fontFamily, color: '#0f172a', paddingHorizontal: spacing.xs },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0369a1', alignItems: 'center', justifyContent: 'center' },
});

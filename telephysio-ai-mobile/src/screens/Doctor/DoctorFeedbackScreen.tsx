/**
 * DoctorFeedbackScreen — Doctor chat/feedback list with patients.
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

const CONVERSATIONS = [
  {
    id: '1', patient: 'Cody Li', lastMessage: 'Thank you doctor, the exercises helped a lot!',
    time: '5 min ago', unread: 2, avatar: 'C', hasFeedback: true,
    feedbackSummary: 'Pain level: 3/10 | Improved ROM'
  },
  {
    id: '2', patient: 'Emma Wilson', lastMessage: 'I felt some discomfort during shoulder rotations.',
    time: '1 hour ago', unread: 0, avatar: 'E', hasFeedback: true,
    feedbackSummary: 'Pain level: 6/10 | Stiffness reported'
  },
  {
    id: '3', patient: 'James Park', lastMessage: 'Session completed. Ready for next phase assessment.',
    time: '3 hours ago', unread: 1, avatar: 'J', hasFeedback: false,
    feedbackSummary: ''
  },
  {
    id: '4', patient: 'Maria Santos', lastMessage: 'Doctor, the ankle still swells after exercises.',
    time: 'Yesterday', unread: 3, avatar: 'M', hasFeedback: true,
    feedbackSummary: 'Pain level: 7/10 | Swelling | Needs review'
  },
  {
    id: '5', patient: 'Alex Chen', lastMessage: 'Can we schedule a video call for tomorrow?',
    time: 'Yesterday', unread: 0, avatar: 'A', hasFeedback: false,
    feedbackSummary: ''
  },
];

export const DoctorFeedbackScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = CONVERSATIONS.filter(c => {
    const matchesSearch = c.patient.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'unread') return matchesSearch && c.unread > 0;
    if (activeFilter === 'feedback') return matchesSearch && c.hasFeedback;
    return matchesSearch;
  });

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('DoctorProfile')}>
          <Ionicons name="person" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="headlineLg" style={styles.pageTitle}>Chat & Feedback</AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>
            {totalUnread} unread messages from patients
          </AppText>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${totalUnread})` },
            { key: 'feedback', label: 'With Feedback' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activeFilter === f.key && styles.chipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <AppText variant="labelSm" style={{ color: activeFilter === f.key ? '#fff' : '#475569', fontWeight: '600' }}>
                {f.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conversation List */}
        {filtered.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={[styles.convCard, conv.unread > 0 && styles.convCardUnread]}
            onPress={() => navigation.navigate('DoctorChat')}
          >
            <View style={styles.convRow}>
              {/* Avatar */}
              <View style={[styles.convAvatar, conv.unread > 0 ? { backgroundColor: colors.primary } : {}]}>
                <AppText variant="labelMd" style={{ color: conv.unread > 0 ? '#fff' : '#64748b', fontWeight: '700' }}>
                  {conv.avatar}
                </AppText>
              </View>

              {/* Content */}
              <View style={styles.convContent}>
                <View style={styles.convNameRow}>
                  <AppText variant="labelMd" style={[styles.convName, conv.unread > 0 && { color: colors.onSurface }]}>
                    {conv.patient}
                  </AppText>
                  <AppText variant="bodySm" style={[styles.convTime, conv.unread > 0 && { color: colors.primary }]}>
                    {conv.time}
                  </AppText>
                </View>
                <AppText variant="bodySm" style={styles.convMessage} numberOfLines={1}>
                  {conv.lastMessage}
                </AppText>

                {/* Feedback Summary */}
                {conv.hasFeedback && (
                  <View style={styles.feedbackTag}>
                    <Ionicons name="clipboard-outline" size={12} color="#b45309" />
                    <AppText variant="bodySm" style={styles.feedbackText} numberOfLines={1}>
                      {conv.feedbackSummary}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Unread Badge */}
              {conv.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <AppText variant="labelSm" style={styles.unreadText}>{conv.unread}</AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },

  header: { marginBottom: spacing.xs },
  pageTitle: { color: colors.primary, fontWeight: '800', fontSize: 24, marginBottom: 4 },
  pageSubtitle: { color: '#64748b' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },

  filtersRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: colors.primary },

  convCard: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0' },
  convCardUnread: { borderColor: colors.primary + '40', backgroundColor: '#f8faff' },
  convRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  convAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  convContent: { flex: 1 },
  convNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { color: '#475569', fontWeight: '700', fontSize: 15 },
  convTime: { color: '#94a3b8', fontSize: 11 },
  convMessage: { color: '#64748b', lineHeight: 18 },
  feedbackTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  feedbackText: { color: '#b45309', fontSize: 11 },

  unreadBadge: { backgroundColor: colors.primary, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

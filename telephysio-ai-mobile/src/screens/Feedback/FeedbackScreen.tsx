import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import {
  getFeedbackForUser,
  getFeedbackFromUser,
  sendFeedback,
} from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { Feedback } from '../../types';

export const FeedbackScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [fromDoctor, setFromDoctor] = useState<Feedback[]>([]);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'send' | 'received' | 'sent'>('send');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [from, mine] = await Promise.all([
        getFeedbackForUser(user.uid),
        getFeedbackFromUser(user.uid),
      ]);
      setFromDoctor(from.filter((f) => f.category === 'doctor_note'));
      setMyFeedback(mine);
    } catch (e) {
      console.error('Feedback load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSend = async () => {
    if (!user) return;
    if (!message.trim()) {
      Alert.alert('Missing Info', 'Please enter a message before sending.');
      return;
    }
    setSending(true);
    try {
      await sendFeedback({
        fromUserId: user.uid,
        fromUserName: user.name,
        toUserId: user.assignedDoctorId ?? 'unassigned',
        message: message.trim(),
        painLevel: painLevel > 0 ? painLevel : undefined,
        category: 'post_session',
      });
      setMessage('');
      setPainLevel(0);
      Alert.alert('Sent! 👍', 'Your feedback has been sent to your doctor.');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const PAIN_COLORS = ['', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#f44336', '#d32f2f', '#b71c1c'];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'send', label: 'Send Feedback' },
          { key: 'received', label: 'From Doctor' },
          { key: 'sent', label: 'Sent' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.key === 'received' && fromDoctor.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{fromDoctor.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Send feedback */}
        {tab === 'send' && (
          <View style={styles.sendSection}>
            <Card padding="md" style={styles.formCard}>
              <Text style={styles.formTitle}>💬 Send Feedback to Doctor</Text>
              <Text style={styles.formSub}>
                Share how you feel after your session, ask questions, or report any concerns.
              </Text>

              {/* Pain level */}
              <View style={styles.painSection}>
                <Text style={styles.painLabel}>
                  Pain / Discomfort Level: {painLevel > 0 ? `${painLevel}/10` : 'No pain'}
                </Text>
                <View style={styles.painScale}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.painDot,
                        {
                          backgroundColor: painLevel === level
                            ? (level === 0 ? colors.tertiary : PAIN_COLORS[level])
                            : colors.surfaceContainerHighest,
                          borderColor: painLevel === level ? 'transparent' : colors.outlineVariant,
                          transform: [{ scale: painLevel === level ? 1.2 : 1 }],
                        },
                      ]}
                      onPress={() => setPainLevel(level)}
                    >
                      <Text style={[
                        styles.painDotText,
                        { color: painLevel === level ? '#fff' : colors.onSurfaceVariant },
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.painLabels}>
                  <Text style={styles.painLabelEnd}>No pain</Text>
                  <Text style={styles.painLabelEnd}>Severe pain</Text>
                </View>
              </View>

              {/* Message input */}
              <View style={styles.inputArea}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={5}
                  placeholder="Describe how you feel after your session, questions for your doctor, or any issues..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={message}
                  onChangeText={setMessage}
                  textAlignVertical="top"
                />
              </View>

              <Button
                title="📤 Send Feedback"
                onPress={handleSend}
                loading={sending}
                fullWidth
              />
            </Card>

            {/* Quick templates */}
            <View style={styles.templates}>
              <Text style={styles.templatesTitle}>Quick Templates</Text>
              {[
                'I felt mild soreness in the area after today\'s session.',
                'Today\'s exercises were quite challenging, I couldn\'t complete all reps.',
                'I\'d like to increase the difficulty as I feel comfortable with the current level.',
                'Great session today, no issues at all!',
              ].map((tmpl, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.templateChip}
                  onPress={() => setMessage(tmpl)}
                >
                  <Text style={styles.templateText}>{tmpl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* From doctor */}
        {tab === 'received' && (
          <View style={styles.feedbackList}>
            {fromDoctor.length === 0 ? (
              <Card padding="lg" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👨‍⚕️</Text>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>Your doctor hasn't sent you any notes yet.</Text>
              </Card>
            ) : (
              fromDoctor.map((fb) => (
                <Card key={fb.id} elevated style={styles.feedbackCard} padding="md">
                  <View style={styles.feedbackHeader}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>👨‍⚕️</Text>
                    </View>
                    <View style={styles.feedbackMeta}>
                      <Text style={styles.feedbackFrom}>Doctor</Text>
                      <Text style={styles.feedbackDate}>{formatDate(fb.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.feedbackMsg}>{fb.message}</Text>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Sent */}
        {tab === 'sent' && (
          <View style={styles.feedbackList}>
            {myFeedback.length === 0 ? (
              <Card padding="lg" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No feedback sent yet</Text>
                <Text style={styles.emptyText}>Send feedback after each session so your doctor can monitor your progress.</Text>
              </Card>
            ) : (
              myFeedback.map((fb) => (
                <Card key={fb.id} style={styles.feedbackCard} padding="md">
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackMeta}>
                      <Text style={styles.feedbackDate}>{formatDate(fb.createdAt)}</Text>
                      {fb.painLevel !== undefined && fb.painLevel > 0 && (
                        <Text style={styles.painChip}>
                          Pain level: {fb.painLevel}/10
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.feedbackMsg}>{fb.message}</Text>
                  {fb.reply && (
                    <View style={styles.replyBox}>
                      <Text style={styles.replyLabel}>👨‍⚕️ Doctor's reply:</Text>
                      <Text style={styles.replyText}>{fb.reply}</Text>
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: { ...typography.labelMd, color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 11 },
  tabTextActive: { color: colors.primary },
  tabBadge: {
    backgroundColor: colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { ...typography.labelSm, color: colors.onError, fontSize: 9 },
  scroll: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl },

  sendSection: { gap: spacing.lg },
  formCard: { gap: spacing.lg },
  formTitle: { ...typography.headlineMd, color: colors.onSurface },
  formSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: -spacing.sm },
  painSection: { gap: spacing.sm },
  painLabel: { ...typography.labelMd, color: colors.onSurface },
  painScale: { flexDirection: 'row', justifyContent: 'space-between' },
  painDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  painDotText: { ...typography.labelSm, fontSize: 10 },
  painLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  painLabelEnd: { ...typography.labelSm, color: colors.onSurfaceVariant },
  inputArea: { gap: spacing.xs },
  inputLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 120,
  },
  templates: { gap: spacing.sm },
  templatesTitle: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  templateChip: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  templateText: { ...typography.bodySm, color: colors.onSurface },
  feedbackList: { gap: spacing.sm },
  feedbackCard: { gap: spacing.sm },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doctorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: { fontSize: 18 },
  feedbackMeta: { flex: 1, gap: 2 },
  feedbackFrom: { ...typography.labelMd, color: colors.primary },
  feedbackDate: { ...typography.labelSm, color: colors.onSurfaceVariant },
  feedbackMsg: { ...typography.bodyMd, color: colors.onSurface },
  painChip: { ...typography.labelSm, color: colors.error },
  replyBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyLabel: { ...typography.labelMd, color: colors.primary },
  replyText: { ...typography.bodySm, color: colors.onSurface },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});

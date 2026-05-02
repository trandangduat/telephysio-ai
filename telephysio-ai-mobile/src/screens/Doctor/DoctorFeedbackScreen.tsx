import React, { useEffect, useState, useCallback } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import {
  getFeedbackFromUser,
  replyToFeedback,
  sendFeedback,
} from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, typography, spacing, radius } from '../../theme';
import { Feedback } from '../../types';

type DoctorStackParamList = {
  DoctorFeedback: { patientId: string; patientName: string };
};

interface Props {
  route: RouteProp<DoctorStackParamList, 'DoctorFeedback'>;
}

export const DoctorFeedbackScreen: React.FC<Props> = ({ route }) => {
  const { patientId, patientName } = route.params;
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingNew, setSendingNew] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await getFeedbackFromUser(patientId);
      setFeedbacks(list);
    } catch (e) {
      console.error('DoctorFeedback load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReply = async (feedbackId: string) => {
    const reply = replyText[feedbackId]?.trim();
    if (!reply) { Alert.alert('Vui lòng nhập nội dung phản hồi.'); return; }
    setSendingReply(feedbackId);
    try {
      await replyToFeedback(feedbackId, reply);
      setReplyText((prev) => ({ ...prev, [feedbackId]: '' }));
      Alert.alert('Đã gửi phản hồi! ✅');
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi phản hồi.');
    } finally {
      setSendingReply(null);
    }
  };

  const handleSendNote = async () => {
    if (!user || !newMessage.trim()) { Alert.alert('Vui lòng nhập nội dung ghi chú.'); return; }
    setSendingNew(true);
    try {
      await sendFeedback({
        fromUserId: user.uid,
        fromUserName: user.name,
        toUserId: patientId,
        message: newMessage.trim(),
        category: 'doctor_note',
      });
      setNewMessage('');
      Alert.alert('Đã gửi ghi chú! 📋', `${patientName} sẽ nhận được thông báo.`);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi ghi chú.');
    } finally {
      setSendingNew(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const getPainColor = (level?: number) => {
    if (!level || level === 0) return colors.tertiary;
    if (level <= 3) return '#8bc34a';
    if (level <= 6) return '#ff9800';
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient banner */}
        <View style={styles.patientBanner}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{patientName?.[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>{feedbacks.length} phản hồi</Text>
          </View>
        </View>

        {/* Send note to patient */}
        <Card elevated style={styles.noteCard} padding="md">
          <Text style={styles.noteTitle}>📋 Gửi ghi chú y tế cho bệnh nhân</Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={4}
            placeholder={`Ghi chú cho ${patientName}... Ví dụ: điều chỉnh bài tập, lời khuyên, nhắc nhở...`}
            placeholderTextColor={colors.onSurfaceVariant}
            value={newMessage}
            onChangeText={setNewMessage}
            textAlignVertical="top"
          />
          <View style={styles.noteTemplates}>
            {[
              'Bạn đang tiến bộ rất tốt! Hãy duy trì nhịp tập đều đặn.',
              'Tôi nhận thấy điểm số hôm nay giảm. Hãy nghỉ ngơi và thử lại ngày mai.',
              'Hãy tập bài gối thêm 2 lần/tuần để cải thiện biên độ vận động.',
            ].map((tmpl, i) => (
              <TouchableOpacity key={i} style={styles.templateChip} onPress={() => setNewMessage(tmpl)}>
                <Text style={styles.templateText} numberOfLines={1}>{tmpl}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title="📤 Gửi ghi chú" onPress={handleSendNote} loading={sendingNew} fullWidth />
        </Card>

        {/* Patient feedbacks */}
        <Text style={styles.sectionTitle}>Phản hồi từ bệnh nhân ({feedbacks.length})</Text>

        {feedbacks.length === 0 ? (
          <Card padding="lg" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Chưa có phản hồi nào</Text>
            <Text style={styles.emptyText}>{patientName} chưa gửi phản hồi sau buổi tập.</Text>
          </Card>
        ) : (
          feedbacks.map((fb) => (
            <Card key={fb.id} style={styles.feedbackCard} padding="md">
              {/* Feedback header */}
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackDate}>{formatDate(fb.createdAt)}</Text>
                {fb.painLevel !== undefined && fb.painLevel > 0 && (
                  <View style={[styles.painChip, { backgroundColor: getPainColor(fb.painLevel) + '20' }]}>
                    <Text style={[styles.painChipText, { color: getPainColor(fb.painLevel) }]}>
                      😣 Mức đau: {fb.painLevel}/10
                    </Text>
                  </View>
                )}
              </View>

              {/* Patient message */}
              <View style={styles.patientMessage}>
                <Text style={styles.patientMessageLabel}>Bệnh nhân nói:</Text>
                <Text style={styles.patientMessageText}>{fb.message}</Text>
              </View>

              {/* Existing reply */}
              {fb.reply && (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>✅ Phản hồi của bạn ({fb.replyAt ? formatDate(fb.replyAt) : ''})</Text>
                  <Text style={styles.replyText}>{fb.reply}</Text>
                </View>
              )}

              {/* Reply input */}
              {!fb.reply && (
                <View style={styles.replyInput}>
                  <TextInput
                    style={styles.replyTextInput}
                    placeholder="Nhập phản hồi cho bệnh nhân..."
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={replyText[fb.id] ?? ''}
                    onChangeText={(text) => setReplyText((prev) => ({ ...prev, [fb.id]: text }))}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.replyBtn, sendingReply === fb.id && styles.replyBtnLoading]}
                    onPress={() => handleReply(fb.id)}
                    disabled={sendingReply === fb.id}
                  >
                    <Text style={styles.replyBtnText}>
                      {sendingReply === fb.id ? '...' : 'Gửi →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.gutter, paddingBottom: spacing.xl, gap: spacing.md },
  patientBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  patientAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { fontSize: 20, fontWeight: '700', color: colors.secondary },
  patientName: { ...typography.headlineMd, color: colors.onSurface },
  patientSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  noteCard: { gap: spacing.md },
  noteTitle: { ...typography.headlineMd, color: colors.onSurface },
  noteInput: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 100,
  },
  noteTemplates: { gap: spacing.sm },
  templateChip: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  templateText: { ...typography.bodySm, color: colors.onSurface },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  feedbackCard: { gap: spacing.md },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  feedbackDate: { ...typography.labelSm, color: colors.onSurfaceVariant },
  painChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  painChipText: { ...typography.labelMd },
  patientMessage: { gap: spacing.xs },
  patientMessageLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  patientMessageText: { ...typography.bodyMd, color: colors.onSurface },
  replyBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.tertiary,
  },
  replyLabel: { ...typography.labelMd, color: colors.tertiary },
  replyText: { ...typography.bodySm, color: colors.onSurface },
  replyInput: { gap: spacing.sm },
  replyTextInput: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...typography.bodySm,
    color: colors.onSurface,
    minHeight: 72,
  },
  replyBtn: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  replyBtnLoading: { opacity: 0.6 },
  replyBtnText: { ...typography.labelMd, color: colors.onPrimary },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});

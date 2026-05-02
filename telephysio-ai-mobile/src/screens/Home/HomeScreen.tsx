import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../services/auth';
import {
  getPatientAssignments,
  getFeedbackForUser,
  getRecentSessions,
  getPatientStats,
} from '../../services/firestore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { Assignment, Feedback, Session } from '../../types';

type PatientStackParamList = {
  Home: undefined;
  Library: undefined;
  Calibration: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
  Session: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
  Progress: undefined;
  Feedback: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'Home'>;
}

const GREETING = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 17) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const BODY_PART_LABELS: Record<string, string> = {
  shoulder: 'Vai',
  knee: 'Gối',
  back: 'Lưng',
  arm: 'Cánh tay',
  leg: 'Chân',
  hip: 'Hông',
  ankle: 'Cổ chân',
};

const DIFFICULTY_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, avgScore: 0, currentStreak: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [asgn, fb, st] = await Promise.all([
        getPatientAssignments(user.uid),
        getFeedbackForUser(user.uid),
        getPatientStats(user.uid),
      ]);
      setAssignments(asgn);
      setFeedback(fb);
      setStats(st);
    } catch (e) {
      console.error('HomeScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
        },
      },
    ]);
  };

  const handleStartExercise = (asgn: Assignment) => {
    navigation.navigate('Calibration', {
      exerciseId: asgn.exerciseId,
      exerciseName: asgn.exerciseName,
      targetReps: asgn.targetReps,
      sets: asgn.sets,
    });
  };

  const unreadFeedback = feedback.filter((f) => f.reply && !f.replyAt);
  const doctorMessages = feedback.filter((f) => f.category === 'doctor_note').slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{GREETING()},</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'Bạn'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={handleLogout}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding="md">
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>🔥 Chuỗi ngày</Text>
          </Card>
          <Card style={styles.statCard} padding="md">
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>📋 Buổi tập</Text>
          </Card>
          <Card style={styles.statCard} padding="md">
            <Text style={styles.statValue}>
              {stats.avgScore > 0 ? `${stats.avgScore}%` : '--'}
            </Text>
            <Text style={styles.statLabel}>⭐ Điểm TB</Text>
          </Card>
        </View>

        {/* Doctor Message Banner */}
        {doctorMessages.length > 0 && (
          <Card elevated style={styles.doctorBanner} padding="md">
            <View style={styles.doctorBannerHeader}>
              <Text style={styles.doctorBannerIcon}>👨‍⚕️</Text>
              <View style={styles.doctorBannerInfo}>
                <Text style={styles.doctorBannerTitle}>Thông báo từ bác sĩ</Text>
                <Text style={styles.doctorBannerSub} numberOfLines={2}>
                  {doctorMessages[0].message}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Feedback')}
              style={styles.doctorBannerBtn}
            >
              <Text style={styles.doctorBannerBtnText}>Xem chi tiết →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Today's Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài tập hôm nay</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
              <Text style={styles.sectionLink}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Card padding="lg" style={styles.emptyCard}>
              <Text style={styles.emptyText}>Đang tải bài tập...</Text>
            </Card>
          ) : assignments.length === 0 ? (
            <Card padding="lg" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyTitle}>Chưa có bài tập</Text>
              <Text style={styles.emptyText}>
                Bác sĩ chưa chỉ định bài tập cho bạn.{'\n'}Hãy liên hệ bác sĩ để được phân công.
              </Text>
            </Card>
          ) : (
            assignments.map((asgn, i) => (
              <Card key={`${asgn.exerciseId}-${i}`} style={styles.exerciseCard} padding="md">
                <View style={styles.exerciseCardTop}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{asgn.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      {asgn.sets} hiệp × {asgn.targetReps} lần
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => handleStartExercise(asgn)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startBtnText}>Bắt đầu</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          <View style={styles.quickActions}>
            {[
              { icon: '📊', label: 'Tiến độ', screen: 'Progress' as const },
              { icon: '💬', label: 'Phản hồi', screen: 'Feedback' as const },
              { icon: '📚', label: 'Thư viện', screen: 'Library' as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.quickAction}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <Card padding="md" style={styles.quickActionCard}>
                  <Text style={styles.quickActionIcon}>{item.icon}</Text>
                  <Text style={styles.quickActionLabel}>{item.label}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  headerLeft: { flex: 1 },
  greeting: { ...typography.bodySm, color: colors.onSurfaceVariant },
  userName: { ...typography.headlineLg, color: colors.onSurface, marginTop: 2 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0,71,141,0.2)',
  } as any,
  avatarText: { ...typography.headlineMd, color: colors.onPrimary, fontSize: 18 },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.headlineLg, color: colors.primary, textAlign: 'center' },
  statLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 },

  doctorBanner: { gap: spacing.sm },
  doctorBannerHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  doctorBannerIcon: { fontSize: 28 },
  doctorBannerInfo: { flex: 1 },
  doctorBannerTitle: { ...typography.labelMd, color: colors.primary, textTransform: 'uppercase' },
  doctorBannerSub: { ...typography.bodySm, color: colors.onSurface, marginTop: 2 },
  doctorBannerBtn: { alignSelf: 'flex-end' },
  doctorBannerBtnText: { ...typography.labelMd, color: colors.primary },

  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  sectionLink: { ...typography.labelMd, color: colors.primary },

  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 36, textAlign: 'center' },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },

  exerciseCard: { gap: spacing.sm },
  exerciseCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.headlineMd, color: colors.onSurface },
  exerciseMeta: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  startBtnText: { ...typography.labelMd, color: colors.onPrimary },

  quickActions: { flexDirection: 'row', gap: spacing.sm },
  quickAction: { flex: 1 },
  quickActionCard: { alignItems: 'center', gap: spacing.xs },
  quickActionIcon: { fontSize: 28 },
  quickActionLabel: { ...typography.labelMd, color: colors.onSurface, textAlign: 'center' },
});

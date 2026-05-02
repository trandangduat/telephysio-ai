import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList, BottomTabParamList } from '../../navigation/types';
import { getPatientAssignments } from '../../services/firebase';
import type { Assignment, Exercise } from '../../services/firebase/types';

type WorkoutNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Workout'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: WorkoutNavProp;
}

export const WorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { uid } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const assignments = await getPatientAssignments(uid, 'active');
        if (assignments.length > 0) {
          // Just take the first active assignment's exercises for today's routine
          setExercises(assignments[0].exercises || []);
        } else {
          setExercises([]);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Unified Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
        </View>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DoctorChat' as any)}>
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

      <View style={styles.header}>
        <AppText variant="headlineLg" style={styles.title}>
          {t('workout.title', 'Today\'s Routine')}
        </AppText>
        <AppText variant="bodyMd" style={styles.subtitle}>
          {t('workout.subtitle', 'Complete these exercises to reach your daily goal.')}
        </AppText>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length > 0 ? exercises.map((ex, index) => (
          <View key={ex.id || index.toString()} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: (ex.color || colors.primary) + '1A' }]}>
                <Ionicons name={(ex.icon || 'barbell-outline') as any} size={24} color={ex.color || colors.primary} />
              </View>
              <View style={styles.cardTitleCol}>
                <AppText variant="headlineMd" style={styles.exerciseName}>{ex.name}</AppText>
                <AppText variant="bodySm" style={styles.exerciseDetails}>
                  {ex.sets} Sets • {ex.reps} Reps • {ex.duration}
                </AppText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => navigation.navigate('Calibration')}
            >
              <Ionicons name="play" size={16} color="#fff" style={{ marginRight: 6 }} />
              <AppText variant="labelMd" style={{ color: '#fff' }}>Start Exercise</AppText>
            </TouchableOpacity>
          </View>
        )) : (
          <AppText variant="bodyMd" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl }}>
            No exercises assigned for today. Great job resting!
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { color: '#0f172a', fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardTitleCol: { flex: 1 },
  exerciseName: { color: '#0f172a', fontWeight: '700', fontSize: 20 },
  exerciseDetails: { color: '#64748b', marginTop: 2, fontWeight: '500' },
  startButton: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
});

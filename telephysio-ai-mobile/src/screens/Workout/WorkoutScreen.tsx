/**
 * WorkoutScreen
 *
 * Tab entry for Workout. Displays the list of exercises for the current routine.
 * Allows the user to select an exercise and start it (navigates to Calibration).
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList, BottomTabParamList } from '../../navigation/types';

type WorkoutNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Workout'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: WorkoutNavProp;
}

const mockExercises = [
  { id: '1', name: 'Squat', sets: 3, reps: 10, duration: '5 mins', icon: 'barbell-outline', color: colors.primary },
  { id: '2', name: 'Post-Op Knee Flexion', sets: 2, reps: 15, duration: '10 mins', icon: 'fitness-outline', color: '#0f766e' },
  { id: '3', name: 'Lunges', sets: 3, reps: 12, duration: '8 mins', icon: 'walk-outline', color: '#6366f1' },
];

export const WorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

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
        {mockExercises.map((ex, index) => (
          <View key={ex.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: ex.color + '1A' }]}>
                <Ionicons name={ex.icon as any} size={24} color={ex.color} />
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

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import {
  getAllExercises,
  getPatientAssignments,
  assignExercise,
  removeAssignment,
} from '../../services/firestore';
import { seedExercises } from '../../services/exercises';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { Exercise, Assignment } from '../../types';

type DoctorStackParamList = {
  AssignExercise: { patientId: string; patientName: string };
};

interface Props {
  route: RouteProp<DoctorStackParamList, 'AssignExercise'>;
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFFICULTY_BADGE: Record<string, 'success' | 'warning' | 'error'> = { easy: 'success', medium: 'warning', hard: 'error' };

export const AssignExerciseScreen: React.FC<Props> = ({ route }) => {
  const { patientId, patientName } = route.params;
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      await seedExercises();
      const [exs, assignments] = await Promise.all([
        getAllExercises(),
        getPatientAssignments(patientId),
      ]);
      setExercises(exs);
      setCurrentAssignments(new Set(assignments.map((a) => a.exerciseId)));
    } catch (e) {
      console.error('AssignExercise load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleAssign = async (exercise: Exercise) => {
    if (!user) return;
    const isAssigned = currentAssignments.has(exercise.id);
    setAssigning(exercise.id);
    try {
      if (isAssigned) {
        await removeAssignment(patientId, exercise.id);
        setCurrentAssignments((prev) => {
          const next = new Set(prev);
          next.delete(exercise.id);
          return next;
        });
        Alert.alert('Exercise removed', `Removed "${exercise.name}" from ${patientName}.`);
      } else {
        await assignExercise(patientId, exercise, user.uid);
        setCurrentAssignments((prev) => new Set([...prev, exercise.id]));
        Alert.alert('Exercise assigned ✅', `Assigned "${exercise.name}" to ${patientName}.`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update exercise. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  const BODY_PART_LABELS: Record<string, string> = {
    shoulder: '🏋️ Vai', knee: '🦵 Gối', back: '🔙 Lưng',
    arm: '💪 Cánh tay', hip: '🏃 Hông', ankle: '🦶 Cổ chân', leg: '🦵 Chân',
  };

  const grouped = exercises.reduce((acc, ex) => {
    const group = acc[ex.bodyPart] ?? [];
    group.push(ex);
    acc[ex.bodyPart] = group;
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Patient info banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Assigning exercises to</Text>
        <Text style={styles.bannerPatient}>{patientName}</Text>
        <Text style={styles.bannerSub}>{currentAssignments.size} exercises currently assigned</Text>
      </View>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([bodyPart]) => bodyPart}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        renderItem={({ item: [bodyPart, exList] }) => (
          <View style={styles.groupSection}>
            <Text style={styles.groupTitle}>{BODY_PART_LABELS[bodyPart] ?? bodyPart}</Text>
            {exList.map((ex) => {
              const isAssigned = currentAssignments.has(ex.id);
              const isLoading = assigning === ex.id;
              return (
                <Card
                  key={ex.id}
                  style={[styles.exerciseCard, isAssigned && styles.exerciseCardAssigned]}
                  padding="md"
                >
                  <View style={styles.exerciseTop}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <View style={styles.exerciseTags}>
                        <Badge label={DIFFICULTY_LABEL[ex.difficulty]} variant={DIFFICULTY_BADGE[ex.difficulty]} size="sm" />
                        <Text style={styles.exerciseMeta}>{ex.sets} sets × {ex.targetReps} reps</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.assignBtn,
                        isAssigned ? styles.assignBtnRemove : styles.assignBtnAdd,
                      ]}
                      onPress={() => handleToggleAssign(ex)}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.assignBtnText,
                        isAssigned ? styles.assignBtnTextRemove : styles.assignBtnTextAdd,
                      ]}>
                        {isLoading ? '...' : isAssigned ? '✓ Assigned' : '+ Assign'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.exerciseDesc} numberOfLines={2}>{ex.description}</Text>
                </Card>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>Loading exercise list...</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  banner: {
    padding: spacing.gutter,
    paddingBottom: spacing.md,
    backgroundColor: colors.primaryFixed,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryFixedDim,
  },
  bannerTitle: { ...typography.labelMd, color: colors.onPrimaryFixedVariant, textTransform: 'uppercase' },
  bannerPatient: { ...typography.headlineLg, color: colors.primary },
  bannerSub: { ...typography.bodySm, color: colors.onPrimaryFixedVariant, marginTop: 2 },
  list: { padding: spacing.gutter, paddingBottom: spacing.xl, gap: spacing.lg },
  groupSection: { gap: spacing.sm },
  groupTitle: { ...typography.headlineMd, color: colors.onSurface },
  exerciseCard: { gap: spacing.sm },
  exerciseCardAssigned: {
    borderColor: colors.tertiary,
    backgroundColor: colors.tertiaryFixed + '30',
  },
  exerciseTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  exerciseInfo: { flex: 1, gap: spacing.xs },
  exerciseName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  exerciseTags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseMeta: { ...typography.labelSm, color: colors.onSurfaceVariant },
  assignBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  assignBtnAdd: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assignBtnRemove: {
    backgroundColor: colors.tertiaryFixed,
    borderColor: colors.tertiary,
  },
  assignBtnText: { ...typography.labelMd },
  assignBtnTextAdd: { color: colors.onPrimary },
  assignBtnTextRemove: { color: colors.tertiary },
  exerciseDesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  loadingText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
});

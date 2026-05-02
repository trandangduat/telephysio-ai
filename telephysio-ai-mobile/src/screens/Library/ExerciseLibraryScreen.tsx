import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { getAllExercises } from '../../services/firestore';
import { seedExercises } from '../../services/exercises';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing, radius } from '../../theme';
import { Exercise, BodyPart } from '../../types';

type PatientStackParamList = {
  Calibration: { exerciseId: string; exerciseName: string; targetReps: number; sets: number };
};

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const BODY_PARTS: { value: BodyPart | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '💪' },
  { value: 'shoulder', label: 'Shoulder', icon: '🏋️' },
  { value: 'knee', label: 'Knee', icon: '🦵' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'arm', label: 'Arm', icon: '💪' },
  { value: 'hip', label: 'Hip', icon: '🏃' },
  { value: 'ankle', label: 'Ankle', icon: '🦶' },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy', medium: 'Medium', hard: 'Hard',
};
const DIFFICULTY_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success', medium: 'warning', hard: 'error',
};

export const ExerciseLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      await seedExercises();
      const list = await getAllExercises();
      setExercises(list);
      setFiltered(list);
    } catch (e) {
      console.error('Load exercises error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    let result = exercises;
    if (selectedBodyPart !== 'all') {
      result = result.filter((e) => e.bodyPart === selectedBodyPart);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.bodyPart.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [exercises, selectedBodyPart, search]);

  const handleStartExercise = (ex: Exercise) => {
    navigation.navigate('Calibration', {
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetReps: ex.targetReps,
      sets: ex.sets,
    });
  };

  const renderExercise = ({ item: ex }: { item: Exercise }) => {
    const isExpanded = expanded === ex.id;
    return (
      <Card style={styles.card} padding="md">
        <TouchableOpacity
          onPress={() => setExpanded(isExpanded ? null : ex.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{ex.name}</Text>
              <View style={styles.cardTags}>
                <Badge label={DIFFICULTY_LABEL[ex.difficulty]} variant={DIFFICULTY_BADGE[ex.difficulty]} size="sm" />
                <Text style={styles.cardMeta}>{ex.sets} sets × {ex.targetReps} reps</Text>
              </View>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 2}>
            {ex.description}
          </Text>
        </TouchableOpacity>

        {isExpanded && ex.instructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            {ex.instructions.map((step, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={styles.instructionNum}>
                  <Text style={styles.instructionNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => handleStartExercise(ex)}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>▶ Start Exercise</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Body part filter */}
      <FlatList
        data={BODY_PARTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, selectedBodyPart === item.value && styles.filterChipActive]}
            onPress={() => setSelectedBodyPart(item.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterIcon}>{item.icon}</Text>
            <Text style={[styles.filterLabel, selectedBodyPart === item.value && styles.filterLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Exercise list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExercises(); }} tintColor={colors.primary} />
        }
        renderItem={renderExercise}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loading ? (
            <Card padding="xl" style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading exercises...</Text>
            </Card>
          ) : (
            <Card padding="xl" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No exercises found for this filter.</Text>
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.gutter,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  filterList: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  filterIcon: { fontSize: 14 },
  filterLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  filterLabelActive: { color: colors.primary },
  list: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.xl },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardInfo: { flex: 1, gap: spacing.xs },
  cardName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardMeta: { ...typography.labelSm, color: colors.onSurfaceVariant },
  cardDesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  expandIcon: { ...typography.bodySm, color: colors.onSurfaceVariant },
  instructions: { gap: spacing.sm },
  instructionsTitle: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  instructionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  instructionNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  instructionNumText: { ...typography.labelSm, color: colors.primary },
  instructionText: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  startBtnText: { ...typography.labelMd, color: colors.onPrimary },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});

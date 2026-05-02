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
  { value: 'all', label: 'Tất cả', icon: '💪' },
  { value: 'shoulder', label: 'Vai', icon: '🏋️' },
  { value: 'knee', label: 'Gối', icon: '🦵' },
  { value: 'back', label: 'Lưng', icon: '🔙' },
  { value: 'arm', label: 'Tay', icon: '💪' },
  { value: 'hip', label: 'Hông', icon: '🏃' },
  { value: 'ankle', label: 'Cổ chân', icon: '🦶' },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Dễ', medium: 'Trung bình', hard: 'Khó',
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
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <View style={styles.tags}>
                <Badge
                  label={DIFFICULTY_LABEL[ex.difficulty]}
                  variant={DIFFICULTY_BADGE[ex.difficulty]}
                  size="sm"
                />
                <Text style={styles.metaText}>
                  {ex.sets} hiệp × {ex.targetReps} lần
                </Text>
              </View>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </View>

          {!isExpanded && (
            <Text style={styles.descriptionShort} numberOfLines={2}>
              {ex.description}
            </Text>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.description}>{ex.description}</Text>

            {ex.instructions && ex.instructions.length > 0 && (
              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>📋 Hướng dẫn thực hiện</Text>
                {ex.instructions.map((step, i) => (
                  <View key={i} style={styles.instructionStep}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => handleStartExercise(ex)}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>▶ Bắt đầu bài tập này</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm bài tập..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body part filter */}
      <FlatList
        data={BODY_PARTS}
        keyExtractor={(item) => item.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedBodyPart === item.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedBodyPart(item.value)}
          >
            <Text style={styles.filterChipIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.filterChipText,
                selectedBodyPart === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Exercises list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderExercise}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadExercises(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {loading ? 'Đang tải...' : 'Không tìm thấy bài tập'}
            </Text>
            <Text style={styles.emptyText}>
              {loading ? '' : 'Thử tìm kiếm với từ khóa khác'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 48,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primary,
  },
  filterChipIcon: { fontSize: 14 },
  filterChipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  filterChipTextActive: { color: colors.primary },
  list: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
  },
  card: { gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1, gap: spacing.xs },
  exerciseName: { ...typography.headlineMd, color: colors.onSurface },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  expandIcon: { color: colors.onSurfaceVariant, fontSize: 12 },
  descriptionShort: { ...typography.bodySm, color: colors.onSurfaceVariant },
  expandedContent: { gap: spacing.md },
  description: { ...typography.bodyMd, color: colors.onSurface },
  instructions: { gap: spacing.sm },
  instructionsTitle: { ...typography.labelMd, color: colors.primary },
  instructionStep: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { ...typography.labelSm, color: colors.primary, fontWeight: '700' },
  stepText: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0,71,141,0.24)',
  } as any,
  startBtnText: { ...typography.labelMd, color: colors.onPrimary, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});

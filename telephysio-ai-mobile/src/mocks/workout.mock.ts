/**
 * Mock data — Workout / Training
 */

export interface Exercise {
  id: string;
  name: string;
  duration: string;
  sets: number;
  reps: number;
  thumbnail?: string;
  category: 'assigned' | 'reference';
  phase?: string;
  description?: string;
}

export interface WorkoutSession {
  exerciseId: string;
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  currentRep: number;
  totalReps: number;
  formAccuracy: number; // 0-100
  elapsedSeconds: number;
}

export const todayWorkout: Exercise = {
  id: 'ex-001',
  name: 'Gập khuỷu tay trái',
  duration: '15 phút',
  sets: 3,
  reps: 12,
  category: 'assigned',
  phase: 'Giai đoạn 2 — Tăng cường',
  description: 'Gập khuỷu tay từ từ, giữ 2 giây rồi thả. Giữ thẳng lưng.',
};

export const exerciseLibrary: Exercise[] = [
  {
    id: 'ex-001',
    name: 'Gập khuỷu tay trái',
    duration: '15 phút',
    sets: 3,
    reps: 12,
    category: 'assigned',
    phase: 'Giai đoạn 2',
  },
  {
    id: 'ex-002',
    name: 'Duỗi đầu gối phải',
    duration: '10 phút',
    sets: 3,
    reps: 15,
    category: 'assigned',
    phase: 'Giai đoạn 2',
  },
  {
    id: 'ex-003',
    name: 'Xoay vai đơn giản',
    duration: '8 phút',
    sets: 2,
    reps: 10,
    category: 'assigned',
    phase: 'Giai đoạn 1',
  },
  {
    id: 'ex-004',
    name: 'Kéo căng gân kheo',
    duration: '12 phút',
    sets: 3,
    reps: 10,
    category: 'reference',
    description: 'Bài tập tham khảo thêm, chưa được giao.',
  },
  {
    id: 'ex-005',
    name: 'Nâng chân bên',
    duration: '10 phút',
    sets: 2,
    reps: 12,
    category: 'reference',
  },
  {
    id: 'ex-006',
    name: 'Ép bóng đầu gối',
    duration: '5 phút',
    sets: 3,
    reps: 15,
    category: 'assigned',
    phase: 'Giai đoạn 1',
  },
];

export const mockSession: WorkoutSession = {
  exerciseId: 'ex-001',
  exerciseName: 'Gập khuỷu tay trái',
  currentSet: 1,
  totalSets: 3,
  currentRep: 0,
  totalReps: 12,
  formAccuracy: 0,
  elapsedSeconds: 0,
};

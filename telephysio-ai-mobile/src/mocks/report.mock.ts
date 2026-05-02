/**
 * Mock data — Report / Progress
 */

export interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  date?: string;
}

export interface SessionHistory {
  id: string;
  date: string;
  exerciseName: string;
  duration: string;
  reps: number;
  formAccuracy: number;
}

export interface ProgressData {
  weeklyScores: number[];         // 7 days, 0-100
  overallCompletion: number;       // 0-100
  totalSessions: number;
  totalMinutes: number;
  averageAccuracy: number;
  summaryText: string;
}

export const mockProgress: ProgressData = {
  weeklyScores: [62, 68, 71, 75, 78, 82, 88],
  overallCompletion: 72,
  totalSessions: 14,
  totalMinutes: 210,
  averageAccuracy: 85,
  summaryText:
    'Tuần này bạn đã hoàn thành 5/7 buổi tập. Biên độ vận động khuỷu tay trái cải thiện 12% so với tuần trước. Tiếp tục phát huy!',
};

export const mockMilestones: Milestone[] = [
  { id: 'm1', label: 'Hoàn thành 5 buổi tập liên tiếp', achieved: true, date: '28/04/2026' },
  { id: 'm2', label: 'ROM khuỷu tay đạt 90°', achieved: true, date: '26/04/2026' },
  { id: 'm3', label: 'Form Accuracy trung bình > 80%', achieved: true, date: '30/04/2026' },
  { id: 'm4', label: 'ROM khuỷu tay đạt 120°', achieved: false },
  { id: 'm5', label: 'Hoàn thành Giai đoạn 2', achieved: false },
];

export const mockSessionHistory: SessionHistory[] = [
  { id: 'sh1', date: '01/05/2026', exerciseName: 'Gập khuỷu tay trái', duration: '14 phút', reps: 36, formAccuracy: 88 },
  { id: 'sh2', date: '30/04/2026', exerciseName: 'Duỗi đầu gối phải', duration: '11 phút', reps: 45, formAccuracy: 82 },
  { id: 'sh3', date: '29/04/2026', exerciseName: 'Gập khuỷu tay trái', duration: '15 phút', reps: 36, formAccuracy: 85 },
  { id: 'sh4', date: '28/04/2026', exerciseName: 'Xoay vai đơn giản', duration: '9 phút', reps: 20, formAccuracy: 91 },
  { id: 'sh5', date: '27/04/2026', exerciseName: 'Gập khuỷu tay trái', duration: '13 phút', reps: 36, formAccuracy: 79 },
];

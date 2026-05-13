import type { Session } from '../services/firebase/types';
/**
 * Navigation — central type definitions & param lists.
 */

// ── Auth Navigation ─────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

// ── Patient Navigation ──────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  Calibration: { assignmentId: string; exerciseIndex: number };
  Training: { assignmentId: string; exerciseIndex: number };
  ExerciseResult: { assignmentId: string; exerciseIndex: number; accuracy: number; durationSeconds: number; reps: number; sets: number };
  WorkoutSummary: { assignmentId: string };
  DoctorChat: undefined;
  Profile: undefined;
  MyAssignments: undefined;
  WorkoutDetail: { assignmentId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Workout: undefined;
  Sessions: undefined;
  Library: undefined;
  Progress: undefined;
};

// ── Doctor Navigation ───────────────────────────────
export type DoctorStackParamList = {
  DoctorTabs: undefined;
  PatientDetail: { patientId: string; patientName: string };
  DoctorProfile: undefined;
  DoctorChat: undefined;
  TemplateEditor: { templateId?: string };
  AssignTemplate: { templateId: string; templateName: string };
  DoctorSessionDetail: { session: Session; patientName: string };
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  Assignments: undefined;
  DoctorFeedback: undefined;
};

// Screen names as constants to avoid typo
export const SCREENS = {
  // Auth
  Login: 'Login',
  SignUp: 'SignUp',
  // Patient
  MainTabs: 'MainTabs',
  Home: 'Home',
  Calibration: 'Calibration',
  Training: 'Training',
  ExerciseResult: 'ExerciseResult',
  WorkoutSummary: 'WorkoutSummary',
  Workout: 'Workout',
  Profile: 'Profile',
  MyAssignments: 'MyAssignments',
  WorkoutDetail: 'WorkoutDetail',
  // Doctor
  DoctorTabs: 'DoctorTabs',
  Dashboard: 'Dashboard',
  Assignments: 'Assignments',
  DoctorFeedback: 'DoctorFeedback',
  Patients: 'Patients',
  PatientDetail: 'PatientDetail',
  DoctorProfile: 'DoctorProfile',
  TemplateEditor: 'TemplateEditor',
  AssignTemplate: 'AssignTemplate',
  DoctorSessionDetail: 'DoctorSessionDetail',
} as const;

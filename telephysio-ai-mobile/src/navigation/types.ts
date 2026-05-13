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
  Calibration: undefined;
  Training: undefined;
  DoctorChat: undefined;
  Profile: undefined;
  MyAssignments: undefined;
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
  AssignTemplate: { templateId?: string; templateName?: string; patientId?: string; patientName?: string };
  PatientSessions: { patientId: string; patientName: string };
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
  Workout: 'Workout',
  Profile: 'Profile',
  MyAssignments: 'MyAssignments',
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

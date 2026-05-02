/**
 * Navigation — central type definitions & param lists.
 */

// ── Patient Navigation ──────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  Calibration: undefined;
  Training: undefined;
  DoctorChat: undefined;
  Profile: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Workout: undefined;
  Feedback: undefined;
  Library: undefined;
  Progress: undefined;
};

// ── Doctor Navigation ───────────────────────────────
export type DoctorStackParamList = {
  DoctorTabs: undefined;
  PatientDetail: { patientId: string; patientName: string };
  DoctorProfile: undefined;
  DoctorChat: undefined;
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  Assignments: undefined;
  DoctorFeedback: undefined;
  Patients: undefined;
};

// Screen names as constants to avoid typo
export const SCREENS = {
  // Patient
  MainTabs: 'MainTabs',
  Home: 'Home',
  Calibration: 'Calibration',
  Training: 'Training',
  Workout: 'Workout',
  Feedback: 'Feedback',
  Profile: 'Profile',
  // Doctor
  DoctorTabs: 'DoctorTabs',
  Dashboard: 'Dashboard',
  Assignments: 'Assignments',
  DoctorFeedback: 'DoctorFeedback',
  Patients: 'Patients',
  PatientDetail: 'PatientDetail',
  DoctorProfile: 'DoctorProfile',
} as const;

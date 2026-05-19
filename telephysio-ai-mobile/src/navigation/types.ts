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
    ExerciseResult: { assignmentId: string; exerciseIndex: number; accuracy: number; durationSeconds: number; reps: number; sets: number; setDurations?: number[] };
    WorkoutSummary: { assignmentId: string };
    Profile: undefined;
    MyAssignments: undefined;
    WorkoutDetail: { assignmentId: string };
    Notifications: undefined;
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
    TemplateEditor: { templateId?: string };
    AssignTemplate: { templateId?: string; templateName?: string; patientId?: string; patientName?: string };
    PatientSessions: { patientId: string; patientName: string };
    DoctorSessionDetail: { session: Session; patientName: string };
    Notifications: undefined;
};

export type DoctorTabParamList = {
    Dashboard: undefined;
    Assignments: undefined;
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
    Notifications: 'Notifications',
    // Doctor
    DoctorTabs: 'DoctorTabs',
    Dashboard: 'Dashboard',
    Assignments: 'Assignments',
    Patients: 'Patients',
    PatientDetail: 'PatientDetail',
    DoctorProfile: 'DoctorProfile',
    TemplateEditor: 'TemplateEditor',
    AssignTemplate: 'AssignTemplate',
    DoctorSessionDetail: 'DoctorSessionDetail',
} as const;

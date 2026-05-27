/**
 * Firebase TypeScript Types — Derived from UI data shapes.
 *
 * Every interface here maps 1:1 to a Firestore document shape
 * that the UI screens already display or write.
 */

import { Timestamp } from "firebase/firestore";

// ── User ────────────────────────────────────────────
// Derived from: AuthContext (role, userName), ProfileScreen (email, phone, dob, avatarUrl)
export type UserRole = "patient" | "doctor";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string; // "Cody Li" | "Dr. Sarah Nguyen"
  role: UserRole;
  phone?: string; // ProfileScreen: "+1 (555) 123-4567"
  dateOfBirth?: string; // ProfileScreen: "Sept 12, 1994"
  avatarUrl?: string; // Firebase Storage path
  specialty?: string; // Doctor only: "Orthopedic Physiotherapist"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Treatment Plan (Patient) ────────────────────────
// Derived from: HomeScreen (protocol card), ProgressScreen (week/phase)
export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  condition: string; // "ACL Recovery", "Rotator Cuff"
  currentPhase: number; // 1, 2, 3
  currentWeek: number; // 6
  totalWeeks: number;
  status: "on-track" | "ahead" | "at-risk";
  progress: number; // 0-100 percentage
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Exercise (Template) ─────────────────────────────
// Derived from: WorkoutScreen mockExercises, DoctorAssignments templates
export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface Exercise {
  id: string;
  name: string; // "Squat", "Post-Op Knee Flexion"
  sets: number;
  reps: number;
  duration: string; // "5 mins", "10 mins"
  icon: string; // Ionicons name: "barbell-outline"
  color: string; // hex color for UI
  description?: string;
  category?: string; // "Upper Body", "Lower Body", "Core"
  difficulty?: ExerciseDifficulty;
  restBetweenSets?: number; // seconds: 30, 60, 90, 120
  notes?: string; // doctor's notes for this exercise
}

// ── Assignment (Doctor → Patient) ───────────────────
// Derived from: DoctorAssignmentsScreen (templates, assigned tab)
export interface Assignment {
  id: string;
  doctorId: string;
  patientId: string;
  templateName: string; // "ACL Recovery - Phase 2"
  exercises: Exercise[];
  totalDuration: string; // "45 min"
  status: "active" | "completed" | "paused";
  assignedAt: Timestamp;
  scheduledDate?: Timestamp;
  completedAt?: Timestamp;
}

// ── Workout Records (Spec Compliant Details) ────────
export interface SetRecord {
  setNumber: number;
  repsCompleted: number | null; // null if time-based (plank, hold, etc.)
  durationSec: number | null;   // null if rep-based
  weightKg: number | null;      // null if bodyweight
  accuracy: number;             // % accuracy (0-100)
  notes: string | null;
}

export interface ExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string[];
  sets: SetRecord[];
  accuracy: number;             
  completedAt: string;        
  videoLocalPath?: string | null;
  videoUrl?: string | null;
  thumbnailPath?: string | null;
  thumbnailUrl?: string | null;
}

// ── Session (Single workout session) ────────────────
// Derived from: TrainingScreen (reps, formAccuracy, elapsed), PatientDetailScreen (session history)
export interface Session {
  id: string;
  patientId: string;
  assignmentId: string;
  reps: number;                 // total reps completed in session
  accuracy: number;             // avg accuracy (0-100)
  duration: number;             // total seconds (excluding paused time)
  caloriesBurned?: number;      // MET based calorie formula
  completionRate?: number;      // 0.0 - 1.0
  perceivedEffort?: "easy" | "normal" | "hard" | null;
  exercises?: ExerciseRecord[]; // detailed exercises list
  date: Timestamp;
  doctorFeedback?: string | null; // Doctor's note for this session
  feedbackUpdatedAt?: Timestamp;

  // Backward compatibility fields for legacy UI:
  exercisesCompleted?: number;
  completedExercises?: number;
  accuracyScore?: number;
  durationSeconds?: number;
  totalDuration?: string;
  painLevel?: number;
  averagePain?: number;
  videoUrl?: string;
  exerciseList?: string[];
  formBreakdown?: Record<string, number>;
  completedExercisesData?: Array<{
    name: string;
    accuracy: number;
    reps: number;
    sets: number;
    durationSeconds: number;
    icon?: string;
    color?: string;
  }>;
}

// ── Incomplete Session (Active Workout State) ───────
export interface IncompleteSession {
  id: string; // Same as assignmentId or document auto-ID
  patientId: string;
  assignmentId: string;
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedExercises?: ExerciseRecord[];
  elapsedSeconds: number;
  startedAt?: Timestamp;        // local video path if recording mid-workout
  lastUpdated: Timestamp;
  videoPath?: string | null;    // local video path if recording mid-workout

  // Backward compatibility fields:
  exercisesCompleted?: number;
  completedExercisesData?: Array<{
    exerciseId: string;
    accuracy: number;
    reps: number;
    sets: number;
    durationSeconds: number;
  }>;
}

// ── Progress Snapshot ───────────────────────────────
// Derived from: HomeScreen (movementScore, timeActive, sessions), ProgressScreen (ROM, strength)
export interface ProgressSnapshot {
  id: string;
  patientId: string;
  movementScore: number;        // e.g. 88
  timeActive?: number;          // total active minutes accumulated
  weeklyConsistency: number;    // % weeks completed
  rom?: number;                 // range of motion value
  strength?: number;            // muscle strength percentage
  date: Timestamp;

  // Backward compatibility fields:
  timeActiveMinutes?: number;
  dailyGoalPercent?: number;
  sessionsCompleted?: number;
  sessionsTarget?: number;
  romFlexion?: number;
  romExtension?: number;
  quadricepsStrength?: number;
  hamstringStability?: number;
  aiInsight?: string;
}



// ── Exercise Template (Doctor's Library) ────────────
export interface ExerciseTemplate {
  id: string;
  doctorId: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  totalDuration: string;
  patientCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ── Feedback (Exercise feedback) ────────────────────
// Derived from: SessionScreen (difficulty, notes, exercise name)
export interface ExerciseFeedback {
  id: string;
  patientId: string;
  sessionId: string;
  exerciseName: string; // "Knee Extension"
  difficulty: string; // "Easy", "Medium", "Hard"
  painLevel: number;
  notes: string;
  tags?: string[]; // ["Pain: 5/10", "Difficulty: Medium"]
  createdAt: Timestamp;
}

// ── Schedule (Doctor) ───────────────────────────────
// Derived from: DoctorDashboardScreen (today's schedule items)
export interface ScheduleItem {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  time: string; // "09:00"
  type: string; // "Virtual Session", "Progress Review"
  status: "upcoming" | "completed" | "cancelled";
  date: Timestamp;
}

// ── Notification ────────────────────────────────────
// Two event-driven notification types:
//   session_completed  → sent to doctor when patient finishes a session
//   session_assigned   → sent to patient when doctor assigns a workout
export type NotificationType = "session_completed" | "session_assigned";

export interface Notification {
  id: string;
  userId: string;        // recipient uid
  title: string;
  body: string;
  read: boolean;
  type: NotificationType;
  data?: {
    sessionId?: string;
    assignmentId?: string;
    patientId?: string;
    patientName?: string;
    templateName?: string;
  };
  createdAt: Timestamp;
}

// ── Library Item ────────────────────────────────────
// Derived from: LibraryScreen (guides, videos, articles)
export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  category: "Videos" | "PDFs" | "Articles";
  tag: string; // "Knee Health", "Instructional Video"
  tagColor: string;
  imageUrl?: string; // Firebase Storage
  duration?: string; // "12 min" for videos
  createdAt: Timestamp;
}

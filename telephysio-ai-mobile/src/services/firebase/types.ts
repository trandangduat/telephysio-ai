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
  completedAt?: Timestamp;
  scheduledTimeSlot?: string; // e.g., "Morning (08:00 - 09:00)"
}

// ── Session (Single workout session) ────────────────
// Derived from: TrainingScreen (reps, formAccuracy, elapsed), PatientDetailScreen (session history)
export interface Session {
  id: string;
  patientId: string;
  assignmentId: string;
  exercisesCompleted: number;
  completedExercises?: number; // Alias for UI compatibility
  accuracy: number; // 0-100, from formAccuracy
  accuracyScore?: number; // Alias for UI compatibility
  duration: string; // "42 min"
  totalDuration?: string; // Alias for UI compatibility
  durationSeconds: number; // elapsed in TrainingScreen
  painLevel: number; // 0-10
  averagePain?: number; // Alias for UI compatibility
  date: Timestamp;
  reps: number;
  sets: number;
  // NEW: Detail view support
  videoUrl?: string; // Link to recorded session video in Storage
  doctorFeedback?: string; // Doctor's note for this session
  doctorName?: string; // Name of the doctor who reviewed
  reviewedAt?: Timestamp; // When the doctor reviewed it
  exerciseList?: string[]; // Names of exercises performed
  formBreakdown?: Record<string, number>; // Per-joint/angle accuracy (e.g. {"Knee Angle": 85})
  completedExercisesData?: Array<{
    name: string;
    accuracy: number;
    reps: number;
    sets: number;
    durationSeconds: number;
    icon?: string;
    color?: string;
  }>;
  feedbackUpdatedAt?: Timestamp;
}

// ── Incomplete Session (Active Workout State) ───────
export interface IncompleteSession {
  id: string; // Same as assignmentId
  patientId: string;
  assignmentId: string;
  currentExerciseIndex: number;
  exercisesCompleted: number;
  completedExercisesData: Array<{
    exerciseId: string;
    accuracy: number;
    reps: number;
    sets: number;
    durationSeconds: number;
  }>;
  lastUpdated: Timestamp;
}

// ── Progress Snapshot ───────────────────────────────
// Derived from: HomeScreen (movementScore, timeActive, sessions), ProgressScreen (ROM, strength)
export interface ProgressSnapshot {
  id: string;
  patientId: string;
  movementScore: number; // HomeScreen: 88 /100
  timeActiveMinutes: number; // HomeScreen: 45 min
  dailyGoalPercent: number; // HomeScreen: 75%
  sessionsCompleted: number; // HomeScreen: 2 /3
  sessionsTarget: number; // 3
  // ProgressScreen data
  weeklyConsistency: number; // 85%
  romFlexion: number; // degrees
  romExtension: number; // degrees
  quadricepsStrength: number; // percent
  hamstringStability: number; // percent
  aiInsight?: string; // ProgressScreen insight text
  date: Timestamp;
}

// ── Chat Message ────────────────────────────────────
// Derived from: DoctorChatScreen chatData (type, sender, text, tags, time)
export type MessageType = "text" | "feedback" | "patient_feedback";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "user" | "doctor";
  senderName: string; // "You" | "Dr. Marcus Sterling"
  senderTitle?: string; // "Lateral Lunges • Session Feedback" | "Lead Physiotherapist"
  type: MessageType;
  text: string;
  tags?: string[]; // ["12% Mobility Gain", "Pain: 5/10"]
  attachmentUrl?: string; // Firebase Storage
  createdAt: Timestamp;
}

// ── Conversation ────────────────────────────────────
// Derived from: DoctorSessionScreen (conversation list with unread, lastMessage)
export interface Conversation {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadByDoctor: number;
  unreadByPatient: number;
  hasFeedback: boolean;
  feedbackSummary?: string; // "Pain level: 3/10 | Improved ROM"
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
// Derived from: Notification bell icon across all screens
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: "alert" | "reminder" | "feedback" | "system";
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

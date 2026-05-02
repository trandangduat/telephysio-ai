// Firestore collection and document types for TelePhysioAI

export type BodyPart = 'shoulder' | 'knee' | 'back' | 'arm' | 'leg' | 'hip' | 'ankle';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SessionStatus = 'completed' | 'incomplete' | 'skipped';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  bodyPart: BodyPart;
  targetReps: number;
  sets: number;
  difficulty: Difficulty;
  durationSeconds?: number; // for timed exercises
  videoUrl?: string;
  instructions?: string[];
  tags?: string[];
}

export interface Assignment {
  exerciseId: string;
  exerciseName: string;
  assignedAt: Date;
  assignedBy: string; // doctorId
  status: 'active' | 'paused';
  targetReps: number;
  sets: number;
}

export interface Session {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  completedReps: number;
  targetReps: number;
  completedSets: number;
  targetSets: number;
  score: number; // 0-100
  duration: number; // seconds
  status: SessionStatus;
  notes?: string;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  sessionId?: string;
  message: string;
  painLevel?: number; // 1-10
  category?: 'post_session' | 'general' | 'doctor_note';
  reply?: string;
  replyAt?: Date;
  createdAt: Date;
}

export interface PatientSummary {
  uid: string;
  name: string;
  email: string;
  lastSession?: Date;
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
}

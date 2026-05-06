/**
 * progressService — Sessions, progress snapshots, and AI insights.
 *
 * Maps to:
 *   - HomeScreen (movementScore, timeActive, sessions count)
 *   - ProgressScreen (weeklyConsistency, ROM, strength, milestones)
 *   - TrainingScreen (session recording: reps, accuracy, elapsed)
 *   - PatientDetailScreen (session history, quick stats)
 *   - DoctorPatientsScreen (progress, sessions, accuracy per patient)
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "./config";
import type { Session, ProgressSnapshot, ExerciseFeedback } from "./types";

// ═══════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════

// ── Record Session ──────────────────────────────────
// Called after TrainingScreen completes (skip-forward or finish)
export async function recordSession(
  data: Omit<Session, "id" | "date">,
): Promise<string> {
  const ref = await addDoc(collection(db, "sessions"), {
    ...data,
    date: serverTimestamp(),
  });
  return ref.id;
}

// ── Get Patient Sessions ────────────────────────────
// Called by PatientDetailScreen (session history table)
export async function getPatientSessions(
  patientId: string,
  maxResults: number = 10,
): Promise<Session[]> {
  const snap = await getDocs(
    query(collection(db, "sessions"), where("patientId", "==", patientId)),
  );
  const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
  return sessions
    .sort((a, b) => {
      const aTime = (a.date as any)?.toMillis?.() || 0;
      const bTime = (b.date as any)?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, maxResults);
}

// ── Get Session Count This Week ─────────────────────
// Called by HomeScreen (SESSIONS card: "2 /3 this week")
export async function getWeeklySessionCount(
  patientId: string,
): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const snap = await getDocs(
    query(
      collection(db, "sessions"),
      where("patientId", "==", patientId),
      where("date", ">=", Timestamp.fromDate(startOfWeek)),
    ),
  );
  return snap.size;
}

// ── Submit Doctor Feedback for Session ──────────────
export async function submitDoctorFeedback(
  sessionId: string,
  feedback: string,
): Promise<void> {
  console.log('[submitDoctorFeedback] Updating session:', sessionId, 'with feedback:', feedback);
  if (!sessionId) {
    throw new Error('Session ID is required to submit feedback');
  }
  await updateDoc(doc(db, "sessions", sessionId), {
    doctorFeedback: feedback,
    feedbackUpdatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════
// PROGRESS SNAPSHOTS
// ═══════════════════════════════════════════════════

// ── Get Latest Progress ─────────────────────────────
// Called by HomeScreen (movementScore, timeActive), ProgressScreen (ROM, strength)
export async function getLatestProgress(
  patientId: string,
): Promise<ProgressSnapshot | null> {
  const snap = await getDocs(
    query(
      collection(db, "progress_snapshots"),
      where("patientId", "==", patientId),
    ),
  );
  if (snap.empty) return null;
  const snapshots = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ProgressSnapshot,
  );
  snapshots.sort((a, b) => {
    const aTime = (a.date as any)?.toMillis?.() || 0;
    const bTime = (b.date as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return snapshots[0] || null;
}

// ── Save Progress Snapshot ──────────────────────────
// Called after AI analysis processes a completed session
export async function saveProgressSnapshot(
  data: Omit<ProgressSnapshot, "id" | "date">,
): Promise<string> {
  const ref = await addDoc(collection(db, "progress_snapshots"), {
    ...data,
    date: serverTimestamp(),
  });
  return ref.id;
}

// ── Get Progress History ────────────────────────────
// Called by ProgressScreen chart (ROM over weeks)
export async function getProgressHistory(
  patientId: string,
  maxResults: number = 12,
): Promise<ProgressSnapshot[]> {
  const snap = await getDocs(
    query(
      collection(db, "progress_snapshots"),
      where("patientId", "==", patientId),
    ),
  );
  const snapshots = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ProgressSnapshot,
  );
  return snapshots
    .sort((a, b) => {
      const aTime = (a.date as any)?.toMillis?.() || 0;
      const bTime = (b.date as any)?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, maxResults);
}

// ═══════════════════════════════════════════════════
// EXERCISE FEEDBACK
// ═══════════════════════════════════════════════════

// ── Submit Feedback ─────────────────────────────────
// Called by SessionScreen "Give Feedback" → modal submit
export async function submitFeedback(
  data: Omit<ExerciseFeedback, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "exercise_feedback"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Get Feedback for Patient ────────────────────────
// Called by SessionScreen (exercise feedback list)
export async function getPatientFeedback(
  patientId: string,
  maxResults: number = 20,
): Promise<ExerciseFeedback[]> {
  const snap = await getDocs(
    query(
      collection(db, "exercise_feedback"),
      where("patientId", "==", patientId),
    ),
  );
  const feedbacks = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ExerciseFeedback,
  );
  return feedbacks
    .sort((a, b) => {
      const aTime = (a.createdAt as any)?.toMillis?.() || 0;
      const bTime = (b.createdAt as any)?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, maxResults);
}

// ── Get Avg Stats for Doctor Dashboard ──────────────
// Called by DoctorDashboardScreen (Avg Accuracy stat card)
export async function getAverageAccuracy(doctorId: string): Promise<number> {
  // Get all patient IDs for this doctor
  const plansSnap = await getDocs(
    query(collection(db, "treatment_plans"), where("doctorId", "==", doctorId)),
  );
  const patientIds = [
    ...new Set(plansSnap.docs.map((d) => d.data().patientId)),
  ];

  if (patientIds.length === 0) return 0;

  let totalAccuracy = 0;
  let count = 0;

  for (const pid of patientIds) {
    const sessSnap = await getDocs(
      query(collection(db, "sessions"), where("patientId", "==", pid)),
    );
    const sessions = sessSnap.docs.map((d) => d.data() as Session);
    sessions.sort((a, b) => {
      const aTime = (a.date as any)?.toMillis?.() || 0;
      const bTime = (b.date as any)?.toMillis?.() || 0;
      return bTime - aTime;
    });

    sessions.slice(0, 5).forEach((d) => {
      totalAccuracy += d.accuracy;
      count++;
    });
  }

  return count > 0 ? Math.round(totalAccuracy / count) : 0;
}

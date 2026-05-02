import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase/config';
import {
  Exercise,
  Assignment,
  Session,
  Feedback,
  PatientSummary,
} from '../types';
import { AppUser } from './auth';

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function getAllExercises(): Promise<Exercise[]> {
  const snap = await getDocs(collection(db, 'exercises'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, 'exercises', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Exercise;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function getPatientAssignments(patientId: string): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'assignments', patientId, 'exercises'),
      where('status', '==', 'active')
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      assignedAt: (data.assignedAt as Timestamp).toDate(),
    } as Assignment;
  });
}

export async function assignExercise(
  patientId: string,
  exercise: Exercise,
  doctorId: string
): Promise<void> {
  const assignment: Omit<Assignment, 'assignedAt'> & { assignedAt: any } = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    assignedAt: serverTimestamp(),
    assignedBy: doctorId,
    status: 'active',
    targetReps: exercise.targetReps,
    sets: exercise.sets,
  };
  await setDoc(
    doc(db, 'assignments', patientId, 'exercises', exercise.id),
    assignment
  );
}

export async function removeAssignment(
  patientId: string,
  exerciseId: string
): Promise<void> {
  await updateDoc(
    doc(db, 'assignments', patientId, 'exercises', exerciseId),
    { status: 'paused' }
  );
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function saveSession(
  session: Omit<Session, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...session,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPatientSessions(
  patientId: string,
  limitCount = 20
): Promise<Session[]> {
  const snap = await getDocs(
    query(
      collection(db, 'sessions'),
      where('userId', '==', patientId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Session;
  });
}

export async function getRecentSessions(
  patientId: string,
  days = 7
): Promise<Session[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const snap = await getDocs(
    query(
      collection(db, 'sessions'),
      where('userId', '==', patientId),
      where('createdAt', '>=', Timestamp.fromDate(cutoff)),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Session;
  });
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function sendFeedback(
  feedback: Omit<Feedback, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'feedback'), {
    ...feedback,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getFeedbackForUser(userId: string): Promise<Feedback[]> {
  const snap = await getDocs(
    query(
      collection(db, 'feedback'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      replyAt: data.replyAt ? (data.replyAt as Timestamp).toDate() : undefined,
    } as Feedback;
  });
}

export async function getFeedbackFromUser(userId: string): Promise<Feedback[]> {
  const snap = await getDocs(
    query(
      collection(db, 'feedback'),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      replyAt: data.replyAt ? (data.replyAt as Timestamp).toDate() : undefined,
    } as Feedback;
  });
}

export async function replyToFeedback(
  feedbackId: string,
  reply: string
): Promise<void> {
  await updateDoc(doc(db, 'feedback', feedbackId), {
    reply,
    replyAt: serverTimestamp(),
  });
}

// ─── Doctor – Patient Management ──────────────────────────────────────────────

export async function getDoctorPatients(doctorId: string): Promise<AppUser[]> {
  const snap = await getDocs(
    query(
      collection(db, 'users'),
      where('role', '==', 'patient'),
      where('assignedDoctorId', '==', doctorId)
    )
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function getAllPatients(): Promise<AppUser[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'patient'))
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function assignPatientToDoctor(
  patientId: string,
  doctorId: string
): Promise<void> {
  await updateDoc(doc(db, 'users', patientId), { assignedDoctorId: doctorId });
}

export async function getPatientStats(patientId: string): Promise<{
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
  lastSession?: Date;
}> {
  const sessions = await getPatientSessions(patientId);
  if (sessions.length === 0) {
    return { totalSessions: 0, avgScore: 0, currentStreak: 0 };
  }

  const totalSessions = sessions.length;
  const avgScore = Math.round(
    sessions.reduce((acc, s) => acc + s.score, 0) / totalSessions
  );
  const lastSession = sessions[0].createdAt;

  // Calculate streak (consecutive days with sessions)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    if (sessionDays.has(day.getTime())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { totalSessions, avgScore, currentStreak: streak, lastSession };
}

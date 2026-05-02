/**
 * assignmentService — Exercise assignments & treatment plans.
 *
 * Maps to:
 *   - WorkoutScreen (mockExercises list → assignment.exercises)
 *   - HomeScreen (CURRENT PROTOCOL card → treatmentPlan)
 *   - DoctorAssignmentsScreen (templates, assign to patient)
 *   - DoctorPatientsScreen (condition, week, phase, progress, status)
 */

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';

import { db } from './config';
import type { Assignment, Exercise, TreatmentPlan, ExerciseTemplate } from './types';

// ═══════════════════════════════════════════════════
// TREATMENT PLANS
// ═══════════════════════════════════════════════════

// ── Get Active Plan for Patient ─────────────────────
// Called by HomeScreen (protocol card), ProgressScreen (week/phase header)
export async function getActiveTreatmentPlan(patientId: string): Promise<TreatmentPlan | null> {
  const snap = await getDocs(
    query(
      collection(db, 'treatmentPlans'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as TreatmentPlan;
}

// ── Get All Plans for Doctor ────────────────────────
// Called by DoctorPatientsScreen (patient cards with condition/week/phase/status)
export async function getDoctorTreatmentPlans(doctorId: string): Promise<TreatmentPlan[]> {
  const snap = await getDocs(
    query(
      collection(db, 'treatmentPlans'),
      where('doctorId', '==', doctorId),
      orderBy('updatedAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TreatmentPlan));
}

// ── Create Treatment Plan ───────────────────────────
// Called by Doctor when assigning a new program to patient
export async function createTreatmentPlan(
  data: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'treatmentPlans'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update Treatment Plan ───────────────────────────
// Called when progress changes, phase advances, or status updates
export async function updateTreatmentPlan(
  planId: string,
  data: Partial<Pick<TreatmentPlan, 'currentPhase' | 'currentWeek' | 'status' | 'progress'>>
): Promise<void> {
  await updateDoc(doc(db, 'treatmentPlans', planId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════
// ASSIGNMENTS (Exercise protocols)
// ═══════════════════════════════════════════════════

// ── Get Assignments for Patient ─────────────────────
// Called by WorkoutScreen (exercise list for today's routine)
export async function getPatientAssignments(
  patientId: string,
  status: 'active' | 'completed' = 'active'
): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('patientId', '==', patientId),
      where('status', '==', status),
      orderBy('assignedAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
}

// ── Get Assignments by Doctor ───────────────────────
// Called by DoctorAssignmentsScreen (Assigned tab)
export async function getDoctorAssignments(doctorId: string): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('doctorId', '==', doctorId),
      orderBy('assignedAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
}

// ── Create Assignment ───────────────────────────────
// Called by DoctorAssignmentsScreen "Assign" button
export async function createAssignment(
  data: Omit<Assignment, 'id' | 'assignedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'assignments'), {
    ...data,
    assignedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Complete Assignment ─────────────────────────────
export async function completeAssignment(assignmentId: string): Promise<void> {
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════
// EXERCISE TEMPLATES (Doctor's library)
// ═══════════════════════════════════════════════════

// ── Get Templates ───────────────────────────────────
// Called by DoctorAssignmentsScreen (Templates tab)
export async function getExerciseTemplates(doctorId: string): Promise<ExerciseTemplate[]> {
  const snap = await getDocs(
    query(
      collection(db, 'exerciseTemplates'),
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExerciseTemplate));
}

// ── Create Template ─────────────────────────────────
export async function createExerciseTemplate(data: {
  doctorId: string;
  name: string;
  exercises: Exercise[];
  totalDuration: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'exerciseTemplates'), {
    ...data,
    patientCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

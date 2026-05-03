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
      collection(db, 'treatment_plans'),
      where('patientId', '==', patientId)
    )
  );
  if (snap.empty) return null;
  const plans = snap.docs.map(d => ({ id: d.id, ...d.data() } as TreatmentPlan));
  plans.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis?.() || 0;
    const bTime = (b.createdAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return plans[0];
}

// ── Get All Plans for Doctor ────────────────────────
// Called by DoctorPatientsScreen (patient cards with condition/week/phase/status)
export async function getDoctorTreatmentPlans(doctorId: string): Promise<TreatmentPlan[]> {
  console.log(`[Service] getDoctorTreatmentPlans called with doctorId: ${doctorId}`);
  const snap = await getDocs(
    query(
      collection(db, 'treatment_plans'),
      where('doctorId', '==', doctorId)
    )
  );
  console.log(`[Service] getDoctorTreatmentPlans found ${snap.size} documents`);
  const plans = snap.docs.map(d => ({ id: d.id, ...d.data() } as TreatmentPlan));
  return plans.sort((a, b) => {
    const aTime = (a.updatedAt as any)?.toMillis?.() || 0;
    const bTime = (b.updatedAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

// ── Create Treatment Plan ───────────────────────────
// Called by Doctor when assigning a new program to patient
export async function createTreatmentPlan(
  data: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'treatment_plans'), {
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
  await updateDoc(doc(db, 'treatment_plans', planId), {
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
      where('status', '==', status)
    )
  );
  const assignments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
  return assignments.sort((a, b) => {
    const aTime = (a.assignedAt as any)?.toMillis?.() || 0;
    const bTime = (b.assignedAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

// ── Get Assignments by Doctor ───────────────────────
// Called by DoctorAssignmentsScreen (Assigned tab)
export async function getDoctorAssignments(doctorId: string): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('doctorId', '==', doctorId)
    )
  );
  const assignments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
  return assignments.sort((a, b) => {
    const aTime = (a.assignedAt as any)?.toMillis?.() || 0;
    const bTime = (b.assignedAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
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
      collection(db, 'exercise_templates'),
      where('doctorId', '==', doctorId)
    )
  );
  const templates = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExerciseTemplate));
  return templates.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis?.() || 0;
    const bTime = (b.createdAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

// ── Create Template ─────────────────────────────────
export async function createExerciseTemplate(data: {
  doctorId: string;
  name: string;
  exercises: Exercise[];
  totalDuration: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'exercise_templates'), {
    ...data,
    patientCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

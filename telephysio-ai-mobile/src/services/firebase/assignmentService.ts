/**
 * assignmentService — Dịch vụ quản lý Bài tập được giao (Assignments) và Kế hoạch điều trị (Treatment Plans).
 *
 * Maps to:
 *   - WorkoutScreen (mockExercises list → assignment.exercises)
 *   - HomeScreen (CURRENT PROTOCOL card → treatmentPlan)
 *   - DoctorAssignmentsScreen (templates, assign to patient)
 *   - DoctorDashboardScreen (condition, week, phase, progress, status)
 */

import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';

import { db } from './config';
import type { Assignment, Exercise, TreatmentPlan, ExerciseTemplate } from './types';
import { createNotification } from './notificationService';

// ═══════════════════════════════════════════════════
// TREATMENT PLANS
// ═══════════════════════════════════════════════════

// ── Get Active Plan for Patient ─────────────────────
// Called by HomeScreen (protocol card), ProgressScreen (week/phase header)
/**
 * Lấy Kế hoạch điều trị (Treatment Plan) đang hoạt động của một bệnh nhân.
 * Trả về kế hoạch được tạo gần đây nhất.
 * 
 * @param patientId ID của bệnh nhân
 * @return Promise<TreatmentPlan | null> Kế hoạch điều trị hoặc null
 */
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
// Called by DoctorDashboardScreen (patient cards with condition/week/phase/status)
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
/**
 * Tạo một Kế hoạch điều trị mới cho bệnh nhân.
 * 
 * @param data Dữ liệu của kế hoạch điều trị mới
 * @return Promise<string> ID của kế hoạch vừa tạo
 */
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
/**
 * Lấy danh sách các Bài tập được giao (Assignments) của bệnh nhân.
 * 
 * @param patientId ID của bệnh nhân
 * @param status Trạng thái bài tập ('active' hoặc 'completed')
 * @return Promise<Assignment[]> Danh sách bài tập
 */
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
/**
 * Lấy danh sách toàn bộ Bài tập (Assignments) đã được Bác sĩ giao.
 * 
 * @param doctorId ID của bác sĩ
 * @return Promise<Assignment[]> Danh sách bài tập
 */
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
/**
 * Bác sĩ tạo và giao Bài tập mới cho bệnh nhân.
 * Sẽ gửi thông báo (Notification) đến bệnh nhân nếu có thể.
 * 
 * @param data Thông tin bài tập được giao
 * @return Promise<string> ID của bài tập vừa tạo
 */
export async function createAssignment(
    data: Omit<Assignment, 'id' | 'assignedAt'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'assignments'), {
        ...data,
        assignedAt: serverTimestamp(),
    });

    // Best-effort: notify the patient about the new assignment
    try {
    // Fetch doctor name
        const doctorSnap = await getDoc(doc(db, 'users', data.doctorId));
        const doctorName = doctorSnap.exists()
            ? doctorSnap.data().displayName || 'Your doctor'
            : 'Your doctor';
        const templateName = data.templateName || 'a session';

        await createNotification({
            userId: data.patientId,
            title: 'New Assignment',
            body: `Dr. ${doctorName} assigned you "${templateName}"`,
            type: 'session_assigned',
            data: {
                assignmentId: ref.id,
                templateName,
            },
        });
    } catch (err) {
        console.warn('Failed to send session-assigned notification:', err);
    }

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
/**
 * Lấy danh sách các Mẫu bài tập (Templates) được lưu của Bác sĩ.
 * 
 * @param doctorId ID của bác sĩ
 * @return Promise<ExerciseTemplate[]> Danh sách mẫu bài tập
 */
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
/**
 * Tạo một Mẫu bài tập (Template) mới vào thư viện của Bác sĩ.
 * 
 * @param data Thông tin mẫu bài tập mới
 * @return Promise<string> ID của mẫu bài tập vừa tạo
 */
export async function createExerciseTemplate(data: {
    doctorId: string;
    name: string;
    description?: string;
    exercises: Exercise[];
    totalDuration: string;
}): Promise<string> {
    const ref = await addDoc(collection(db, 'exercise_templates'), {
        ...data,
        patientCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

// ── Update Template ─────────────────────────────────
export async function updateExerciseTemplate(
    templateId: string,
    data: Partial<Pick<ExerciseTemplate, 'name' | 'description' | 'exercises' | 'totalDuration'>>
): Promise<void> {
    await updateDoc(doc(db, 'exercise_templates', templateId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// ── Delete Template ─────────────────────────────────
export async function deleteExerciseTemplate(templateId: string): Promise<void> {
    await deleteDoc(doc(db, 'exercise_templates', templateId));
}

// ── Get Global Exercises (for picker) ───────────────
/**
 * Lấy toàn bộ danh sách bài tập chung (Global Exercises) từ Firestore.
 * (Thường dùng cho tính năng tìm kiếm bài tập khi bác sĩ tạo mẫu)
 * 
 * @return Promise<Exercise[]> Danh sách bài tập chung
 */
export async function getGlobalExercises(): Promise<Exercise[]> {
    const snap = await getDocs(collection(db, 'exercises'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
}

/**
 * @file progressService.ts
 * @description Dịch vụ quản lý quá trình tập luyện, ảnh chụp dữ liệu tiến độ (snapshots) và nhận xét của AI.
 *
 * Maps to:
 *   - HomeScreen (movementScore, timeActive, sessions count)
 *   - ProgressScreen (weeklyConsistency, ROM, strength, milestones)
 *   - TrainingScreen (session recording: reps, accuracy, elapsed)
 *   - PatientDetailScreen (session history, quick stats)
 *   - DoctorDashboardScreen (progress, sessions, accuracy per patient)
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
import type { Session, ProgressSnapshot, ExerciseFeedback, IncompleteSession } from "./types";
import { createNotification } from "./notificationService";

// ═══════════════════════════════════════════════════
// CÁC BUỔI TẬP DANG DỞ (Trạng thái tập luyện đang hoạt động)
// ═══════════════════════════════════════════════════

/**
 * Lấy buổi tập đang thực hiện dang dở của bệnh nhân.
 * 
 * @param {string} patientId ID bệnh nhân
 * @param {string} assignmentId ID bài tập được giao
 * @return {Promise<IncompleteSession | null>} Buổi tập dang dở hoặc null
 */
export async function getIncompleteSession(
    patientId: string,
    assignmentId: string,
): Promise<IncompleteSession | null> {
    const snap = await getDocs(
        query(
            collection(db, "incomplete_sessions"),
            where("patientId", "==", patientId),
            where("assignmentId", "==", assignmentId),
        ),
    );
    if (snap.empty) return null;
    // Chỉ nên có một buổi tập dang dở cho mỗi bài tập được giao của một bệnh nhân
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as IncompleteSession;
}

/**
 * Lưu thông tin một buổi tập đang dang dở.
 * 
 * @param {Omit<IncompleteSession, "id" | "lastUpdated">} data Dữ liệu buổi tập
 * @return {Promise<string>} ID của buổi tập dang dở
 */
export async function saveIncompleteSession(
    data: Omit<IncompleteSession, "id" | "lastUpdated">,
): Promise<string> {
    const ref = await addDoc(collection(db, "incomplete_sessions"), {
        ...data,
        lastUpdated: serverTimestamp(),
    });
    return ref.id;
}

/**
 * Cập nhật thông tin của buổi tập dang dở.
 * 
 * @param {string} sessionId ID buổi tập
 * @param {Partial<Omit<IncompleteSession, "id" | "lastUpdated">>} data Dữ liệu cập nhật
 * @return {Promise<void>}
 */
export async function updateIncompleteSession(
    sessionId: string,
    data: Partial<Omit<IncompleteSession, "id" | "lastUpdated">>,
): Promise<void> {
    await updateDoc(doc(db, "incomplete_sessions", sessionId), {
        ...data,
        lastUpdated: serverTimestamp(),
    });
}

import { deleteDoc } from "firebase/firestore";

/**
 * Xóa dữ liệu buổi tập dang dở.
 * 
 * @param {string} sessionId ID buổi tập dang dở cần xóa
 * @return {Promise<void>}
 */
export async function deleteIncompleteSession(sessionId: string): Promise<void> {
    await deleteDoc(doc(db, "incomplete_sessions", sessionId));
}

// ═══════════════════════════════════════════════════
// CÁC BUỔI TẬP
// ═══════════════════════════════════════════════════

// ── Lưu Buổi Tập ────────────────────────────────────
// Được gọi sau khi TrainingScreen hoàn thành (bỏ qua hoặc kết thúc)
/**
 * Lưu một buổi tập đã hoàn thành vào cơ sở dữ liệu.
 * Gửi thông báo cho bác sĩ nếu lưu thành công.
 * 
 * @param {Omit<Session, "id" | "date">} data Dữ liệu của buổi tập
 * @return {Promise<string>} ID của buổi tập đã lưu
 */
export async function recordSession(
    data: Omit<Session, "id" | "date">,
): Promise<string> {
    const ref = await addDoc(collection(db, "sessions"), {
        ...data,
        date: serverTimestamp(),
    });

    // Cố gắng hết mức: thông báo cho bác sĩ rằng bệnh nhân đã hoàn thành buổi tập này
    try {
    // Lấy bài tập để có doctorId và templateName
        const assignSnap = await getDoc(doc(db, "assignments", data.assignmentId));
        if (assignSnap.exists()) {
            const assignment = assignSnap.data();
            // Lấy tên bệnh nhân
            const patientSnap = await getDoc(doc(db, "users", data.patientId));
            const patientName = patientSnap.exists()
                ? patientSnap.data().displayName || "A patient"
                : "A patient";
            const templateName = assignment.templateName || "a session";
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });

            await createNotification({
                userId: assignment.doctorId,
                title: "Session Completed",
                body: `${patientName} finished "${templateName}" at ${timeStr}`,
                type: "session_completed",
                data: {
                    sessionId: ref.id,
                    patientId: data.patientId,
                    patientName,
                    templateName,
                },
            });
        }
    } catch (err) {
        console.warn("Failed to send session-completed notification:", err);
    }

    return ref.id;
}

// ── Lấy Buổi tập Bệnh nhân ──────────────────────────
// Được gọi bởi PatientDetailScreen (bảng lịch sử buổi tập)
/**
 * Lấy danh sách lịch sử buổi tập của bệnh nhân (sắp xếp giảm dần theo ngày).
 * 
 * @param {string} patientId ID bệnh nhân
 * @param {number} [maxResults=10] Số kết quả tối đa
 * @return {Promise<Session[]>} Mảng các buổi tập
 */
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

// ── Lấy Số Buổi tập Trong Tuần Này ──────────────────
// Được gọi bởi HomeScreen (thẻ SESSIONS: "2 /3 trong tuần này")
/**
 * Đếm số lượng buổi tập đã thực hiện trong tuần hiện tại.
 * 
 * @param {string} patientId ID bệnh nhân
 * @return {Promise<number>} Số lượng buổi tập trong tuần
 */
export async function getWeeklySessionCount(
    patientId: string,
): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Thứ Hai
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

// ── Gửi Phản hồi của Bác sĩ cho Buổi tập ────────────
/**
 * Gửi phản hồi của bác sĩ cho một buổi tập cụ thể.
 * 
 * @param {string} sessionId ID buổi tập
 * @param {string} feedback Nội dung phản hồi
 * @return {Promise<void>}
 */
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
// ẢNH CHỤP TIẾN ĐỘ
// ═══════════════════════════════════════════════════

// ── Lấy Tiến độ Mới nhất ────────────────────────────
// Được gọi bởi HomeScreen (movementScore, timeActive), ProgressScreen (ROM, strength)
/**
 * Lấy dữ liệu tiến độ mới nhất của bệnh nhân.
 * 
 * @param {string} patientId ID bệnh nhân
 * @return {Promise<ProgressSnapshot | null>} Báo cáo tiến độ hoặc null
 */
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

// ── Lưu Ảnh chụp Tiến độ ────────────────────────────
// Được gọi sau khi AI phân tích xử lý một buổi tập hoàn thành
/**
 * Lưu lại ảnh chụp (snapshot) tiến độ tập luyện của người dùng sau mỗi buổi.
 * 
 * @param {Omit<ProgressSnapshot, "id" | "date">} data Dữ liệu báo cáo tiến độ
 * @return {Promise<string>} ID của báo cáo vừa tạo
 */
export async function saveProgressSnapshot(
    data: Omit<ProgressSnapshot, "id" | "date">,
): Promise<string> {
    const ref = await addDoc(collection(db, "progress_snapshots"), {
        ...data,
        date: serverTimestamp(),
    });
    return ref.id;
}

// ── Lấy Lịch sử Tiến độ ─────────────────────────────
// Được gọi bởi biểu đồ ProgressScreen (ROM theo tuần)
/**
 * Lấy lịch sử tiến độ của bệnh nhân để vẽ biểu đồ.
 * 
 * @param {string} patientId ID bệnh nhân
 * @param {number} [maxResults=12] Số kết quả lớn nhất lấy về
 * @return {Promise<ProgressSnapshot[]>} Mảng báo cáo tiến độ
 */
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
// PHẢN HỒI BÀI TẬP
// ═══════════════════════════════════════════════════

// ── Gửi Phản hồi ────────────────────────────────────
// Được gọi bởi SessionScreen "Gửi Phản hồi" → nộp modal
/**
 * Bệnh nhân gửi phản hồi về bài tập.
 * 
 * @param {Omit<ExerciseFeedback, "id" | "createdAt">} data Dữ liệu phản hồi bài tập
 * @return {Promise<string>} ID của phản hồi
 */
export async function submitFeedback(
    data: Omit<ExerciseFeedback, "id" | "createdAt">,
): Promise<string> {
    const ref = await addDoc(collection(db, "exercise_feedback"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

// ── Lấy Phản hồi cho Bệnh nhân ──────────────────────
// Được gọi bởi SessionScreen (danh sách phản hồi bài tập)
/**
 * Lấy danh sách các phản hồi về bài tập của bệnh nhân.
 * 
 * @param {string} patientId ID bệnh nhân
 * @param {number} [maxResults=20] Số kết quả tối đa
 * @return {Promise<ExerciseFeedback[]>} Mảng danh sách phản hồi
 */
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

// ── Lấy Chỉ số Trung bình cho Bảng Bác sĩ ───────────
// Được gọi bởi DoctorDashboardScreen (thẻ Độ chính xác trung bình)
/**
 * Lấy độ chính xác trung bình (accuracy) của các bệnh nhân mà bác sĩ quản lý.
 * Thường dùng cho bảng điều khiển của bác sĩ.
 * 
 * @param {string} doctorId ID bác sĩ
 * @return {Promise<number>} Độ chính xác trung bình (0-100)
 */
export async function getAverageAccuracy(doctorId: string): Promise<number> {
    // Lấy tất cả ID bệnh nhân cho bác sĩ này
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

// ── Cập nhật Nỗ lực Buổi tập ────────────────────────
/**
 * Cập nhật mức độ cố gắng/khó khăn (perceived effort) cho một buổi tập.
 * 
 * @param {string} sessionId ID buổi tập
 * @param {"easy" | "normal" | "hard"} effort Mức độ cố gắng
 * @return {Promise<void>}
 */
export async function updateSessionEffort(
    sessionId: string,
    effort: "easy" | "normal" | "hard",
): Promise<void> {
    await updateDoc(doc(db, "sessions", sessionId), {
        perceivedEffort: effort,
    });
}

// ── Xóa Video Buổi tập ──────────────────────────────
/**
 * Xóa video của buổi tập khỏi thiết bị lưu trữ cục bộ và cập nhật lại bản ghi.
 * 
 * @param {string} sessionId ID buổi tập
 * @param {string} videoPath Đường dẫn video cục bộ
 * @param {string} thumbnailPath Đường dẫn ảnh thu nhỏ cục bộ
 * @return {Promise<void>}
 */
export async function deleteSessionVideo(
    sessionId: string,
    videoPath: string,
    thumbnailPath: string,
): Promise<void> {
    // 1. Xóa các tệp cục bộ bằng videoService của chúng tôi
    try {
        const { deleteLocalVideo } = require("./videoService");
        await deleteLocalVideo(videoPath, thumbnailPath);
    } catch (err) {
        console.warn("Failed to delete local files in service:", err);
    }

    // 2. Xóa các đường dẫn trong tài liệu Firestore
    await updateDoc(doc(db, "sessions", sessionId), {
        videoLocalPath: null,
        thumbnailPath: null,
    });
}

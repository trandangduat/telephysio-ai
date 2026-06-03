/**
 * @file notificationService.ts
 * @description Dịch vụ quản lý thông báo trong ứng dụng (In-app notifications).
 *
 * Các sự kiện chính:
 *   - session_completed → Bác sĩ nhận được thông báo khi bệnh nhân hoàn thành buổi tập.
 *   - session_assigned  → Bệnh nhân nhận được thông báo khi bác sĩ giao bài tập mới.
 */

import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    getDoc,
} from "firebase/firestore";

import { db } from "./config";
import type { Notification, NotificationType } from "./types";

const NOTIFICATIONS_COLLECTION = "notifications";

// ── Tạo Thông báo ───────────────────────────────────
/**
 * Tạo một thông báo mới trong cơ sở dữ liệu.
 * 
 * @param {Object} data Dữ liệu thông báo
 * @param {string} data.userId ID người dùng nhận thông báo
 * @param {string} data.title Tiêu đề thông báo
 * @param {string} data.body Nội dung thông báo
 * @param {NotificationType} data.type Loại thông báo
 * @param {Notification["data"]} [data.data] Dữ liệu đính kèm thêm
 * @return {Promise<string>} ID của thông báo vừa được tạo
 */
export async function createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Notification["data"];
}): Promise<string> {
    const ref = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

// ── Lấy Thông báo của Người dùng ────────────────────
/**
 * Lấy danh sách tất cả thông báo của một người dùng, sắp xếp từ mới nhất đến cũ nhất.
 * 
 * @param {string} userId ID của người dùng
 * @return {Promise<Notification[]>} Mảng danh sách các thông báo
 */
export async function getUserNotifications(
    userId: string,
): Promise<Notification[]> {
    const snap = await getDocs(
        query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("userId", "==", userId)
        ),
    );
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Notification)
        .sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
            return bTime - aTime;
        });
}

// ── Đánh dấu Thông báo là Đã đọc ────────────────────
/**
 * Đánh dấu một thông báo cụ thể là đã đọc.
 * 
 * @param {string} notificationId ID của thông báo cần đánh dấu
 * @return {Promise<void>}
 */
export async function markNotificationRead(
    notificationId: string,
): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
        read: true,
    });
}

// ── Đánh dấu Tất cả là Đã đọc ───────────────────────
/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc.
 * 
 * @param {string} userId ID của người dùng
 * @return {Promise<void>}
 */
export async function markAllRead(userId: string): Promise<void> {
    const snap = await getDocs(
        query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("userId", "==", userId),
            where("read", "==", false),
        ),
    );
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
        batch.update(d.ref, { read: true });
    });
    await batch.commit();
}

// ── Lấy Số lượng Chưa đọc ───────────────────────────
/**
 * Lấy số lượng thông báo chưa đọc của người dùng.
 * 
 * @param {string} userId ID của người dùng
 * @return {Promise<number>} Số lượng thông báo chưa đọc
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const snap = await getDocs(
        query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("userId", "==", userId),
            where("read", "==", false),
        ),
    );
    return snap.size;
}

// ── Lắng nghe Thời gian thực ────────────────────────
// Trả về hàm hủy đăng ký. Phát ra danh sách đầy đủ khi có thay đổi.
/**
 * Lắng nghe thay đổi của thông báo theo thời gian thực (Real-time).
 * Trả về một hàm unsubscribe để hủy lắng nghe khi không cần thiết.
 * 
 * @param {string} userId ID của người dùng
 * @param {Function} callback Hàm gọi lại nhận mảng thông báo mới nhất
 * @return {Function} Hàm unsubscribe từ Firestore
 */
export function onNotificationsChange(
    userId: string,
    callback: (notifications: Notification[]) => void,
) {
    return onSnapshot(
        query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("userId", "==", userId)
        ),
        (snap) => {
            const notifications = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Notification)
                .sort((a, b) => {
                    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
                    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
                    return bTime - aTime;
                });
            callback(notifications);
        },
        (err) => {
            console.error("Error in onNotificationsChange listener:", err);
        }
    );
}

/**
 * @file userService.ts
 * @description Dịch vụ quản lý Hồ sơ người dùng (User Profile) trên Firestore (CRUD).
 */

/**
 * userService — Dịch vụ quản lý Hồ sơ người dùng (User Profile) trên Firestore (CRUD).
 *
 * Maps to:
 *   - ProfileScreen (displayName, email, phone, dateOfBirth, avatarUrl)
 *   - DoctorDashboardScreen (userName, specialty)
 *   - DoctorDashboardScreen (patient list with name, condition, progress)
 */

import {
    doc, getDoc, setDoc, updateDoc, collection, query, where,
    getDocs, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from './config';
import type { UserProfile, UserRole } from './types';

// ── Lấy Người dùng theo UID ─────────────────────────
/**
 * Lấy thông tin hồ sơ của một người dùng bất kỳ thông qua UID.
 * 
 * @param uid ID duy nhất của người dùng
 * @return Promise<UserProfile | null> Hồ sơ người dùng hoặc null
 */
export async function getUser(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Cập nhật Hồ sơ ──────────────────────────────────
// Được gọi khi người dùng chỉnh sửa hồ sơ (nút "Chỉnh sửa" trên ProfileScreen)
/**
 * Cập nhật thông tin hồ sơ người dùng trên Firestore.
 * Thường được gọi khi người dùng nhấn lưu trong màn hình chỉnh sửa hồ sơ.
 * 
 * @param uid ID của người dùng cần cập nhật
 * @param data Các trường dữ liệu cần cập nhật (Tên, Số điện thoại, Ngày sinh, Chuyên khoa)
 * @return Promise<void>
 */
export async function updateUserProfile(
    uid: string,
    data: Partial<Pick<UserProfile, 'displayName' | 'phone' | 'dateOfBirth' | 'specialty'>>
): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// ── Tải lên Ảnh đại diện ────────────────────────────
// Được gọi khi người dùng nhấn Chỉnh sửa Ảnh đại diện trên ProfileScreen
/**
 * Tải ảnh đại diện (avatar) của người dùng lên Firebase Storage và cập nhật URL vào Firestore.
 * 
 * @param uid ID của người dùng
 * @param fileUri Đường dẫn URI của file ảnh trên thiết bị
 * @return Promise<string> URL tải xuống của ảnh đại diện mới
 */
export async function uploadAvatar(uid: string, fileUri: string): Promise<string> {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const avatarRef = ref(storage, `avatars/${uid}`);
    await uploadBytes(avatarRef, blob);
    const downloadUrl = await getDownloadURL(avatarRef);
    await updateDoc(doc(db, 'users', uid), {
        avatarUrl: downloadUrl,
        updatedAt: serverTimestamp(),
    });
    return downloadUrl;
}

// ── Lấy Tất cả Bệnh nhân (Dành cho Bác sĩ) ──────────
// Được gọi bởi DoctorDashboardScreen
/**
 * Lấy danh sách hồ sơ của tất cả các bệnh nhân đang được điều trị bởi bác sĩ.
 * 
 * @param doctorId ID của bác sĩ
 * @returns Danh sách hồ sơ các bệnh nhân
 */
export async function getPatients(doctorId: string): Promise<UserProfile[]> {
    console.log(`[Service] getPatients called with doctorId: ${doctorId}`);
    // Truy vấn người dùng có role=patient VÀ có phác đồ điều trị đang hoạt động với bác sĩ này
    // Để đơn giản, chúng ta truy vấn phác đồ điều trị trước, sau đó lấy hồ sơ người dùng
    const plansSnap = await getDocs(
        query(collection(db, 'treatment_plans'), where('doctorId', '==', doctorId))
    );
    const patientIds = [...new Set(plansSnap.docs.map(d => d.data().patientId))];

    if (patientIds.length === 0) return [];

    const profiles: UserProfile[] = [];
    // Truy vấn `in` của Firestore hỗ trợ tối đa 30 mục
    for (const id of patientIds) {
        const user = await getUser(id);
        if (user) profiles.push(user);
    }
    console.log(`[Service] getPatients found ${profiles.length} profiles`);
    return profiles;
}

// ── Lấy Bác sĩ của Bệnh nhân ────────────────────────
// Được gọi bởi nhiều màn hình khác nhau (để hiển thị tên bác sĩ/người dùng)
/**
 * Lấy thông tin hồ sơ của bác sĩ đang điều trị cho một bệnh nhân.
 * 
 * @param patientId ID của bệnh nhân
 * @return Promise<UserProfile | null> Hồ sơ của bác sĩ hoặc null
 */
export async function getPatientDoctor(patientId: string): Promise<UserProfile | null> {
    const plansSnap = await getDocs(
        query(
            collection(db, 'treatment_plans'),
            where('patientId', '==', patientId),
            orderBy('createdAt', 'desc')
        )
    );
    if (plansSnap.empty) return null;
    const doctorId = plansSnap.docs[0].data().doctorId;
    return getUser(doctorId);
}

// ── Lấy Tất cả Bệnh nhân trong DB (cho bác sĩ tìm kiếm) ──────────────────
/**
 * Lấy danh sách toàn bộ bệnh nhân có trong hệ thống.
 * (Sử dụng cho màn hình Bác sĩ tìm kiếm và giao bài tập)
 * 
 * @return Promise<UserProfile[]> Danh sách toàn bộ bệnh nhân
 */
export async function getAllPatients(): Promise<UserProfile[]> {
    const snap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'patient'))
    );
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

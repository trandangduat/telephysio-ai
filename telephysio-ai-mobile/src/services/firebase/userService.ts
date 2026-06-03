/**
 * userService — Dịch vụ quản lý Hồ sơ người dùng (User Profile) trên Firestore (CRUD).
 *
 * Nhiệm vụ chính:
 *   - Lấy, cập nhật thông tin cá nhân của người dùng.
 *   - Tải lên ảnh đại diện (avatar).
 *   - Lấy danh sách bệnh nhân cho bác sĩ và ngược lại.
 */

import {
    doc, getDoc, setDoc, updateDoc, collection, query, where,
    getDocs, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from './config';
import type { UserProfile, UserRole } from './types';

// ── Get User by UID ─────────────────────────────────
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

// ── Update Profile ──────────────────────────────────
// Called when user edits profile (ProfileScreen "Edit" button)
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

// ── Upload Avatar ───────────────────────────────────
// Called when user taps Edit Avatar on ProfileScreen
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

// ── Get All Patients (Doctor use) ───────────────────
// Called by DoctorPatientsScreen, DoctorDashboardScreen
/**
 * Lấy danh sách các bệnh nhân đang được điều trị bởi một bác sĩ cụ thể.
 * 
 * @param doctorId ID của bác sĩ
 * @return Promise<UserProfile[]> Danh sách hồ sơ các bệnh nhân
 */
export async function getPatients(doctorId: string): Promise<UserProfile[]> {
    console.log(`[Service] getPatients called with doctorId: ${doctorId}`);
    // Query users where role=patient AND they have an active treatment plan with this doctor
    // For simplicity, we query treatment plans first, then fetch user profiles
    const plansSnap = await getDocs(
        query(collection(db, 'treatment_plans'), where('doctorId', '==', doctorId))
    );
    const patientIds = [...new Set(plansSnap.docs.map(d => d.data().patientId))];

    if (patientIds.length === 0) return [];

    const profiles: UserProfile[] = [];
    // Firestore `in` query supports max 30 items
    for (const id of patientIds) {
        const user = await getUser(id);
        if (user) profiles.push(user);
    }
    console.log(`[Service] getPatients found ${profiles.length} profiles`);
    return profiles;
}

// ── Get Doctor for Patient ──────────────────────────
// Called by various screens (to display doctor/user name)
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

// ── Get All Patients in DB (for doctor's assign search) ──────────────────────
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

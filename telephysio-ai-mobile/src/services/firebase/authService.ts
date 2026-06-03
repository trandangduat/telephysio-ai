/**
 * authService — Dịch vụ Xác thực Firebase (Authentication) và Quản lý người dùng trên Firestore.
 *
 * Nhiệm vụ chính:
 *   - Đăng ký, đăng nhập, đăng xuất người dùng.
 *   - Lấy hồ sơ (profile) của người dùng từ Firestore.
 *   - Lắng nghe sự thay đổi trạng thái xác thực.
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './config';
import type { UserProfile, UserRole } from './types';

// ── Đăng ký ─────────────────────────────────────────
/**
 * Đăng ký người dùng mới bằng Email và Mật khẩu.
 * Tạo mới tài khoản trong Firebase Auth và lưu thông tin hồ sơ vào Firestore.
 * 
 * @param email Địa chỉ email của người dùng
 * @param password Mật khẩu
 * @param displayName Tên hiển thị của người dùng
 * @param role Vai trò của người dùng (Bác sĩ hoặc Bệnh nhân)
 * @return Promise<UserProfile> Thông tin hồ sơ của người dùng vừa được tạo
 */
export async function registerUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole
): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const profile: Omit<UserProfile, 'uid'> & { uid: string } = {
        uid: cred.user.uid,
        email,
        displayName,
        role,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'users', cred.user.uid), profile);
    return profile;
}

// ── Đăng nhập ───────────────────────────────────────
/**
 * Đăng nhập người dùng bằng Email và Mật khẩu.
 * Sau khi đăng nhập thành công, lấy thông tin hồ sơ từ Firestore.
 * 
 * @param email Địa chỉ email của người dùng
 * @param password Mật khẩu
 * @return Promise<UserProfile> Thông tin hồ sơ của người dùng
 */
export async function loginUser(email: string, password: string): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(cred.user.uid);
    if (!profile) throw new Error('User profile not found in Firestore');
    return profile;
}

// ── Đăng xuất ───────────────────────────────────────
/**
 * Đăng xuất người dùng hiện tại khỏi ứng dụng.
 * 
 * @return Promise<void>
 */
export async function logoutUser(): Promise<void> {
    await signOut(auth);
}

// ── Lấy Hồ sơ Người dùng Hiện tại ───────────────────
/**
 * Lấy thông tin hồ sơ người dùng từ Firestore dựa trên UID.
 * 
 * @param uid ID duy nhất của người dùng
 * @return Promise<UserProfile | null> Hồ sơ người dùng hoặc null nếu không tìm thấy
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Lắng nghe Trạng thái Xác thực ───────────────────
/**
 * Lắng nghe sự kiện thay đổi trạng thái xác thực (Đăng nhập/Đăng xuất).
 * 
 * @param callback Hàm gọi lại (callback) khi trạng thái xác thực thay đổi
 * @return Hàm hủy lắng nghe sự kiện (unsubscribe)
 */
export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

// ── Lấy Người dùng Firebase Hiện tại ────────────────
/**
 * Lấy đối tượng người dùng Firebase hiện tại đang đăng nhập.
 * 
 * @return User | null Đối tượng người dùng Firebase hoặc null
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

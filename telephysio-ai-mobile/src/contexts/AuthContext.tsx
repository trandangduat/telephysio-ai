/**
 * AuthContext — Context quản lý xác thực Firebase và phân quyền người dùng thông qua Firestore.
 *
 * Nhiệm vụ chính:
 *   - Lắng nghe trạng thái đăng nhập Firebase Auth (tự động đăng nhập khi mở lại app).
 *   - Lấy thông tin hồ sơ (profile) của người dùng từ Firestore (vai trò, tên hiển thị).
 *   - Cung cấp trạng thái đang tải (loading) trong khi kiểm tra xác thực.
 *   - Cung cấp hàm switchRole để chuyển đổi vai trò (dành cho chế độ phát triển - dev mode).
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  onAuthChange,
  getUserProfile,
  logoutUser,
  getCurrentUser,
} from "../services/firebase/authService";
import type { UserProfile } from "../services/firebase/types";

export type UserRole = "patient" | "doctor";

interface AuthContextType {
  // Auth state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Derived fields (backward-compatible with existing screens)
  role: UserRole;
  userName: string;
  uid: string | null;
  // Actions
  switchRole: (role: UserRole) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: "patient",
  userName: "",
  uid: null,
  switchRole: () => {},
  setUser: () => {},
  logout: async () => {},
});

/**
 * Hook tùy chỉnh (Custom hook) để truy cập AuthContext.
 * 
 * @return AuthContextType Dữ liệu và các hàm thao tác liên quan đến xác thực
 */
export const useAuth = () => useContext(AuthContext);

interface Props {
  children: ReactNode;
}

/**
 * Component Provider cung cấp Context xác thực cho toàn bộ ứng dụng.
 * 
 * @param props Các thuộc tính của component
 * @param props.children Các component con được bọc bên trong provider này
 * @return React.FC Component React Provider
 */
export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Derived values — backward-compatible with all existing screens
  const role = roleOverride ?? (user?.role || "patient");
  const authUser = getCurrentUser();
  const userName = user?.displayName || authUser?.displayName || "";
  const uid = user?.uid || authUser?.uid || null;
  const isAuthenticated = !!user;

  const switchRole = (newRole: UserRole) => {
    setRoleOverride(newRole);
  };

  const logout = async () => {
    try {
      // Clear state immediately for better UX
      setUser(null);
      setRoleOverride(null);
      await logoutUser();
    } catch (err) {
      console.warn("Firebase logout failed, but local state was cleared:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        role,
        userName,
        uid,
        switchRole,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

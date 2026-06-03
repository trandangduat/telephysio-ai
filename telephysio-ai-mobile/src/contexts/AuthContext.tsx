/**
 * @file AuthContext.tsx
 * @description Context quản lý xác thực Firebase và phân quyền người dùng thông qua Firestore.
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
    // Trạng thái xác thực
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // Các trường dẫn xuất (tương thích ngược với các màn hình hiện có)
    role: UserRole;
    userName: string;
    uid: string | null;
    // Hành động
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

    // Lắng nghe thay đổi trạng thái xác thực Firebase
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

    // Các giá trị dẫn xuất — tương thích ngược với tất cả các màn hình hiện có
    const role = roleOverride ?? (user?.role || "patient");
    const authUser = getCurrentUser();
    const userName = user?.displayName || authUser?.displayName || "";
    const uid = user?.uid || authUser?.uid || null;
    const isAuthenticated = !!user;

    /**
     * Chuyển đổi vai trò của người dùng (dành cho mục đích phát triển và thử nghiệm).
     * @param newRole Vai trò mới cần chuyển sang.
     * @returns Không trả về giá trị.
     */
    const switchRole = (newRole: UserRole) => {
        setRoleOverride(newRole);
    };

    /**
     * Đăng xuất người dùng khỏi hệ thống.
     * @returns Promise hoàn thành khi quá trình đăng xuất kết thúc.
     */
    const logout = async () => {
        try {
            // Xóa trạng thái ngay lập tức để trải nghiệm người dùng tốt hơn
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

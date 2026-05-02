/**
 * AuthContext — Firebase Auth + Firestore role-based context.
 *
 * Handles:
 *   - Firebase Auth state listener (auto-login on app restart)
 *   - Firestore user profile fetch (role, displayName)
 *   - Loading state while checking auth
 *   - switchRole for dev-mode toggling
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

export const useAuth = () => useContext(AuthContext);

interface Props {
  children: ReactNode;
}

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
  const userName = user?.displayName || "";
  const uid = user?.uid || null;
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

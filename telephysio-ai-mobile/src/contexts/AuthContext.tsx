/**
 * AuthContext — Role-based user context.
 *
 * Provides `role` ('patient' | 'doctor') and a `switchRole` function
 * so the app can render the correct layout/navigator.
 *
 * Future: Replace mock role with Firebase Auth claims.
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'patient' | 'doctor';

interface AuthContextType {
  role: UserRole;
  switchRole: (role: UserRole) => void;
  userName: string;
}

const AuthContext = createContext<AuthContextType>({
  role: 'patient',
  switchRole: () => {},
  userName: 'Cody Li',
});

export const useAuth = () => useContext(AuthContext);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('patient');

  // Mock user name per role
  const userName = role === 'patient' ? 'Cody Li' : 'Dr. Sarah Nguyen';

  return (
    <AuthContext.Provider value={{ role, switchRole: setRole, userName }}>
      {children}
    </AuthContext.Provider>
  );
};

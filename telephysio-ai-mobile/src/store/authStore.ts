import { create } from 'zustand';
import { AppUser } from '../services/auth';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: () => set({ isInitialized: true }),
  reset: () => set({ user: null, isLoading: false }),
}));

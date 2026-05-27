/**
 * authService — Firebase Authentication + Firestore user creation.
 *
 * Maps to:
 *   - AuthContext (role, userName, switchRole)
 *   - ProfileScreen (user data display)
 *   - Login/Register flows (future screens)
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

// ── Register ────────────────────────────────────────
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

// ── Login ───────────────────────────────────────────
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(cred.user.uid);
  if (!profile) throw new Error('User profile not found in Firestore');
  return profile;
}

// ── Logout ──────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ── Get Current User Profile ────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Auth State Listener ─────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── Get Current Firebase User ───────────────────────
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

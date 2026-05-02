import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';

export type UserRole = 'patient' | 'doctor';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  assignedDoctorId?: string;
  createdAt?: Date;
}

/**
 * Register a new user and create their Firestore profile.
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const userData: any = {
    email,
    name,
    role,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), userData);

  return { uid, email, name, role, createdAt: new Date() };
}

/**
 * Sign in with email/password and fetch the user's Firestore profile.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return fetchUserProfile(credential.user.uid);
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Fetch a user's Firestore profile by UID.
 */
export async function fetchUserProfile(uid: string): Promise<AppUser> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    throw new Error('User profile not found');
  }
  const data = snap.data();
  return {
    uid,
    email: data.email,
    name: data.name,
    role: data.role,
    assignedDoctorId: data.assignedDoctorId,
  };
}

/**
 * Subscribe to auth state changes. Returns unsubscribe function.
 */
export function subscribeToAuthState(
  onUser: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, onUser);
}

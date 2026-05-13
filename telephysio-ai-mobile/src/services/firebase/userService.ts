/**
 * userService — Firestore CRUD for user profiles.
 *
 * Maps to:
 *   - ProfileScreen (displayName, email, phone, dateOfBirth, avatarUrl)
 *   - DoctorDashboardScreen (userName, specialty)
 *   - DoctorPatientsScreen (patient list with name, condition, progress)
 */

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  getDocs, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from './config';
import type { UserProfile, UserRole } from './types';

// ── Get User by UID ─────────────────────────────────
export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Update Profile ──────────────────────────────────
// Called when user edits profile (ProfileScreen "Edit" button)
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
export async function getAllPatients(): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'patient'))
  );
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

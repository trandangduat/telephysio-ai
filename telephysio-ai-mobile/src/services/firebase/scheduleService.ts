/**
 * scheduleService — Doctor schedule management.
 *
 * Maps to:
 *   - DoctorDashboardScreen (Today's Schedule card)
 */

import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';

import { db } from './config';
import type { ScheduleItem } from './types';

// ── Get Today's Schedule ────────────────────────────
// Called by DoctorDashboardScreen (schedule list)
export async function getTodaySchedule(doctorId: string): Promise<ScheduleItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const snap = await getDocs(
    query(
      collection(db, 'schedule'),
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<', Timestamp.fromDate(tomorrow)),
      orderBy('date', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
}

// ── Create Schedule Item ────────────────────────────
export async function createScheduleItem(
  data: Omit<ScheduleItem, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'schedule'), data);
  return ref.id;
}

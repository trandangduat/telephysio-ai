/**
 * @file scheduleService.ts
 * @description Dịch vụ quản lý lịch trình của bác sĩ.
 *
 * Hỗ trợ các tính năng:
 *   - DoctorDashboardScreen (Danh sách lịch trình hôm nay)
 */

import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';

import { db } from './config';
import type { ScheduleItem } from './types';

// ── Get Today's Schedule ────────────────────────────
// Called by DoctorDashboardScreen (schedule list)
/**
 * Lấy lịch trình hôm nay của bác sĩ.
 * 
 * @param {string} doctorId ID của bác sĩ
 * @return {Promise<ScheduleItem[]>} Mảng danh sách các mục lịch trình trong ngày hôm nay
 */
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
/**
 * Tạo mới một mục lịch trình.
 * 
 * @param {Omit<ScheduleItem, 'id'>} data Dữ liệu lịch trình cần tạo
 * @return {Promise<string>} ID của mục lịch trình vừa được tạo
 */
export async function createScheduleItem(
  data: Omit<ScheduleItem, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'schedule'), data);
  return ref.id;
}

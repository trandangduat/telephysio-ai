/**
 * notificationService — In-app notifications for session events.
 *
 * Events:
 *   - session_completed → doctor is notified when patient finishes a session
 *   - session_assigned  → patient is notified when doctor assigns a workout
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDoc,
} from "firebase/firestore";

import { db } from "./config";
import type { Notification, NotificationType } from "./types";

const NOTIFICATIONS_COLLECTION = "notifications";

// ── Create Notification ─────────────────────────────
export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Notification["data"];
}): Promise<string> {
  const ref = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Get User Notifications ──────────────────────────
export async function getUserNotifications(
  userId: string,
): Promise<Notification[]> {
  const snap = await getDocs(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    ),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Notification)
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return bTime - aTime;
    });
}

// ── Mark Single Notification as Read ────────────────
export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
    read: true,
  });
}

// ── Mark All Notifications as Read ──────────────────
export async function markAllRead(userId: string): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false),
    ),
  );
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

// ── Get Unread Count ────────────────────────────────
export async function getUnreadCount(userId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false),
    ),
  );
  return snap.size;
}

// ── Real-time Listener ──────────────────────────────
// Returns an unsubscribe function. Emits the full list on every change.
export function onNotificationsChange(
  userId: string,
  callback: (notifications: Notification[]) => void,
) {
  return onSnapshot(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    ),
    (snap) => {
      const notifications = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Notification)
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
          return bTime - aTime;
        });
      callback(notifications);
    },
    (err) => {
      console.error("Error in onNotificationsChange listener:", err);
    }
  );
}

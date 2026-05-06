/**
 * chatService — Real-time messaging between patient and doctor.
 *
 * Maps to:
 *   - DoctorChatScreen (chatData array: type, sender, text, tags, time)
 *   - DoctorSessionScreen (conversation list: patient, lastMessage, unread, hasFeedback)
 *   - SessionScreen → submitFeedback → navigates to DoctorChat
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "./config";
import type { ChatMessage, Conversation, MessageType } from "./types";

// ═══════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════

// ── Get or Create Conversation ──────────────────────
// Called when patient opens DoctorChat or doctor opens chat with patient
export async function getOrCreateConversation(
  patientId: string,
  doctorId: string,
  patientName: string,
  doctorName: string,
): Promise<string> {
  // Check if conversation exists
  const snap = await getDocs(
    query(
      collection(db, "conversations"),
      where("patientId", "==", patientId),
      where("doctorId", "==", doctorId),
    ),
  );

  if (!snap.empty) return snap.docs[0].id;

  // Create new conversation
  const convRef = await addDoc(collection(db, "conversations"), {
    patientId,
    doctorId,
    patientName,
    doctorName,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    unreadByDoctor: 0,
    unreadByPatient: 0,
    hasFeedback: false,
    feedbackSummary: "",
  });
  return convRef.id;
}

// ── Get Conversations for Doctor ────────────────────
// Called by DoctorSessionScreen (conversation list)
export async function getDoctorConversations(
  doctorId: string,
): Promise<Conversation[]> {
  const snap = await getDocs(
    query(
      collection(db, "conversations"),
      where("doctorId", "==", doctorId),
      orderBy("lastMessageAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation);
}

// ── Get Conversation for Patient ────────────────────
// Called by DoctorChatScreen on patient side
export async function getPatientConversation(
  patientId: string,
): Promise<Conversation | null> {
  const snap = await getDocs(
    query(
      collection(db, "conversations"),
      where("patientId", "==", patientId),
      orderBy("lastMessageAt", "desc"),
      limit(1),
    ),
  );
  return snap.empty
    ? null
    : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation);
}

// ═══════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════

// ── Send Message ────────────────────────────────────
// Called by DoctorChatScreen input bar (both patient and doctor)
export async function sendMessage(
  conversationId: string,
  data: {
    sender: "user" | "doctor";
    senderName: string;
    senderTitle?: string;
    type: MessageType;
    text: string;
    tags?: string[];
  },
): Promise<string> {
  // Add message to subcollection
  const msgRef = await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    {
      ...data,
      conversationId,
      createdAt: serverTimestamp(),
    },
  );

  // Update conversation metadata
  const updateData: any = {
    lastMessage: data.text.substring(0, 100),
    lastMessageAt: serverTimestamp(),
  };

  // Increment unread counter for the OTHER party
  if (data.sender === "user") {
    updateData.unreadByDoctor = increment(1);
  } else {
    updateData.unreadByPatient = increment(1);
  }

  // If this is a feedback message, flag it
  if (data.type === "feedback" || data.type === "patient_feedback") {
    updateData.hasFeedback = true;
    if (data.tags && data.tags.length > 0) {
      updateData.feedbackSummary = data.tags.join(" | ");
    }
  }

  await updateDoc(doc(db, "conversations", conversationId), updateData);
  return msgRef.id;
}

// ── Get Messages ────────────────────────────────────
// Called by DoctorChatScreen (renders chatData array)
export async function getMessages(
  conversationId: string,
  maxResults: number = 50,
): Promise<ChatMessage[]> {
  const snap = await getDocs(
    query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
      limit(maxResults),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
}

// ── Listen to Messages (Real-time) ──────────────────
// Called by DoctorChatScreen for live updates
export function onMessagesChange(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
) {
  return onSnapshot(
    query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
    ),
    (snap) => {
      const messages = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ChatMessage,
      );
      callback(messages);
    },
  );
}

// ── Mark as Read ────────────────────────────────────
// Called when user opens a conversation
export async function markAsRead(
  conversationId: string,
  role: "patient" | "doctor",
): Promise<void> {
  const field = role === "patient" ? "unreadByPatient" : "unreadByDoctor";
  await updateDoc(doc(db, "conversations", conversationId), {
    [field]: 0,
  });
}

// ── Upload Chat Attachment ──────────────────────────
// Called when user sends an image/file in chat
export async function uploadChatAttachment(
  conversationId: string,
  fileUri: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const fileRef = ref(
    storage,
    `chat/${conversationId}/${Date.now()}_${fileName}`,
  );
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}

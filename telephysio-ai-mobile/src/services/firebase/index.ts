/**
 * Firebase Services — Barrel export.
 *
 * Usage:
 *   import { loginUser, getPatientSessions, sendMessage } from '../services/firebase';
 */

// Config
export { auth, db, storage } from './config';

// Types
export type {
  UserProfile, UserRole,
  TreatmentPlan, Exercise, ExerciseDifficulty, ExerciseTemplate, Assignment,
  Session, ProgressSnapshot,
  ChatMessage, Conversation, MessageType, ExerciseFeedback,
  ScheduleItem, Notification, LibraryItem,
} from './types';

// Auth
export {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  onAuthChange,
  getCurrentUser,
} from './authService';

// Users
export {
  getUser,
  updateUserProfile,
  uploadAvatar,
  getPatients,
  getPatientDoctor,
  getAllPatients,
} from './userService';

// Assignments & Treatment Plans
export {
  getActiveTreatmentPlan,
  getDoctorTreatmentPlans,
  createTreatmentPlan,
  updateTreatmentPlan,
  getPatientAssignments,
  getDoctorAssignments,
  createAssignment,
  completeAssignment,
  getExerciseTemplates,
  createExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
  getGlobalExercises,
} from './assignmentService';

// Progress & Sessions
export {
  recordSession,
  getPatientSessions,
  submitDoctorFeedback,
  getWeeklySessionCount,
  getLatestProgress,
  saveProgressSnapshot,
  getProgressHistory,
  submitFeedback,
  getPatientFeedback,
  getAverageAccuracy,
} from './progressService';

// Chat
export {
  getOrCreateConversation,
  getDoctorConversations,
  getPatientConversation,
  sendMessage,
  getMessages,
  onMessagesChange,
  markAsRead,
  uploadChatAttachment,
} from './chatService';

// Schedule
export {
  getTodaySchedule,
  createScheduleItem,
} from './scheduleService';

// Library
export {
  getLibraryItems,
} from './libraryService';

// Seeding
export {
  seedMockData
} from './seedService';

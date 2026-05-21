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
  Session, ProgressSnapshot, IncompleteSession,
  ExerciseFeedback, NotificationType, Notification,
  ScheduleItem, LibraryItem,
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
  getIncompleteSession,
  saveIncompleteSession,
  updateIncompleteSession,
  deleteIncompleteSession,
  updateSessionEffort,
  deleteSessionVideo,
} from './progressService';

// Notifications
export {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  onNotificationsChange,
} from './notificationService';

// Video Recording Local
export {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  deleteLocalVideo,
  getLocalVideoDirectory,
  getTemporaryVideoPath,
  uploadVideoToFirebaseStorage,
  uploadThumbnailToFirebaseStorage,
} from './videoService';

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

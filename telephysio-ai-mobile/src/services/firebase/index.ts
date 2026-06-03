/**
 * @file index.ts
 * @description File xuất chung (Barrel export) cho tất cả các dịch vụ Firebase.
 * Gom nhóm các hàm xử lý dữ liệu và logic liên quan đến Firebase để dễ dàng import ở nơi khác.
 *
 * Cách sử dụng:
 *   import { loginUser, getPatientSessions, sendMessage } from '../services/firebase';
 */

// Cấu hình
export { auth, db, storage } from './config';

// Các kiểu dữ liệu
export type {
    UserProfile, UserRole,
    TreatmentPlan, Exercise, ExerciseDifficulty, ExerciseTemplate, Assignment,
    Session, ProgressSnapshot, IncompleteSession,
    ExerciseFeedback, NotificationType, Notification,
    ScheduleItem, LibraryItem,
} from './types';

// Xác thực
export {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    onAuthChange,
    getCurrentUser,
} from './authService';

// Người dùng
export {
    getUser,
    updateUserProfile,
    uploadAvatar,
    getPatients,
    getPatientDoctor,
    getAllPatients,
} from './userService';

// Phân công & Phác đồ điều trị
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

// Tiến trình & Phiên tập
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

// Thông báo
export {
    createNotification,
    getUserNotifications,
    markNotificationRead,
    markAllRead,
    getUnreadCount,
    onNotificationsChange,
} from './notificationService';

// Ghi hình Video Cục bộ
export {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  deleteLocalVideo,
  getLocalVideoDirectory,
  getTemporaryVideoPath,
  uploadVideoToCloudinary,
  uploadThumbnailToCloudinary,
} from './videoService';

// Lịch trình
export {
    getTodaySchedule,
    createScheduleItem,
} from './scheduleService';

// Thư viện
export {
  getLibraryItems,
} from './libraryService';

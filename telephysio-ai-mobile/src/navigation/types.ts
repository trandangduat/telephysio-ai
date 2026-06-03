/**
 * types.ts — Định nghĩa kiểu dữ liệu trung tâm cho hệ thống điều hướng.
 *
 * <p>File này chứa tất cả các {@code ParamList} của React Navigation dành cho:
 * <ul>
 *   <li>Auth Stack — màn hình xác thực (Login, SignUp)</li>
 *   <li>Patient Stack — điều hướng stack của bệnh nhân</li>
 *   <li>Patient Bottom Tabs — điều hướng tab phía dưới của bệnh nhân</li>
 *   <li>Doctor Stack — điều hướng stack của bác sĩ</li>
 *   <li>Doctor Bottom Tabs — điều hướng tab phía dưới của bác sĩ</li>
 * </ul>
 * Ngoài ra, hằng {@code SCREENS} tập trung tên tất cả các màn hình để tránh lỗi đánh máy.
 * </p>
 */

import type { Session } from '../services/firebase/types';

// ── Điều hướng Xác thực ───────────────────────────

/**
 * Kiểu tham số điều hướng cho Auth Stack.
 *
 * <p>Được dùng khi người dùng chưa đăng nhập. Bao gồm hai màn hình:
 * <ul>
 *   <li>{@code Login} — Màn hình đăng nhập</li>
 *   <li>{@code SignUp} — Màn hình đăng ký tài khoản mới</li>
 * </ul>
 * </p>
 */
export type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

// ── Điều hướng Bệnh nhân ──────────────────────────

/**
 * Kiểu tham số điều hướng cho Root Stack của bệnh nhân.
 *
 * <p>Định nghĩa tất cả các màn hình trong stack chính của bệnh nhân và
 * các tham số bắt buộc/tùy chọn được truyền khi điều hướng đến mỗi màn hình:
 * <ul>
 *   <li>{@code MainTabs} — Màn hình chứa bottom tab navigator</li>
 *   <li>{@code Calibration} — Màn hình hiệu chỉnh tư thế trước khi tập</li>
 *   <li>{@code Training} — Màn hình tập luyện chính</li>
 *   <li>{@code ExerciseResult} — Màn hình kết quả sau mỗi bài tập</li>
 *   <li>{@code WorkoutSummary} — Màn hình tổng kết buổi tập</li>
 *   <li>{@code Profile} — Màn hình hồ sơ người dùng</li>
 *   <li>{@code MyAssignments} — Màn hình danh sách bài tập được giao</li>
 *   <li>{@code WorkoutDetail} — Màn hình chi tiết một bài tập</li>
 *   <li>{@code Notifications} — Màn hình thông báo</li>
 * </ul>
 * </p>
 */
export type RootStackParamList = {
  MainTabs: undefined;
  Calibration: { assignmentId: string; exerciseIndex: number; recordVideo?: boolean };
  Training: { assignmentId: string; exerciseIndex: number; recordVideo?: boolean };
  ExerciseResult: {
    assignmentId: string;
    exerciseIndex: number;
    accuracy: number;
    durationSeconds: number;
    reps: number;
    sets: number;
    recordVideo?: boolean;
    setDurations?: number[];
    setsData?: {
      setNumber: number;
      repsCompleted: number;
      durationSec: number;
      accuracy: number;
    }[];
    videoResult?: {
      videoPath: string;
      thumbnailPath: string;
      relativeVideoPath: string;
      relativeThumbnailPath: string;
      fileSizeMB: number;
    } | null;
  };
  WorkoutSummary: { assignmentId: string; recordVideo?: boolean };
  Profile: undefined;
  MyAssignments: undefined;
  WorkoutDetail: { assignmentId: string };
  Notifications: undefined;
};

/**
 * Kiểu tham số điều hướng cho Bottom Tab Navigator của bệnh nhân.
 *
 * <p>Định nghĩa các tab trong thanh điều hướng phía dưới:
 * <ul>
 *   <li>{@code Home} — Tab trang chủ (hiện dùng WorkoutScreen)</li>
 *   <li>{@code Workout} — Tab bài tập</li>
 *   <li>{@code Sessions} — Tab lịch sử phiên tập</li>
 *   <li>{@code Library} — Tab thư viện bài tập (tạm thời bị ẩn)</li>
 *   <li>{@code Progress} — Tab tiến độ phục hồi (tạm thời bị ẩn)</li>
 * </ul>
 * </p>
 */
export type BottomTabParamList = {
    Home: undefined;
    Workout: undefined;
    Sessions: undefined;
    Library: undefined;
    Progress: undefined;
};

// ── Điều hướng Bác sĩ ─────────────────────────────

/**
 * Kiểu tham số điều hướng cho Doctor Stack (stack chính của bác sĩ).
 *
 * <p>Định nghĩa tất cả các màn hình trong stack của bác sĩ:
 * <ul>
 *   <li>{@code DoctorTabs} — Màn hình chứa bottom tab navigator của bác sĩ</li>
 *   <li>{@code PatientDetail} — Màn hình chi tiết bệnh nhân</li>
 *   <li>{@code DoctorProfile} — Màn hình hồ sơ bác sĩ</li>
 *   <li>{@code TemplateEditor} — Màn hình soạn thảo mẫu phác đồ bài tập</li>
 *   <li>{@code AssignTemplate} — Màn hình giao phác đồ cho bệnh nhân</li>
 *   <li>{@code PatientSessions} — Màn hình xem lịch sử tập luyện của bệnh nhân</li>
 *   <li>{@code DoctorSessionDetail} — Màn hình chi tiết một phiên tập của bệnh nhân</li>
 *   <li>{@code Notifications} — Màn hình thông báo</li>
 * </ul>
 * </p>
 */
export type DoctorStackParamList = {
    DoctorTabs: undefined;
    PatientDetail: { patientId: string; patientName: string };
    DoctorProfile: undefined;
    TemplateEditor: { templateId?: string };
    AssignTemplate: { templateId?: string; templateName?: string; patientId?: string; patientName?: string };
    DoctorSessionDetail: { session: Session; patientName: string };
    Notifications: undefined;
};

/**
 * Kiểu tham số điều hướng cho Bottom Tab Navigator của bác sĩ.
 *
 * <p>Định nghĩa các tab trong thanh điều hướng phía dưới của bác sĩ:
 * <ul>
 *   <li>{@code Dashboard} — Tab tổng quan bệnh nhân</li>
 *   <li>{@code Assignments} — Tab quản lý phác đồ bài tập</li>
 *   <li>{@code Patients} — Tab danh sách bệnh nhân</li>
 * </ul>
 * </p>
 */
export type DoctorTabParamList = {
  Dashboard: undefined;
  Assignments: undefined;
};

/**
 * Hằng số tập trung tên tất cả các màn hình trong ứng dụng.
 *
 * <p>Sử dụng hằng này thay vì chuỗi ký tự trực tiếp khi điều hướng để tránh
 * lỗi đánh máy và dễ dàng tái cấu trúc tên màn hình. Ví dụ:
 * {@code navigation.navigate(SCREENS.Login)}</p>
 */
export const SCREENS = {
    // Xác thực
    Login: 'Login',
    SignUp: 'SignUp',
    // Bệnh nhân
    MainTabs: 'MainTabs',
    Home: 'Home',
    Calibration: 'Calibration',
    Training: 'Training',
    ExerciseResult: 'ExerciseResult',
    WorkoutSummary: 'WorkoutSummary',
    Workout: 'Workout',
    Profile: 'Profile',
    MyAssignments: 'MyAssignments',
    WorkoutDetail: 'WorkoutDetail',
    Notifications: 'Notifications',
    // Bác sĩ
    DoctorTabs: 'DoctorTabs',
    Dashboard: 'Dashboard',
    Assignments: 'Assignments',
    PatientDetail: 'PatientDetail',
    DoctorProfile: 'DoctorProfile',
    TemplateEditor: 'TemplateEditor',
    AssignTemplate: 'AssignTemplate',
    DoctorSessionDetail: 'DoctorSessionDetail',
} as const;

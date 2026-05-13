/**
 * Vietnamese translations — TelePhysioAI
 */

export default {
  // ── Common ───────────────────────────────────────
  common: {
    ok: 'OK',
    cancel: 'Huỷ',
    submit: 'Gửi',
    back: 'Quay lại',
    today: 'Hôm nay',
    sets: 'hiệp',
    reps: 'lần',
    minutes: 'phút',
  },

  // ── Tab Bar ──────────────────────────────────────
  tabs: {
    home: 'Trang chủ',
    workout: 'Tập luyện',
    library: 'Thư viện',
    progress: 'Tiến độ',
    feedback: 'Phản hồi',
  },

  // ── Navigation Titles ────────────────────────────
  nav: {
    calibration: 'Hiệu chỉnh Camera',
    training: 'Phòng luyện tập AI',
    doctorChat: 'Trò chuyện cùng Bác sĩ',
  },

  // ── Home Screen ──────────────────────────────────
  home: {
    greeting: 'Xin chào, {{name}}',
    todayBadge: 'Buổi tập hôm nay',
    startWorkout: 'Bắt đầu tập',
    recoveryProgress: 'Tiến trình hồi phục',
    weekSchedule: 'Lịch tuần này',
    setsReps: '{{sets}} hiệp × {{reps}} lần',
    newNoticeBadge: 'Tin mới',
  },

  // ── Week Calendar ────────────────────────────────
  weekDays: {
    mon: 'T2',
    tue: 'T3',
    wed: 'T4',
    thu: 'T5',
    fri: 'T6',
    sat: 'T7',
    sun: 'CN',
  },

  // ── Library Screen ───────────────────────────────
  library: {
    title: 'Thư viện bài tập',
    noExercises: 'Không có bài tập nào.',
    filterAll: 'Tất cả',
    filterVideos: 'Video',
    filterPDFs: 'Tài liệu PDF',
    filterArticles: 'Bài viết',
    searchPlaceholder: 'Tìm kiếm bài tập, hướng dẫn, video...',
    readGuide: 'Đọc toàn bộ',
    viewAllSaved: 'Xem tất cả đã lưu',
    educationalGuides: 'Tài liệu Giáo dục',
    instructionalVideo: 'Video Hướng dẫn',
    kneeHealth: 'Sức khoẻ Đầu gối',
  },

  // ── Progress Screen ──────────────────────────────
  progress: {
    title: 'Hành trình Hồi phục',
    subtitle: 'Tuần 6 của VLTL dây chằng chéo • Giai đoạn 2',
    weeklyConsistency: 'Mức độ Kiên trì',
    score: 'Điểm',
    greatJob: "Làm tốt lắm! Bạn đã đạt mục tiêu 5/7 ngày trong tuần này.",
    rom: 'Tầm vận động khớp (Gập gối)',
    romDesc: 'Đo lường bằng độ thông qua AI',
    flexion: 'Gập (Flexion)',
    extension: 'Duỗi (Extension)',
    strength: 'Cải thiện sức mạnh',
    quadriceps: 'Cơ đùi trước',
    hamstring: 'Độ ổn định Cơ gân khoeo',
    vsLastWeek: '+{{percent}}% so với tuần trước',
    aiInsight: 'Gợi ý Phục hồi AI',
    insightDesc: 'Dựa trên tầm vận động khớp của bạn, tốc độ phục hồi nhanh hơn 15% so với mức trung bình. Độ duỗi gối gần như hoàn hảo; hãy tập trung vào các bài gập gối sâu trong tuần này để duy trì lộ trình cho Giai đoạn 3.',
    viewRecommended: 'Xem bài tập được đề xuất',
    recentMilestones: 'Cột mốc gần đây',
    flexionGoal: 'Mục tiêu gập 120°',
    flexionGoalDesc: 'Đã đạt được vào buổi tập tối hôm qua',
    streak: 'Chuỗi 14 ngày',
    streakDesc: 'Duy trì tập luyện hàng ngày trong hai tuần',
  },

  // ── Workout Screen ───────────────────────────────
  workout: {
    title: "Bài tập Hôm nay",
    subtitle: 'Hoàn thành các bài tập này để đạt mục tiêu hàng ngày.',
    startSession: 'Bắt đầu tập',
    beginWorkout: 'Bắt đầu ngay',
    continueWorkout: 'Tiếp tục tập',
  },

  // ── Calibration Screen ───────────────────────────
  calibration: {
    notReady: 'Chưa nhận diện được — Hãy lùi lại',
    partial: 'Gần đúng — Điều chỉnh thêm',
    ready: '✅ Sẵn sàng',
    instruction: 'Đặt thiết bị cách bạn 1.5–2m. Đảm bảo camera thấy toàn thân.',
    startButton: 'Bắt đầu',
  },

  // ── Training Screen ──────────────────────────────
  training: {
    set: 'HIỆP {{current}}/{{total}}',
    repCount: 'SỐ LẦN',
    formAccuracy: 'Form Accuracy',
    live: 'LIVE',
    poseWarn: '⚠️ Điều chỉnh tư thế',
    poseStop: '⛔ Dừng lại ngay',
  },

  // ── Report Screen ────────────────────────────────
  report: {
    title: 'Báo cáo tiến độ',
    completionRate: 'Tỉ lệ hoàn thành',
    sessions: '{{count}} buổi · {{minutes}} phút',
    avgAccuracy: 'Form trung bình: {{percent}}%',
    milestones: 'Cột mốc',
    history: 'Lịch sử tập luyện',
  },

  // ── Feedback Screen ──────────────────────────────
  feedback: {
    painTitle: 'Mức độ đau',
    painDescription: 'Chọn mức độ đau bạn cảm nhận (1 = không đau, 10 = rất đau)',
    symptomsTitle: 'Triệu chứng',
    notesLabel: 'Ghi chú thêm (tuỳ chọn)',
    notesPlaceholder: 'Thêm mô tả nếu cần...',
    submitButton: 'Gửi phản hồi',
    doctorResponses: 'Phản hồi từ bác sĩ',
    submitSuccessTitle: 'Gửi thành công',
    submitSuccessMessage: 'Phản hồi của bạn đã được ghi nhận. Bác sĩ sẽ xem xét sớm nhất.',
  },

  // ── Symptom Options ──────────────────────────────
  symptoms: {
    pain: 'Đau nhức',
    painDesc: 'Cảm giác đau ở vùng tập',
    stiff: 'Cứng khớp',
    stiffDesc: 'Khó cử động',
    swelling: 'Sưng',
    swellingDesc: 'Vùng tập bị sưng',
    tired: 'Mệt mỏi',
    tiredDesc: 'Cảm giác kiệt sức',
    good: 'Bình thường',
    goodDesc: 'Không có triệu chứng',
    better: 'Tốt hơn',
    betterDesc: 'Cải thiện rõ rệt',
  },

  // ── Profile Screen ───────────────────────────────
  profile: {
    navTitle: 'Hồ sơ & Cài đặt',
    activity: 'Hoạt động',
    viewAll: 'Xem tất cả',
    completed: 'Đã hoàn thành',
    scheduled: 'Lên lịch lúc',
    myLibrary: 'Thư viện',
    savedExercises: 'Bài tập đã lưu',
    guidesTips: 'Hướng dẫn & Mẹo',
    items: 'bài',
    articles: 'bài viết',
    dailyTip: 'Mẹo phục hồi hàng ngày',
    hydration: 'Cấp nước & Hồi phục',
    hydrationDesc: 'Uống đủ nước giúp cải thiện sự bôi trơn của khớp xương.',
    personalInfo: 'Thông tin cá nhân',
    edit: 'Sửa',
    settings: 'Cài đặt',
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    notifications: 'Thông báo',
    privacy: 'Quyền riêng tư & Dữ liệu',
    support: 'Trung tâm hỗ trợ',
    logout: 'Đăng xuất',
    light: 'Sáng',
    dark: 'Tối'
  },
} as const;

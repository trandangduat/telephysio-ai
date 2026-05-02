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
    library: 'Bài tập',
    report: 'Báo cáo',
    feedback: 'Phản hồi',
  },

  // ── Navigation Titles ────────────────────────────
  nav: {
    calibration: 'Hiệu chỉnh Camera',
    training: 'Phòng luyện tập AI',
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
    filterAssigned: 'Được giao',
    filterRef: 'Tham khảo',
    filterUpper: 'Chi trên',
    filterLower: 'Chi dưới',
    filterCore: 'Thân mình',
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
} as const;

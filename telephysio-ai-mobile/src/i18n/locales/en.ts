/**
 * English translations — TelePhysioAI
 */

export default {
  // ── Common ───────────────────────────────────────
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    submit: 'Submit',
    back: 'Back',
    today: 'Today',
    sets: 'sets',
    reps: 'reps',
    minutes: 'min',
  },

  // ── Tab Bar ──────────────────────────────────────
  tabs: {
    home: 'Home',
    workout: 'Workout',
    library: 'Library',
    progress: 'Progress',
    feedback: 'Feedback',
  },

  // ── Navigation Titles ────────────────────────────
  nav: {
    calibration: 'Camera Calibration',
    training: 'AI Training Room',
    doctorChat: 'Doctor Feedback & Chat',
  },

  // ── Home Screen ──────────────────────────────────
  home: {
    greeting: 'Hello, {{name}}',
    todayBadge: "Today's Workout",
    startWorkout: 'Start Workout',
    recoveryProgress: 'Recovery Progress',
    weekSchedule: 'This Week',
    setsReps: '{{sets}} sets × {{reps}} reps',
    newNoticeBadge: 'New',
  },

  // ── Week Calendar ────────────────────────────────
  weekDays: {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  },

  // ── Library Screen ───────────────────────────────
  library: {
    title: 'Exercise Library',
    noExercises: 'No exercises found.',
    filterAll: 'All Items',
    filterVideos: 'Videos',
    filterPDFs: 'PDFs',
    filterArticles: 'Articles',
    searchPlaceholder: 'Search exercises, guides, or videos...',
    readGuide: 'Read full guide',
    viewAllSaved: 'View All Saved',
    educationalGuides: 'Educational Guides',
    instructionalVideo: 'Instructional Video',
    kneeHealth: 'Knee Health',
  },

  // ── Progress Screen ──────────────────────────────
  progress: {
    title: 'Your Recovery Journey',
    subtitle: 'Week 6 of ACL Rehabilitation • Phase 2',
    weeklyConsistency: 'Weekly Consistency',
    score: 'Score',
    greatJob: "Great job! You've hit your goals 5 out of 7 days this week.",
    rom: 'Range of Motion (Knee Flexion)',
    romDesc: 'Measured in degrees via AI Analysis',
    flexion: 'Flexion',
    extension: 'Extension',
    strength: 'Strength Improvement',
    quadriceps: 'Quadriceps Strength',
    hamstring: 'Hamstring Stability',
    vsLastWeek: '+{{percent}}% vs last week',
    aiInsight: 'AI Recovery Insight',
    insightDesc: 'Based on your Range of Motion data, you are recovering 15% faster than average. Your knee extension is nearly perfect; focus on deep flexion exercises this week to stay on track for Phase 3.',
    viewRecommended: 'View Recommended Exercises',
    recentMilestones: 'Recent Milestones',
    flexionGoal: '120° Flexion Goal',
    flexionGoalDesc: 'Achieved yesterday during evening session',
    streak: '14 Day Streak',
    streakDesc: 'Consistent daily therapy for two weeks',
  },

  // ── Workout Screen ───────────────────────────────
  workout: {
    title: "Today's Protocol",
    subtitle: 'Complete these exercises to reach your daily goal.',
    startSession: 'Start Session',
    beginWorkout: 'Begin Workout',
    continueWorkout: 'Continue Workout',
  },

  // ── Calibration Screen ───────────────────────────
  calibration: {
    notReady: 'Not detected — Step back',
    partial: 'Almost — Adjust position',
    ready: '✅ Ready',
    instruction: 'Place your device 1.5–2m away. Make sure the camera can see your full body.',
    startButton: 'Start',
  },

  // ── Training Screen ──────────────────────────────
  training: {
    set: 'SET {{current}}/{{total}}',
    repCount: 'REPS',
    formAccuracy: 'Form Accuracy',
    live: 'LIVE',
    poseWarn: '⚠️ Adjust your posture',
    poseStop: '⛔ Stop immediately',
  },

  // ── Report Screen ────────────────────────────────
  report: {
    title: 'Progress Report',
    completionRate: 'Completion Rate',
    sessions: '{{count}} sessions · {{minutes}} min',
    avgAccuracy: 'Avg Form: {{percent}}%',
    milestones: 'Milestones',
    history: 'Training History',
  },

  // ── Feedback Screen ──────────────────────────────
  feedback: {
    painTitle: 'Pain Level',
    painDescription: 'Select your pain level (1 = no pain, 10 = severe pain)',
    symptomsTitle: 'Symptoms',
    notesLabel: 'Additional Notes (optional)',
    notesPlaceholder: 'Add a description if needed...',
    submitButton: 'Submit Feedback',
    doctorResponses: 'Doctor Responses',
    submitSuccessTitle: 'Submitted Successfully',
    submitSuccessMessage: 'Your feedback has been recorded. The doctor will review it soon.',
  },

  // ── Symptom Options ──────────────────────────────
  symptoms: {
    pain: 'Pain',
    painDesc: 'Pain in the exercise area',
    stiff: 'Stiffness',
    stiffDesc: 'Difficulty moving',
    swelling: 'Swelling',
    swellingDesc: 'Swelling in exercise area',
    tired: 'Fatigue',
    tiredDesc: 'Feeling exhausted',
    good: 'Normal',
    goodDesc: 'No symptoms',
    better: 'Improved',
    betterDesc: 'Noticeable improvement',
  },

  // ── Profile Screen ───────────────────────────────
  profile: {
    navTitle: 'Profile & Settings',
    activity: 'Activity',
    viewAll: 'View All',
    completed: 'Completed',
    scheduled: 'Scheduled for',
    myLibrary: 'My Library',
    savedExercises: 'Saved Exercises',
    guidesTips: 'Guides & Tips',
    items: 'items',
    articles: 'articles',
    dailyTip: 'Daily Recovery Tip',
    hydration: 'Hydration & Healing',
    hydrationDesc: 'Drinking enough water improves joint lubrication.',
    personalInfo: 'Personal Information',
    edit: 'Edit',
    settings: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy & Data',
    support: 'Contact Support Center',
    logout: 'Log Out',
    light: 'Light',
    dark: 'Dark'
  },
} as const;

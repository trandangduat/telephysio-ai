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
    library: 'Library',
    report: 'Report',
    feedback: 'Feedback',
  },

  // ── Navigation Titles ────────────────────────────
  nav: {
    calibration: 'Camera Calibration',
    training: 'AI Training Room',
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
    filterAll: 'All',
    filterAssigned: 'Assigned',
    filterRef: 'Reference',
    filterUpper: 'Upper Body',
    filterLower: 'Lower Body',
    filterCore: 'Core',
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
} as const;

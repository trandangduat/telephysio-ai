import * as dotenv from 'dotenv';
import path from 'path';

// 1. Load environment variables from .env BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from '../src/services/firebase/config';

// User Constants provided
const DOCTOR_UID = "7TENJnJy1gTIZQ9QJySrpEJe3kl2";
const PATIENT_UID = "FN285ox2PYgBoCOfoObBGZTpNZh1";

async function seed() {
  console.log("🚀 Starting custom seed script for test users...");
  
  try {
    // Clear existing test data for user to provide clean slate
    console.log("🧹 Clearing prior user sessions & incomplete sessions...");
    const sessionsQ = query(collection(db, "sessions"), where("patientId", "==", PATIENT_UID));
    const sessionsSnap = await getDocs(sessionsQ);
    for (const snap of sessionsSnap.docs) {
      await deleteDoc(snap.ref);
    }
    const incQ = query(collection(db, "incomplete_sessions"), where("patientId", "==", PATIENT_UID));
    const incSnap = await getDocs(incQ);
    for (const snap of incSnap.docs) {
      await deleteDoc(snap.ref);
    }

    const batch = writeBatch(db);

    // ═══════════════════════════════════════════════════
    // 1. CREATE/UPDATE USERS
    // ═══════════════════════════════════════════════════
    console.log("👉 Populating users...");
    
    const doctorRef = doc(db, "users", DOCTOR_UID);
    const doctorData = {
      uid: DOCTOR_UID,
      displayName: "Dr.TuanAnh",
      email: "ta@gmail.com",
      role: "doctor",
      dateOfBirth: "17/10/2005",
      phone: "01234345",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    batch.set(doctorRef, doctorData, { merge: true });

    const patientRef = doc(db, "users", PATIENT_UID);
    const patientData = {
      uid: PATIENT_UID,
      displayName: "Do Kien",
      email: "linh@gmail.com",
      role: "patient",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    batch.set(patientRef, patientData, { merge: true });

    // ═══════════════════════════════════════════════════
    // 2. GLOBAL EXERCISES
    // ═══════════════════════════════════════════════════
    console.log("👉 Populating global exercises...");
    const exercises = [
      {
        id: "ex-1",
        name: "Squat",
        category: "Lower Body",
        color: "#FF5733",
        icon: "barbell-outline",
        duration: "5 mins",
        reps: 10,
        sets: 3,
      },
      {
        id: "ex-2",
        name: "Knee Extension",
        category: "Lower Body",
        color: "#33FF57",
        icon: "body-outline",
        duration: "5 mins",
        reps: 15,
        sets: 3,
      },
      {
        id: "ex-3",
        name: "Shoulder Press",
        category: "Upper Body",
        color: "#3357FF",
        icon: "fitness-outline",
        duration: "7 mins",
        reps: 12,
        sets: 3,
      },
      {
        id: "ex-4",
        name: "Plank",
        category: "Core",
        color: "#F333FF",
        icon: "accessibility-outline",
        duration: "1 min",
        reps: 1,
        sets: 3,
      },
      {
        id: "ex-5",
        name: "Lunges",
        category: "Lower Body",
        color: "#FFB533",
        icon: "walk-outline",
        duration: "5 mins",
        reps: 10,
        sets: 3,
      },
    ];

    for (const ex of exercises) {
      const ref = doc(db, "exercises", ex.id);
      batch.set(ref, ex, { merge: true });
    }

    // ═══════════════════════════════════════════════════
    // 3. TREATMENT PLAN
    // ═══════════════════════════════════════════════════
    console.log("👉 Creating Treatment Plan...");
    const planId = `plan-${PATIENT_UID}`;
    const planRef = doc(db, "treatment_plans", planId);
    batch.set(planRef, {
      id: planId,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      condition: "Phục hồi chức năng khớp gối (Knee Surgery)",
      status: "on-track",
      progress: 45,
      currentPhase: 1,
      currentWeek: 2,
      totalWeeks: 8,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    // ═══════════════════════════════════════════════════
    // 4. ASSIGNMENTS (Create 1 active, 1 completed)
    // ═══════════════════════════════════════════════════
    console.log("👉 Creating active/completed Assignments...");
    
    // Active Assignment 1: Morning Session
    const activeAssignmentId = `assignment-${PATIENT_UID}-active-1`;
    const activeRef = doc(db, "assignments", activeAssignmentId);
    batch.set(activeRef, {
      id: activeAssignmentId,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      status: "active",
      templateName: "Phục hồi khớp gối - Sáng",
      totalDuration: "10 min",
      assignedAt: Timestamp.now(),
      scheduledTimeSlot: "08:00 - 09:00",
      exercises: [
        {
          id: "ex-1",
          name: "Squat",
          category: "Lower Body",
          color: "#FF5733",
          icon: "barbell-outline",
          duration: "5 mins",
          difficulty: "medium",
          reps: 10,
          sets: 3,
          restBetweenSets: 45,
          notes: "Hãy cố gắng giữ thăng bằng cơ thể tốt.",
        }
      ],
    }, { merge: true });

    // Active Assignment 2: Afternoon Session
    const activeAssignmentId2 = `assignment-${PATIENT_UID}-active-2`;
    const activeRef2 = doc(db, "assignments", activeAssignmentId2);
    batch.set(activeRef2, {
      id: activeAssignmentId2,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      status: "active",
      templateName: "Phục hồi khớp gối - Chiều",
      totalDuration: "12 min",
      assignedAt: Timestamp.now(),
      scheduledTimeSlot: "15:00 - 16:00",
      exercises: [
        {
          id: "ex-4",
          name: "Plank",
          category: "Core",
          color: "#F333FF",
          icon: "accessibility-outline",
          duration: "1 min",
          difficulty: "medium",
          reps: 1,
          sets: 3,
          restBetweenSets: 60,
          notes: "Giữ thẳng cột sống.",
        },
        {
          id: "ex-2",
          name: "Knee Extension",
          category: "Lower Body",
          color: "#33FF57",
          icon: "body-outline",
          duration: "5 mins",
          difficulty: "easy",
          reps: 15,
          sets: 3,
          restBetweenSets: 30,
          notes: "Giữ vững tư thế đùi.",
        }
      ],
    }, { merge: true });

    // Completed assignment (past)
    const pastAssignmentId = `assignment-${PATIENT_UID}-past`;
    const pastRef = doc(db, "assignments", pastAssignmentId);
    batch.set(pastRef, {
      id: pastAssignmentId,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      status: "completed",
      templateName: "Tuần khởi động - Khởi động cơ xương khớp",
      totalDuration: "15 min",
      assignedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      completedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      exercises: [
        {
          id: "ex-2",
          name: "Knee Extension",
          category: "Lower Body",
          color: "#33FF57",
          icon: "body-outline",
          duration: "5 mins",
          reps: 15,
          sets: 3,
        },
        {
          id: "ex-3",
          name: "Shoulder Press",
          category: "Upper Body",
          color: "#3357FF",
          icon: "fitness-outline",
          duration: "7 mins",
          reps: 12,
          sets: 3,
        }
      ]
    }, { merge: true });

    // ═══════════════════════════════════════════════════
    // 5. SESSIONS
    // ═══════════════════════════════════════════════════
    console.log("👉 Creating past completed Sessions...");
    
    const pastSessionId = `session-${pastAssignmentId}-1`;
    const sessionRef = doc(db, "sessions", pastSessionId);
    batch.set(sessionRef, {
      id: pastSessionId,
      patientId: PATIENT_UID,
      assignmentId: pastAssignmentId,
      date: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      accuracy: 85,
      accuracyScore: 85,
      duration: "15 min",
      totalDuration: "15 min",
      durationSeconds: 900,
      painLevel: 3,
      averagePain: 3,
      reps: 81,
      sets: 6,
      exercisesCompleted: 2,
      completedExercises: 2,
      exerciseList: ["Knee Extension", "Shoulder Press"],
      completedExercisesData: [
        {
          name: "Knee Extension",
          accuracy: 88,
          reps: 45,
          sets: 3,
          durationSeconds: 360,
          icon: "body-outline",
          color: "#33FF57",
        },
        {
          name: "Shoulder Press",
          accuracy: 82,
          reps: 36,
          sets: 3,
          durationSeconds: 540,
          icon: "fitness-outline",
          color: "#3357FF",
        }
      ],
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      doctorName: "Dr.TuanAnh",
      doctorFeedback: "Biên độ gập gối đã khá ổn định, hãy tiếp tục tập luyện chăm chỉ nhé.",
      reviewedAt: Timestamp.now(),
      formBreakdown: {
        "Độ vững gối": 88,
        "Độ thẳng tay": 82,
      }
    }, { merge: true });

    // Past Session Example 2 (2 days ago)
    const pastAssignmentId2 = `assignment-${PATIENT_UID}-past-2`;
    const pastRef2 = doc(db, "assignments", pastAssignmentId2);
    batch.set(pastRef2, {
      id: pastAssignmentId2,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      status: "completed",
      templateName: "Bài tập phục hồi nâng cao - Buổi 2",
      totalDuration: "20 min",
      assignedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      completedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      exercises: []
    }, { merge: true });

    const pastSessionId2 = `session-${pastAssignmentId2}-2`;
    const sessionRef2 = doc(db, "sessions", pastSessionId2);
    batch.set(sessionRef2, {
      id: pastSessionId2,
      patientId: PATIENT_UID,
      assignmentId: pastAssignmentId2,
      date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      accuracy: 90,
      accuracyScore: 90,
      duration: "20 min",
      totalDuration: "20 min",
      durationSeconds: 1200,
      painLevel: 2,
      averagePain: 2,
      reps: 60,
      sets: 6,
      exercisesCompleted: 2,
      completedExercises: 2,
      exerciseList: ["Squat", "Plank"],
      completedExercisesData: [
        {
          name: "Squat",
          accuracy: 92,
          reps: 30,
          sets: 3,
          durationSeconds: 480,
          icon: "barbell-outline",
          color: "#FF5733",
        },
        {
          name: "Plank",
          accuracy: 88,
          reps: 30,
          sets: 3,
          durationSeconds: 720,
          icon: "accessibility-outline",
          color: "#F333FF",
        }
      ],
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      doctorName: "Dr.TuanAnh",
      doctorFeedback: "Tư thế Squat thẳng rất đẹp, giữ vững form này nhé.",
      reviewedAt: Timestamp.now(),
      formBreakdown: {
        "Tư thế lưng": 92,
        "Sức bền": 88,
      }
    }, { merge: true });

    // ═══════════════════════════════════════════════════
    // 6. PROGRESS SNAPSHOTS (for charts)
    // ═══════════════════════════════════════════════════
    console.log("👉 Creating progress snapshots...");
    for (let i = 1; i <= 4; i++) {
      const snapshotId = `snapshot-${PATIENT_UID}-w${i}`;
      const ref = doc(db, "progress_snapshots", snapshotId);
      batch.set(ref, {
        id: snapshotId,
        patientId: PATIENT_UID,
        movementScore: 65 + i * 4,
        timeActiveMinutes: 40 + i * 10,
        dailyGoalPercent: 60 + i * 5,
        sessionsCompleted: i,
        sessionsTarget: 4,
        weeklyConsistency: 75 + i * 3,
        romFlexion: 45 + i * 5,
        romExtension: 12 + i * 2,
        quadricepsStrength: 50 + i * 5,
        hamstringStability: 52 + i * 4,
        aiInsight: i === 4 ? "Khớp gối của bạn phục hồi rất nhanh, có thể tăng cường độ tập." : "Duy trì tư thế tốt.",
        date: Timestamp.fromDate(new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000)),
      }, { merge: true });
    }

    // ═══════════════════════════════════════════════════
    // 7. CONVERSATION (FOR CHAT)
    // ═══════════════════════════════════════════════════
    console.log("👉 Setting up doctor-patient chat...");
    const conversationId = `conv-${DOCTOR_UID}-${PATIENT_UID}`;
    const convRef = doc(db, "conversations", conversationId);
    batch.set(convRef, {
      id: conversationId,
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      patientName: "Do Kien",
      doctorName: "Dr.TuanAnh",
      lastMessage: "Biên độ gập gối đã khá ổn định, hãy tiếp tục tập luyện chăm chỉ nhé.",
      lastMessageAt: Timestamp.now(),
      unreadByDoctor: 0,
      unreadByPatient: 0,
      hasFeedback: false,
    }, { merge: true });

    // ═══════════════════════════════════════════════════
    // 8. INCOMPLETE SESSIONS (Active Workouts)
    // ═══════════════════════════════════════════════════
    console.log("👉 Resetting/Preparing incomplete session state...");
    // By default, we delete any existing incomplete session to give you a clean slate (starts with "Start Session")
    const incSessionRef1 = doc(db, "incomplete_sessions", activeAssignmentId);
    const incSessionRef2 = doc(db, "incomplete_sessions", activeAssignmentId2);
    batch.delete(incSessionRef1);
    batch.delete(incSessionRef2);

    /* 
      💡 TIPS FOR TESTING:
      Muốn test nút "Continue Session", hãy xóa comment đoạn code bên dưới.
      Sau khi chạy seed, app sẽ tự động vào trạng thái đang tập dở (đã xong bài 1).
    */
    /*
    batch.set(incSessionRef, {
      id: activeAssignmentId,
      patientId: PATIENT_UID,
      assignmentId: activeAssignmentId,
      currentExerciseIndex: 1, // Đang ở bài 2 (Lunges)
      exercisesCompleted: 1,
      lastUpdated: Timestamp.now(),
      completedExercisesData: [
        {
          exerciseId: "ex-1",
          accuracy: 92,
          reps: 10,
          sets: 3,
          durationSeconds: 180,
        }
      ]
    }, { merge: true });
    console.log("💡 Note: Incomplete session has been pre-seeded for 'Continue Session' testing!");
    */

    // Commit everything
    await batch.commit();
    console.log("✅ SUCCESS: Test data seeded successfully for Do Kien & Dr.TuanAnh!");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERROR: FAILED TO SEED DATA:", error);
    process.exit(1);
  }
}

seed();

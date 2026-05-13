import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./config";
import {
  UserProfile,
  TreatmentPlan,
  Exercise,
  Assignment,
  Session,
  ProgressSnapshot,
  LibraryItem,
} from "./types";

const getRandomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Seed data specifically revolving around the given Doctor and Patient accounts.
 */
export const seedMockData = async () => {
  console.log("Starting data seeding for specific accounts...");

  try {
    const usersCol = collection(db, "users");

    // 1. Find the Doctor
    const doctorQuery = query(
      usersCol,
      where("email", "==", "23020032@vnu.edu.vn"),
    );
    const doctorSnapshot = await getDocs(doctorQuery);
    if (doctorSnapshot.empty) {
      console.error(
        "Doctor not found. Please make sure the account 23020032@vnu.edu.vn exists in Firestore users collection.",
      );
      return false;
    }
    const doctorData = doctorSnapshot.docs[0].data() as UserProfile;
    const doctorId = doctorData.uid || doctorSnapshot.docs[0].id;
    const doctorName = doctorData.displayName || "Mai Duy";

    // 2. Find the Patient
    const patientQuery = query(
      usersCol,
      where("email", "==", "maiducduy1@gmail.com"),
    );
    const patientSnapshot = await getDocs(patientQuery);
    if (patientSnapshot.empty) {
      console.error(
        "Patient not found. Please make sure the account maiducduy1@gmail.com exists in Firestore users collection.",
      );
      return false;
    }
    const patientData = patientSnapshot.docs[0].data() as UserProfile;
    const patientId = patientData.uid || "bemeuKYTcJURqxlTUCIvitlj4i2";
    const patientName = patientData.displayName || "Mai Zuy";

    let batch = writeBatch(db);
    let opCount = 0;

    const commitBatchIfNeeded = async () => {
      if (opCount >= 400) {
        await batch.commit();
        console.log(`Committed a batch of ${opCount} operations...`);
        batch = writeBatch(db);
        opCount = 0;
      }
    };

    const exercises: Exercise[] = [
      {
        id: "ex-1",
        name: "Squat",
        sets: 3,
        reps: 10,
        duration: "5 mins",
        icon: "barbell-outline",
        color: "#FF5733",
        category: "Lower Body",
      },
      {
        id: "ex-2",
        name: "Knee Extension",
        sets: 3,
        reps: 15,
        duration: "5 mins",
        icon: "body-outline",
        color: "#33FF57",
        category: "Lower Body",
      },
      {
        id: "ex-3",
        name: "Shoulder Press",
        sets: 3,
        reps: 12,
        duration: "7 mins",
        icon: "fitness-outline",
        color: "#3357FF",
        category: "Upper Body",
      },
      {
        id: "ex-4",
        name: "Plank",
        sets: 3,
        reps: 1,
        duration: "1 min",
        icon: "accessibility-outline",
        color: "#F333FF",
        category: "Core",
      },
      {
        id: "ex-5",
        name: "Lunges",
        sets: 3,
        reps: 10,
        duration: "5 mins",
        icon: "walk-outline",
        color: "#FFB533",
        category: "Lower Body",
      },
    ];

    // --- Create Exercises (Global) ---
    console.log("Creating global exercises...");
    for (const ex of exercises) {
      const exRef = doc(collection(db, "exercises"), ex.id);
      batch.set(exRef, ex);
      opCount++;
      await commitBatchIfNeeded();
    }

    // --- Create Exercise Templates (Doctor's Library) ---
    console.log("Creating exercise templates...");
    const templateNames = ["Phục hồi dây chằng (ACL) - Cơ bản", "Giãn cơ vai gáy", "Phục hồi sụn chêm - Tuần 1-2"];
    for (let t = 0; t < templateNames.length; t++) {
      const templateId = `template-${doctorId}-${t}`;
      const templateRef = doc(collection(db, "exercise_templates"), templateId);
      
      // Pick 2-3 random exercises for the template
      const selectedExercises = exercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);

      const templateData = {
        id: templateId,
        doctorId: doctorId,
        name: templateNames[t],
        exercises: selectedExercises,
        totalDuration: `${selectedExercises.length * 5} min`,
        patientCount: Math.floor(Math.random() * 5) + 1,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      batch.set(templateRef, templateData);
      opCount++;
      await commitBatchIfNeeded();
    }

    // --- Create Treatment Plan ---
    console.log("Creating treatment plan...");
    const planId = `plan-${patientId}`;
    const planRef = doc(collection(db, "treatment_plans"), planId);
    const planData: TreatmentPlan = {
      id: planId,
      patientId: patientId,
      doctorId: doctorId,
      condition: "Post-Op Knee Surgery Rehab",
      currentPhase: 2,
      currentWeek: 4,
      totalWeeks: 12,
      status: "on-track",
      progress: 65,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };
    batch.set(planRef, planData);
    opCount++;

    // --- Create Multiple Assignments ---
    console.log("Creating assignments...");
    const numAssignments = 5;
    for (let a = 1; a <= numAssignments; a++) {
      const assignmentId = `assignment-${patientId}-${a}`;
      const assignmentRef = doc(collection(db, "assignments"), assignmentId);

      const selectedExercises = exercises
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); // 3 random exercises

      const assignmentData: Assignment = {
        id: assignmentId,
        doctorId: doctorId,
        patientId: patientId,
        templateName: `Phục hồi khớp gối - Tuần ${a}`,
        exercises: selectedExercises,
        totalDuration: `${selectedExercises.length * 5} min`,
        status: a === numAssignments ? "active" : "completed", // Only the last one is active
        assignedAt: Timestamp.fromDate(
          getRandomDate(new Date(2025, 0, 1), new Date()),
        ),
      };
      batch.set(assignmentRef, assignmentData);
      opCount++;
      await commitBatchIfNeeded();

      // --- Create Sessions for this assignment ---
      const numSessions = a === numAssignments ? 1 : 3; // Active assignment has 1 session, completed has 3
      for (let s = 1; s <= numSessions; s++) {
        const sessionId = `session-${assignmentId}-${s}`;
        const sessionRef = doc(collection(db, "sessions"), sessionId);
        const sessionData: Session = {
          id: sessionId,
          patientId: patientId,
          assignmentId: assignmentData.id,
          exercisesCompleted: selectedExercises.length,
          completedExercises: selectedExercises.length,
          accuracy: Math.floor(Math.random() * 20) + 80, // 80 to 100
          accuracyScore: Math.floor(Math.random() * 20) + 80,
          duration: `${selectedExercises.length * 4} min`,
          totalDuration: `${selectedExercises.length * 4} min`,
          durationSeconds: selectedExercises.length * 4 * 60,
          painLevel: Math.floor(Math.random() * 3), // 0 to 2
          averagePain: Math.floor(Math.random() * 3),
          date: Timestamp.fromDate(
            getRandomDate(new Date(2026, 4, 1), new Date(2026, 4, 6)),
          ),
          reps: 10 * selectedExercises.length,
          sets: 3 * selectedExercises.length,
          // NEW: Detail view data
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Stable mock video
          doctorFeedback: s % 2 === 0 
            ? "Kỹ thuật thực hiện bài squat của bạn đã cải thiện rõ rệt, hãy chú ý giữ thẳng lưng hơn nữa nhé." 
            : null,
          doctorName: doctorName,
          reviewedAt: Timestamp.fromDate(new Date()),
          exerciseList: selectedExercises.map(ex => ex.name),
          formBreakdown: {
            "Góc khớp gối": Math.floor(Math.random() * 15) + 85,
            "Độ thẳng lưng": Math.floor(Math.random() * 20) + 75,
            "Thăng bằng": Math.floor(Math.random() * 10) + 90,
          }
        };
        batch.set(sessionRef, sessionData);
        opCount++;
        await commitBatchIfNeeded();
      }
    }

    // --- Create Progress Snapshots (Historical Data) ---
    console.log("Creating progress snapshots...");
    for (let p = 1; p <= 5; p++) {
      const snapshotId = `snapshot-${patientId}-week${p}`;
      const snapshotRef = doc(collection(db, "progress_snapshots"), snapshotId);
      const snapshotData: ProgressSnapshot = {
        id: snapshotId,
        patientId: patientId,
        movementScore: 60 + p * 5, // Incrementally getting better
        timeActiveMinutes: 30 + p * 10,
        dailyGoalPercent: 50 + p * 10,
        sessionsCompleted: 3,
        sessionsTarget: 3,
        weeklyConsistency: 70 + p * 5,
        romFlexion: 40 + p * 10,
        romExtension: 10 + p * 5,
        quadricepsStrength: 50 + p * 5,
        hamstringStability: 50 + p * 5,
        aiInsight:
          p === 5
            ? "Tuyệt vời, biên độ vận động (ROM) đang cải thiện rất tốt!"
            : "Tiếp tục duy trì bài tập.",
        date: Timestamp.fromDate(
          new Date(new Date().getTime() - (5 - p) * 7 * 24 * 60 * 60 * 1000),
        ), // Each week before today
      };
      batch.set(snapshotRef, snapshotData);
      opCount++;
      await commitBatchIfNeeded();
    }



    // --- Create Library Items (Global) ---
    console.log("Creating library items...");
    const libraryCategories: ("Videos" | "PDFs" | "Articles")[] = [
      "Videos",
      "PDFs",
      "Articles",
    ];
    for (let l = 1; l <= 6; l++) {
      const libId = `library-${l}`;
      const libRef = doc(collection(db, "library_items"), libId);
      const category = getRandomItem(libraryCategories);
      const libData: LibraryItem = {
        id: libId,
        title: `Tài liệu hướng dẫn phục hồi cơ bản ${l}`,
        description: `Đây là tài liệu ${category} hữu ích giúp theo dõi và phục hồi chức năng vận động.`,
        category: category,
        tag: getRandomItem([
          "Knee Health",
          "Instructional Video",
          "Post-Op",
          "Stretching",
        ]),
        tagColor: "#3498DB",
        createdAt: Timestamp.fromDate(new Date()),
      };
      if (category === "Videos") {
        libData.duration = `${Math.floor(Math.random() * 15) + 5} min`;
      }
      batch.set(libRef, libData);
      opCount++;
      await commitBatchIfNeeded();
    }

    // Commit any remaining operations
    if (opCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${opCount} operations.`);
    }

    console.log(
      "Mock data seeding completed successfully for specific accounts!",
    );
    return true;
  } catch (error) {
    console.error("Error in seedMockData:", error);
    return false;
  }
};

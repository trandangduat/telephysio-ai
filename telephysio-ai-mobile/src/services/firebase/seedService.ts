/**
 * seedService - Dịch vụ khởi tạo dữ liệu mẫu.
 * Cung cấp chức năng giả lập dữ liệu cho Firestore bao gồm bác sĩ, bệnh nhân, bài tập, kế hoạch và buổi tập.
 */
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
 * Khởi tạo dữ liệu mẫu xoay quanh các tài khoản Bác sĩ và Bệnh nhân đã cho.
 */
export const seedMockData = async () => {
    console.log("Starting data seeding for specific accounts...");

    try {
        const usersCol = collection(db, "users");

        // 1. Tìm Bác sĩ
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

        // 2. Tìm Bệnh nhân
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
            {
                id: "ex-6",
                name: "Side Plank",
                sets: 3,
                reps: 1,
                duration: "1 min",
                icon: "accessibility-outline",
                color: "#8B5CF6",
                category: "Core",
            },
            {
                id: "ex-7",
                name: "Calf Raises",
                sets: 3,
                reps: 15,
                duration: "4 mins",
                icon: "walk-outline",
                color: "#EC4899",
                category: "Lower Body",
            },
            {
                id: "ex-8",
                name: "Hip Abduction",
                sets: 3,
                reps: 12,
                duration: "5 mins",
                icon: "body-outline",
                color: "#14B8A6",
                category: "Lower Body",
            },
            {
                id: "ex-9",
                name: "Wall Slides",
                sets: 3,
                reps: 10,
                duration: "5 mins",
                icon: "fitness-outline",
                color: "#F97316",
                category: "Upper Body",
            },
            {
                id: "ex-10",
                name: "Step-Ups",
                sets: 3,
                reps: 10,
                duration: "6 mins",
                icon: "walk-outline",
                color: "#06B6D4",
                category: "Lower Body",
            },
            {
                id: "ex-11",
                name: "Hamstring Curl",
                sets: 3,
                reps: 12,
                duration: "5 mins",
                icon: "body-outline",
                color: "#A855F7",
                category: "Lower Body",
            },
            {
                id: "ex-12",
                name: "Glute Bridge",
                sets: 3,
                reps: 15,
                duration: "4 mins",
                icon: "accessibility-outline",
                color: "#EF4444",
                category: "Lower Body",
            },
            {
                id: "ex-13",
                name: "Bicep Curl",
                sets: 3,
                reps: 12,
                duration: "5 mins",
                icon: "barbell-outline",
                color: "#3B82F6",
                category: "Upper Body",
            },
            {
                id: "ex-14",
                name: "Tricep Dip",
                sets: 3,
                reps: 10,
                duration: "5 mins",
                icon: "fitness-outline",
                color: "#10B981",
                category: "Upper Body",
            },
            {
                id: "ex-15",
                name: "Bird Dog",
                sets: 3,
                reps: 10,
                duration: "4 mins",
                icon: "accessibility-outline",
                color: "#F59E0B",
                category: "Core",
            },
            {
                id: "ex-16",
                name: "Dead Bug",
                sets: 3,
                reps: 10,
                duration: "4 mins",
                icon: "accessibility-outline",
                color: "#6366F1",
                category: "Core",
            },
            {
                id: "ex-17",
                name: "Clamshell",
                sets: 3,
                reps: 15,
                duration: "4 mins",
                icon: "body-outline",
                color: "#D946EF",
                category: "Lower Body",
            },
            {
                id: "ex-18",
                name: "Resistance Band Pull Apart",
                sets: 3,
                reps: 15,
                duration: "5 mins",
                icon: "fitness-outline",
                color: "#0EA5E9",
                category: "Upper Body",
            },
            {
                id: "ex-19",
                name: "Wall Sit",
                sets: 3,
                reps: 1,
                duration: "30 sec",
                icon: "accessibility-outline",
                color: "#F43F5E",
                category: "Lower Body",
            },
            {
                id: "ex-20",
                name: "Scapular Squeeze",
                sets: 3,
                reps: 10,
                duration: "3 mins",
                icon: "fitness-outline",
                color: "#84CC16",
                category: "Upper Body",
            },
        ];

        // --- Tạo Bài tập (Toàn cục) ---
        console.log("Creating global exercises...");
        for (const ex of exercises) {
            const exRef = doc(collection(db, "exercises"), ex.id);
            batch.set(exRef, ex);
            opCount++;
            await commitBatchIfNeeded();
        }

        // --- Tạo Mẫu Bài tập (Thư viện của Bác sĩ) ---
        console.log("Creating exercise templates...");
        const templates = [
            {
                name: "Phục hồi dây chằng (ACL) - Cơ bản",
                exercises: [
                    exercises[0],
                    exercises[1],
                    exercises[7],
                    exercises[11],
                ],
            },
            {
                name: "Giãn cơ vai gáy",
                exercises: [exercises[2], exercises[8], exercises[19]],
            },
            {
                name: "Phục hồi sụn chêm - Tuần 1-2",
                exercises: [
                    exercises[0],
                    exercises[1],
                    exercises[6],
                    exercises[16],
                ],
            },
            {
                name: "Tăng cường cơ tứ đầu đùi",
                exercises: [
                    exercises[0],
                    exercises[1],
                    exercises[4],
                    exercises[9],
                    exercises[18],
                ],
            },
            {
                name: "Phục hồi chức năng khớp gối - Nâng cao",
                exercises: [
                    exercises[0],
                    exercises[1],
                    exercises[4],
                    exercises[6],
                    exercises[9],
                    exercises[10],
                ],
            },
            {
                name: "Bài tập Core cho người cao tuổi",
                exercises: [
                    exercises[3],
                    exercises[5],
                    exercises[14],
                    exercises[15],
                ],
            },
            {
                name: "Phục hồi sau phẫu thuật đầu gối",
                exercises: [
                    exercises[0],
                    exercises[1],
                    exercises[7],
                    exercises[6],
                    exercises[11],
                ],
            },
            {
                name: "Tăng cường sức mạnh vai",
                exercises: [
                    exercises[2],
                    exercises[8],
                    exercises[17],
                    exercises[19],
                ],
            },
            {
                name: "Bài tập cân bằng và thăng bằng",
                exercises: [
                    exercises[3],
                    exercises[5],
                    exercises[9],
                    exercises[14],
                ],
            },
            {
                name: "Phục hồi chức năng hông",
                exercises: [
                    exercises[7],
                    exercises[11],
                    exercises[16],
                    exercises[4],
                ],
            },
            {
                name: "Tăng cường tay và vai",
                exercises: [
                    exercises[12],
                    exercises[13],
                    exercises[17],
                    exercises[2],
                ],
            },
        ];
        for (let t = 0; t < templates.length; t++) {
            const templateId = `template-${doctorId}-${t}`;
            const templateRef = doc(
                collection(db, "exercise_templates"),
                templateId,
            );

            const templateData = {
                id: templateId,
                doctorId: doctorId,
                name: templates[t].name,
                exercises: templates[t].exercises,
                totalDuration: `${templates[t].exercises.length * 5} min`,
                patientCount: Math.floor(Math.random() * 5) + 1,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
            };
            batch.set(templateRef, templateData);
            opCount++;
            await commitBatchIfNeeded();
        }

        // --- Tạo Kế hoạch Điều trị ---
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

        // --- Tạo thêm bệnh nhân giả lập ---
        const additionalPatients = [
            {
                uid: "patient-nguyen-van-a",
                name: "Nguyễn Văn A",
                email: "nguyenvana@gmail.com",
                phone: "0901234567",
                dob: "1985-03-15",
                condition: "Phục hồi ACL sau phẫu thuật",
                phase: 2,
                week: 6,
                totalWeeks: 16,
                progress: 38,
            },
            {
                uid: "patient-tran-thi-b",
                name: "Trần Thị B",
                email: "tranthib@gmail.com",
                phone: "0912345678",
                dob: "1990-07-22",
                condition: "Đau vai gáy mãn tính",
                phase: 1,
                week: 3,
                totalWeeks: 8,
                progress: 35,
            },
            {
                uid: "patient-le-van-c",
                name: "Lê Văn C",
                email: "levanc@gmail.com",
                phone: "0923456789",
                dob: "1978-11-05",
                condition: "Thoái hóa khớp gối",
                phase: 3,
                week: 10,
                totalWeeks: 20,
                progress: 50,
            },
            {
                uid: "patient-pham-thi-d",
                name: "Phạm Thị D",
                email: "phamthid@gmail.com",
                phone: "0934567890",
                dob: "1995-01-30",
                condition: "Phục hồi sụn chêm",
                phase: 1,
                week: 2,
                totalWeeks: 10,
                progress: 20,
            },
            {
                uid: "patient-hoang-van-e",
                name: "Hoàng Văn E",
                email: "hoangvane@gmail.com",
                phone: "0945678901",
                dob: "1982-09-12",
                condition: "Đau lưng dưới",
                phase: 2,
                week: 5,
                totalWeeks: 12,
                progress: 42,
            },
        ];

        for (const ap of additionalPatients) {
            const apRef = doc(collection(db, "users"), ap.uid);
            batch.set(apRef, {
                uid: ap.uid,
                email: ap.email,
                displayName: ap.name,
                role: "patient",
                dateOfBirth: ap.dob,
                phone: ap.phone,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
            });
            opCount++;

            const apPlanId = `plan-${ap.uid}`;
            const apPlanRef = doc(collection(db, "treatment_plans"), apPlanId);
            batch.set(apPlanRef, {
                id: apPlanId,
                patientId: ap.uid,
                doctorId: doctorId,
                condition: ap.condition,
                currentPhase: ap.phase,
                currentWeek: ap.week,
                totalWeeks: ap.totalWeeks,
                status: "on-track",
                progress: ap.progress,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
            });
            opCount++;
        }

        // --- Tạo Nhiều Kế hoạch Được giao ---
        console.log("Creating assignments...");
        const numAssignments = 5;
        for (let a = 1; a <= numAssignments; a++) {
            const assignmentId = `assignment-${patientId}-${a}`;
            const assignmentRef = doc(
                collection(db, "assignments"),
                assignmentId,
            );

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

            // --- Tạo Buổi tập cho kế hoạch này ---
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
                    duration: selectedExercises.length * 4 * 60,
                    totalDuration: `${selectedExercises.length * 4} min`,
                    durationSeconds: selectedExercises.length * 4 * 60,
                    painLevel: Math.floor(Math.random() * 3), // 0 to 2
                    averagePain: Math.floor(Math.random() * 3),
                    date: Timestamp.fromDate(
                        getRandomDate(
                            new Date(2026, 4, 1),
                            new Date(2026, 4, 6),
                        ),
                    ),
                    reps: 10 * selectedExercises.length,
                    // NEW: Detail view data
                    videoUrl:
                        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Stable mock video
                    doctorFeedback:
                        s % 2 === 0
                            ? "Kỹ thuật thực hiện bài squat của bạn đã cải thiện rõ rệt, hãy chú ý giữ thẳng lưng hơn nữa nhé."
                            : null,
                    doctorName: doctorName,
                    reviewedAt: Timestamp.fromDate(new Date()),
                    exerciseList: selectedExercises.map((ex) => ex.name),
                    formBreakdown: {
                        "Góc khớp gối": Math.floor(Math.random() * 15) + 85,
                        "Độ thẳng lưng": Math.floor(Math.random() * 20) + 75,
                        "Thăng bằng": Math.floor(Math.random() * 10) + 90,
                    },
                };
                batch.set(sessionRef, sessionData);
                opCount++;
                await commitBatchIfNeeded();
            }
        }

        // --- Tạo Tiến độ Tóm tắt (Dữ liệu Lịch sử) ---
        console.log("Creating progress snapshots...");
        for (let p = 1; p <= 5; p++) {
            const snapshotId = `snapshot-${patientId}-week${p}`;
            const snapshotRef = doc(
                collection(db, "progress_snapshots"),
                snapshotId,
            );
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
                    new Date(
                        new Date().getTime() -
                            (5 - p) * 7 * 24 * 60 * 60 * 1000,
                    ),
                ), // Each week before today
            };
            batch.set(snapshotRef, snapshotData);
            opCount++;
            await commitBatchIfNeeded();
        }

        // --- Tạo Tài liệu Thư viện (Toàn cục) ---
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

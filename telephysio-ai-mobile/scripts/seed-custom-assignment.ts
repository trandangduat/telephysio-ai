/**
 * @file seed-custom-assignment.ts
 * @description Description of seed-custom-assignment.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/services/firebase/config';

/**
 * Description of seedAssignment
 * @returns Description of return value
 */
async function seedAssignment() {
  console.log("🚀 Starting to seed custom assignment...");
  
  try {
    const doctorId = 'aKUXP4XnuPRuII2YYeWjIkFbfs82';
    const patientId = 'bemeuKYTcJURqxItTUCIvitIj4i2';
    
    // Seed the doctor profile so it exists in 'users'
    await setDoc(doc(db, 'users', doctorId), {
      uid: doctorId,
      displayName: 'Tuan Anh',
      email: 'doctor@telephysio.ai',
      role: 'doctor',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Seed the patient profile so they appear in validProfiles on Dashboard
    await setDoc(doc(db, 'users', patientId), {
      uid: patientId,
      displayName: 'Zuy test',
      email: 'maiducduy1@gmail.com',
      role: 'patient',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const mockExercises = [
      {
        id: 'ex-squat',
        name: 'Bodyweight Squats',
        sets: 3,
        reps: 10,
        duration: '5 mins',
        icon: 'body-outline',
        color: '#4ADE80',
        description: 'Keep back straight and go down until thighs are parallel to the floor.',
        category: 'Lower Body',
        difficulty: 'medium',
        restBetweenSets: 60,
      },
      {
        id: 'ex-lunge',
        name: 'Forward Lunges',
        sets: 3,
        reps: 12,
        duration: '5 mins',
        icon: 'walk-outline',
        color: '#F472B6',
        description: 'Step forward and lower your hips until both knees are bent at a 90-degree angle.',
        category: 'Lower Body',
        difficulty: 'medium',
        restBetweenSets: 60,
      }
    ];

    const assignmentRef = await addDoc(collection(db, 'assignments'), {
      doctorId,
      patientId,
      templateName: 'Knee Recovery - Phase 1',
      exercises: mockExercises,
      totalDuration: '10 min',
      status: 'active',
      assignedAt: serverTimestamp(),
    });

    console.log(`✅ SUCCESS: Created assignment ${assignmentRef.id} for Doctor ${doctorId} and Patient ${patientId}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: FAILED TO SEED DATA:", error);
    process.exit(1);
  }
}

seedAssignment();

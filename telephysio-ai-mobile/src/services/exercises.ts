import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { Exercise } from '../types';

/**
 * Default exercise library.
 * Will be seeded to Firestore on first run if collection is empty.
 */
export const EXERCISE_LIBRARY: Omit<Exercise, 'id'>[] = [
  {
    name: 'Bicep Curl',
    description: 'A fundamental exercise to strengthen the biceps and aid in elbow joint rehabilitation.',
    bodyPart: 'arm',
    targetReps: 12,
    sets: 3,
    difficulty: 'easy',
    instructions: [
      'Stand upright, hold dumbbells or water bottles at your sides',
      'Curl your forearms up toward your shoulders, hold for 1 second',
      'Slowly lower back down over 3 seconds',
      'Keep your back straight throughout the movement',
    ],
    tags: ['arm', 'elbow', 'strength'],
  },
  {
    name: 'Straight Leg Raise',
    description: 'Strengthens the quadriceps and supports knee joint recovery.',
    bodyPart: 'knee',
    targetReps: 10,
    sets: 3,
    difficulty: 'easy',
    instructions: [
      'Lie on your back, one knee bent, the other leg straight',
      'Lift the straight leg to about 45 degrees',
      'Hold for 2 seconds, then slowly lower',
      'Alternate legs after each set',
    ],
    tags: ['knee', 'quadriceps', 'rehabilitation'],
  },
  {
    name: 'Shoulder Circle',
    description: 'Restores shoulder range of motion and reduces muscle tension.',
    bodyPart: 'shoulder',
    targetReps: 15,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 30,
    instructions: [
      'Stand tall with shoulders relaxed',
      'Roll both shoulders in large, slow backward circles',
      'Move slowly and smoothly',
      'Reverse direction after 10 rotations',
    ],
    tags: ['shoulder', 'flexibility', 'rotation'],
  },
  {
    name: 'Squat',
    description: 'Strengthens the legs and rehabilitates knee and hip joint function.',
    bodyPart: 'knee',
    targetReps: 10,
    sets: 3,
    difficulty: 'medium',
    instructions: [
      'Stand with feet shoulder-width apart, toes slightly turned out',
      'Slowly lower your hips as if sitting into a chair',
      'Keep your back straight, knees behind your toes',
      'Push up through your heels to return to standing',
    ],
    tags: ['knee', 'hip', 'quadriceps', 'strength'],
  },
  {
    name: 'Lower Back Stretch',
    description: 'Relieves lower back pain and improves lumbar spine mobility.',
    bodyPart: 'back',
    targetReps: 8,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 20,
    instructions: [
      'Lie on your back with both knees bent',
      'Gently pull both knees toward your chest',
      'Hug your knees and hold for 20 seconds',
      'Breathe steadily and let your lower back relax',
    ],
    tags: ['back', 'lumbar', 'flexibility', 'stretching'],
  },
  {
    name: 'Lateral Band Walk',
    description: 'Strengthens the glutes and stabilizes the hip joint.',
    bodyPart: 'hip',
    targetReps: 12,
    sets: 3,
    difficulty: 'medium',
    instructions: [
      'Place a resistance band just above your ankles',
      'Stand upright with hands on hips',
      'Step sideways 12 steps, then return in the opposite direction',
      'Keep knees slightly bent and back straight',
    ],
    tags: ['hip', 'glutes', 'lateral', 'strength'],
  },
  {
    name: 'Single-Leg Balance',
    description: 'Improves balance and ankle joint stability.',
    bodyPart: 'ankle',
    targetReps: 3,
    sets: 2,
    difficulty: 'medium',
    durationSeconds: 30,
    instructions: [
      'Stand near a wall or chair for support if needed',
      'Lift one foot off the ground',
      'Hold your balance for 30 seconds',
      'Switch legs and repeat',
    ],
    tags: ['ankle', 'balance', 'proprioception'],
  },
  {
    name: 'Chest & Front Shoulder Stretch',
    description: 'Releases chest tightness and improves posture.',
    bodyPart: 'shoulder',
    targetReps: 5,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 25,
    instructions: [
      'Stand in a doorway or beside a wall',
      'Place your hand on the frame at shoulder height',
      'Slowly lean forward until you feel a stretch in your chest',
      'Hold for 25 seconds and breathe deeply',
    ],
    tags: ['shoulder', 'chest', 'flexibility', 'posture'],
  },
];

/**
 * Seed exercise data to Firestore if not already present.
 */
export async function seedExercises(): Promise<void> {
  // Check if seed already done
  const checkSnap = await getDoc(doc(db, 'meta', 'seed'));
  if (checkSnap.exists() && checkSnap.data()?.exercisesSeedDone) {
    return;
  }

  // Seed exercises
  const exercisesCol = collection(db, 'exercises');
  for (const ex of EXERCISE_LIBRARY) {
    await setDoc(doc(exercisesCol), ex);
  }

  // Mark as done
  await setDoc(doc(db, 'meta', 'seed'), { exercisesSeedDone: true });
  console.log('[TelePhysioAI] Exercise library seeded to Firestore.');
}

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { Exercise } from '../types';

/**
 * Default exercise library.
 * Will be seeded to Firestore on first run if collection is empty.
 */
export const EXERCISE_LIBRARY: Omit<Exercise, 'id'>[] = [
  {
    name: 'Gập khuỷu tay',
    description: 'Bài tập cơ bản giúp tăng cường sức mạnh cơ nhị đầu và phục hồi khớp khuỷu.',
    bodyPart: 'arm',
    targetReps: 12,
    sets: 3,
    difficulty: 'easy',
    instructions: [
      'Đứng thẳng, hai tay cầm tạ hoặc chai nước',
      'Gập khuỷu tay lên đến vai, giữ 1 giây',
      'Từ từ hạ xuống trong 3 giây',
      'Giữ lưng thẳng trong suốt bài tập',
    ],
    tags: ['arm', 'elbow', 'strength'],
  },
  {
    name: 'Nâng chân thẳng',
    description: 'Tăng cường cơ đùi trước và phục hồi chức năng khớp gối.',
    bodyPart: 'knee',
    targetReps: 10,
    sets: 3,
    difficulty: 'easy',
    instructions: [
      'Nằm ngửa trên sàn, một chân co, một chân thẳng',
      'Nâng chân thẳng lên cao 45 độ',
      'Giữ 2 giây rồi từ từ hạ xuống',
      'Đổi chân sau mỗi set',
    ],
    tags: ['knee', 'quadriceps', 'rehabilitation'],
  },
  {
    name: 'Xoay vai',
    description: 'Phục hồi biên độ chuyển động khớp vai và giảm căng cơ.',
    bodyPart: 'shoulder',
    targetReps: 15,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 30,
    instructions: [
      'Đứng thẳng, thả lỏng vai',
      'Xoay vai từ trước ra sau thành vòng tròn lớn',
      'Thực hiện chậm và đều đặn',
      'Đổi hướng xoay sau 10 lần',
    ],
    tags: ['shoulder', 'flexibility', 'rotation'],
  },
  {
    name: 'Ngồi xổm (Squat)',
    description: 'Tăng cường cơ chân và phục hồi chức năng khớp gối, hông.',
    bodyPart: 'knee',
    targetReps: 10,
    sets: 3,
    difficulty: 'medium',
    instructions: [
      'Đứng hai chân rộng bằng vai, mũi chân hướng ra ngoài nhẹ',
      'Từ từ hạ người xuống như ngồi vào ghế',
      'Giữ lưng thẳng, gối không vượt quá mũi chân',
      'Đẩy người lên qua gót chân',
    ],
    tags: ['knee', 'hip', 'quadriceps', 'strength'],
  },
  {
    name: 'Căng cơ lưng dưới',
    description: 'Giảm đau lưng và tăng tính linh hoạt của cột sống thắt lưng.',
    bodyPart: 'back',
    targetReps: 8,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 20,
    instructions: [
      'Nằm ngửa, hai đầu gối co lại',
      'Kéo hai đầu gối về phía ngực',
      'Ôm đầu gối và giữ 20 giây',
      'Thở đều và thư giãn lưng',
    ],
    tags: ['back', 'lumbar', 'flexibility', 'stretching'],
  },
  {
    name: 'Bước bên với dải kháng lực',
    description: 'Tăng cường cơ mông và ổn định khớp hông.',
    bodyPart: 'hip',
    targetReps: 12,
    sets: 3,
    difficulty: 'medium',
    instructions: [
      'Đeo dải kháng lực ở đoạn trên cổ chân',
      'Đứng thẳng, tay chống hông',
      'Bước sang ngang 12 bước, rồi bước ngược lại',
      'Giữ gối hơi co, lưng thẳng',
    ],
    tags: ['hip', 'glutes', 'lateral', 'strength'],
  },
  {
    name: 'Giữ thăng bằng một chân',
    description: 'Cải thiện thăng bằng và ổn định cổ chân.',
    bodyPart: 'ankle',
    targetReps: 3,
    sets: 2,
    difficulty: 'medium',
    durationSeconds: 30,
    instructions: [
      'Đứng gần tường hoặc ghế để hỗ trợ nếu cần',
      'Nâng một chân lên khỏi mặt đất',
      'Giữ thăng bằng 30 giây',
      'Đổi chân và lặp lại',
    ],
    tags: ['ankle', 'balance', 'proprioception'],
  },
  {
    name: 'Căng cơ ngực & vai trước',
    description: 'Giảm căng cứng cơ ngực và cải thiện tư thế.',
    bodyPart: 'shoulder',
    targetReps: 5,
    sets: 2,
    difficulty: 'easy',
    durationSeconds: 25,
    instructions: [
      'Đứng trong khung cửa hoặc cạnh tường',
      'Đặt tay lên khung ở độ cao vai',
      'Từ từ nghiêng người về phía trước',
      'Giữ 25 giây, cảm nhận cơ ngực giãn ra',
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

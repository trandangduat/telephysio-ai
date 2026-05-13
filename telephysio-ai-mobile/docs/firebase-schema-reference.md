# Firestore Schema Reference

Tài liệu này lưu trữ chi tiết cấu trúc các Collections và Documents hiện tại trong Firestore để tham chiếu trong quá trình phát triển.

---

## 1. Users (Người dùng)

### Patient (Bệnh nhân)
- **Collection:** `users`
- **Document ID:** `FN285ox2PYgBoCOfoObBGZTpNZh1` (UID)
```json
{
  "uid": "FN285ox2PYgBoCOfoObBGZTpNZh1",
  "displayName": "Do Kien",
  "email": "linh@gmail.com",
  "role": "patient",
  "createdAt": "May 13, 2026 at 11:39:58 AM UTC+7 (timestamp)",
  "updatedAt": "May 13, 2026 at 11:39:58 AM UTC+7 (timestamp)"
}
```

### Doctor (Bác sĩ)
- **Collection:** `users`
- **Document ID:** `7TENJnJy1gTIZQ9QJySrpEJe3kl2` (UID)
```json
{
  "uid": "7TENJnJy1gTIZQ9QJySrpEJe3kl2",
  "displayName": "Dr.TuanAnh",
  "email": "ta@gmail.com",
  "role": "doctor",
  "dateOfBirth": "17/10/2005",
  "phone": "01234345",
  "createdAt": "May 12, 2026 at 1:02:21 PM UTC+7 (timestamp)",
  "updatedAt": "May 12, 2026 at 2:51:31 PM UTC+7 (timestamp)"
}
```

---

## 2. Assignments (Nhiệm vụ tập luyện)
- **Collection:** `assignments`
- **Document ID:** Ví dụ: `3W7EYuQQwaJYX9ZSqgNs`
```json
{
  "patientId": "bemeuKYTcJURqxItTUCIvitIj4i2",
  "doctorId": "aKUXP4XnuPRuII2YYeWjIkFbfs82",
  "status": "completed",
  "templateName": "Phục hồi dây chằng (ACL) - Cơ bản",
  "totalDuration": "15 min",
  "assignedAt": "May 6, 2026 at 10:49:12 PM UTC+7 (timestamp)",
  "completedAt": "May 6, 2026 at 11:25:47 PM UTC+7 (timestamp)",
  "exercises": [
    {
      "id": "ex-5",
      "name": "Lunges",
      "category": "Lower Body",
      "color": "#FFB533",
      "icon": "walk-outline",
      "duration": "5 mins",
      "reps": 10,
      "sets": 3
    },
    {
      "id": "ex-4",
      "name": "Plank",
      "category": "Core",
      "color": "#F333FF",
      "icon": "accessibility-outline",
      "duration": "1 min",
      "reps": 1,
      "sets": 3
    },
    {
      "id": "ex-3",
      "name": "Shoulder Press",
      "category": "Upper Body",
      "color": "#3357FF",
      "icon": "fitness-outline",
      "duration": "7 mins",
      "reps": 12,
      "sets": 3
    }
  ]
}
```

---

## 3. Sessions (Buổi tập đã hoàn thành)
- **Collection:** `sessions`
- **Document ID:** Ví dụ: `session-assignment-bemeuKYTcJURqxItTUCIvitIj4i2-1-2`
```json
{
  "id": "session-assignment-bemeuKYTcJURqxItTUCIvitIj4i2-1-2",
  "patientId": "bemeuKYTcJURqxItTUCIvitIj4i2",
  "assignmentId": "assignment-bemeuKYTcJURqxItTUCIvitIj4i2-1",
  "date": "May 4, 2026 at 8:39:32 PM UTC+7 (timestamp)",
  "accuracy": 83,
  "accuracyScore": 90,
  "duration": "12 min",
  "totalDuration": "12 min",
  "durationSeconds": 720,
  "painLevel": 2,
  "averagePain": 2,
  "reps": 30,
  "sets": 9,
  "exercisesCompleted": 3,
  "completedExercises": 3,
  "exerciseList": ["Squat", "Lunges", "Shoulder Press"],
  "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
  "doctorName": "Mai Duy",
  "doctorFeedback": "Kỹ thuật thực hiện bài squat của bạn đã cải thiện rõ rệt, hãy chú ý giữ thẳng lưng hơn nữa nhé.",
  "reviewedAt": "May 6, 2026 at 10:25:20 PM UTC+7 (timestamp)",
  "formBreakdown": {
    "Góc khớp gối": 94,
    "Thăng bằng": 98,
    "Độ thẳng lưng": 79
  }
}
```

---

## 4. Exercise Templates (Mẫu bài tập)
- **Collection:** `exercise_templates`
- **Document ID:** Ví dụ: `EDLdoN69UX8TJzzlIRjo`
```json
{
  "name": "kakaka",
  "description": "kakakkaka",
  "doctorId": "aKUXP4XnuPRuII2YYeWjIkFbfs82",
  "patientCount": 0,
  "totalDuration": "36 min",
  "createdAt": "May 6, 2026 at 8:36:42 PM UTC+7 (timestamp)",
  "updatedAt": "May 6, 2026 at 8:36:42 PM UTC+7 (timestamp)",
  "exercises": [
    {
      "id": "ex-1778074556729",
      "name": "Squat",
      "category": "Lower Body",
      "color": "#FF5733",
      "difficulty": "medium",
      "icon": "barbell-outline",
      "duration": "6 mins",
      "reps": 10,
      "sets": 3,
      "restBetweenSets": 60,
      "notes": ""
    },
    {
      "id": "ex-1778074577209",
      "name": "Knee Extension",
      "category": "Lower Body",
      "color": "#33FF57",
      "difficulty": "medium",
      "icon": "body-outline",
      "duration": "6 mins",
      "reps": 15,
      "sets": 3,
      "restBetweenSets": 90,
      "notes": ""
    }
  ]
}
```

---

## 5. Treatment Plans (Phác đồ điều trị tổng thể)
- **Collection:** `treatment_plans`
- **Document ID:** `plan-bemeuKYTcJURqxItTUCIvitIj4i2`
```json
{
  "id": "plan-bemeuKYTcJURqxItTUCIvitIj4i2",
  "patientId": "bemeuKYTcJURqxItTUCIvitIj4i2",
  "doctorId": "aKUXP4XnuPRuII2YYeWjIkFbfs82",
  "condition": "Post-Op Knee Surgery Rehab",
  "status": "on-track",
  "progress": 65,
  "currentPhase": 2,
  "currentWeek": 4,
  "totalWeeks": 12,
  "createdAt": "May 6, 2026 at 10:25:20 PM UTC+7 (timestamp)",
  "updatedAt": "May 6, 2026 at 10:25:20 PM UTC+7 (timestamp)"
}
```

---

## 6. Exercise Feedback (Đánh giá từ bệnh nhân)
- **Collection:** `exercise_feedback`
- **Document ID:** Ví dụ: `HAIE4nashtyAmVuJPrVO`
```json
{
  "patientId": "bemeuKYTcJURqxItTUCIvitIj4i2",
  "sessionId": "28tIthKmXeAgSQz5eG34",
  "exerciseName": "Physical Therapy Session",
  "difficulty": "medium",
  "painLevel": 5,
  "notes": "",
  "createdAt": "May 6, 2026 at 8:39:14 PM UTC+7 (timestamp)"
}
```

---

## 7. Exercises Global (Thư viện bài tập gốc)
- **Collection:** `exercises`
- **Document ID:** `ex-1`
```json
{
  "id": "ex-1",
  "name": "Squat",
  "category": "Lower Body",
  "color": "#FF5733",
  "icon": "barbell-outline",
  "duration": "5 mins",
  "reps": 10,
  "sets": 3
}
```

---

## 8. Incomplete Sessions (Buổi tập dở dang)
- **Collection:** `incomplete_sessions`
- **Document ID:** Ví dụ: `3W7EYuQQwaJYX9ZSqgNs` (Thường dùng Document ID trùng khớp với `assignmentId`)
```json
{
  "id": "assignment-FN285ox2PYgBoCOfoObBGZTpNZh1-active",
  "patientId": "FN285ox2PYgBoCOfoObBGZTpNZh1",
  "assignmentId": "assignment-FN285ox2PYgBoCOfoObBGZTpNZh1-active",
  "currentExerciseIndex": 1,
  "exercisesCompleted": 1,
  "lastUpdated": "May 13, 2026 at 11:40:00 AM UTC+7 (timestamp)",
  "completedExercisesData": [
    {
      "exerciseId": "ex-1",
      "accuracy": 92,
      "reps": 10,
      "sets": 3,
      "durationSeconds": 300
    }
  ]
}
```


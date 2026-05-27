# Plan: Cải thiện Patient-Side Screens

## Tổng quan

4 thay đổi để cải thiện trải nghiệm bệnh nhân và loại bỏ thông tin gây hiểu lầm về AI.

---

## 1. Sửa text SessionScreen: "AI" → "Bác sĩ"

**File:** `src/screens/Feedback/SessionScreen.tsx`

**Thay đổi:**

| Line | Hiện tại                                  | Sửa thành                                    |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 129  | "help our AI adjust your recovery plan"   | "help your doctor adjust your recovery plan" |
| 202  | "our AI to differentiate between..."      | "your doctor to differentiate between..."    |
| 213  | "help your AI therapist adjust your plan" | "help your doctor adjust your plan"          |

**Lý do:** Không có logic AI auto-adjust trong code. Tác vụ gốc #6 chỉ nói về "Gửi và nhận phản hồi chuyên môn" giữa bệnh nhân và bác sĩ.

---

## 2. Đổi tên tab "Feedback" → "Sessions"

**Files cần sửa:**

### `src/navigation/BottomTabNavigator.tsx`

- Line 28: Icon `stats-chart` → `checkmark-circle`
- Line 80-84: `title: t('tabs.feedback', 'Feedback')` → `title: t('tabs.sessions', 'Sessions')`

### `src/navigation/types.ts`

- Line 23: `Feedback: undefined` → `Sessions: undefined`

### `src/screens/Feedback/SessionScreen.tsx`

- Line 127: Title "Exercise Feedback List" → "Session History"
- Line 128-130: Subtitle cập nhật lại cho phù hợp

### `src/screens/Home/HomeScreen.tsx`, `src/screens/Workout/WorkoutScreen.tsx`, etc.

- Các navigate calls `'Feedback'` → `'Sessions'`

**Lý do:** Tab này hiển thị lịch sử sessions + feedback form. "Sessions" phản ánh đúng chức năng hơn.

---

## 3. Nâng cấp WorkoutScreen

**File:** `src/screens/Workout/WorkoutScreen.tsx`

**Thay đổi:**

### 3a. Hiển thị thông tin assignment

- Thêm state cho assignment object (không chỉ exercises)
- Hiển thị tên template (`assignment.templateName`)
- Hiển thị tổng thời gian (`assignment.totalDuration`)
- Hiển thị số bài tập

### 3b. Hiển thị chi tiết bài tập

- Thêm difficulty badge (Easy/Medium/Hard)
- Hiển thị ghi chú của bác sĩ (`exercise.notes`)
- Hiển thị rest time (`exercise.restBetweenSets`)

### 3c. Thêm nút "View All Assignments"

- Nút ở dưới danh sách exercises
- Navigate đến MyAssignmentsScreen (mới)

**UI Layout mới:**

```
┌─────────────────────────────────────┐
│ Today's Routine                     │
│ ACL Recovery - Phase 2              │
│ Assigned by Dr. Sarah • 3 exercises │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🏋️ Squat          [Medium]     │ │
│ │ 3 sets × 10 reps • 5 mins      │ │
│ │ Rest: 60s between sets          │ │
│ │ 📝 Keep back straight...        │ │
│ │ [Start Exercise]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Assignments →]            │
└─────────────────────────────────────┘
```

---

## 4. Tạo MyAssignmentsScreen (mới)

**File:** `src/screens/Workout/MyAssignmentsScreen.tsx`

**Chức năng:**

- Hiển thị TẤT CẢ assignments (active + completed)
- Mỗi card hiển thị: template name, doctor name, ngày giao, status, số exercises
- Badge trạng thái: Active (xanh), Completed (xám), Paused (vàng)
- Tap vào assignment → xem chi tiết exercises

**Navigation:**

- Thêm route `MyAssignments` vào `RootStackParamList`
- Register trong `AppNavigator.tsx`

**UI Layout:**

```
┌─────────────────────────────────────┐
│ ← My Assignments                    │
├─────────────────────────────────────┤
│ [Active]                            │
│ ┌─────────────────────────────────┐ │
│ │ ACL Recovery - Phase 2          │ │
│ │ Dr. Sarah Nguyen                │ │
│ │ 3 exercises • 15 min            │ │
│ │ Assigned: May 1, 2026           │ │
│ │ [● Active]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Completed]                         │
│ ┌─────────────────────────────────┐ │
│ │ Post-Op Knee Flexion            │ │
│ │ Dr. Sarah Nguyen                │ │
│ │ 5 exercises • 25 min            │ │
│ │ Completed: Apr 28, 2026         │ │
│ │ [✓ Completed]                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Files tổng hợp

### Tạo mới:

- `src/screens/Workout/MyAssignmentsScreen.tsx`

### Sửa:

- `src/screens/Feedback/SessionScreen.tsx` (text AI → doctor, title)
- `src/screens/Workout/WorkoutScreen.tsx` (enhanced UI)
- `src/navigation/BottomTabNavigator.tsx` (rename tab, icon)
- `src/navigation/types.ts` (rename Feedback → Sessions, thêm MyAssignments)
- `src/navigation/AppNavigator.tsx` (register MyAssignmentsScreen)

---

## Ưu tiên thực hiện

1. Sửa text SessionScreen (5 phút)
2. Đổi tên tab (10 phút)
3. Nâng cấp WorkoutScreen (30 phút)
4. Tạo MyAssignmentsScreen (45 phút)

**Tổng thời gian ước tính:** ~1.5 giờ

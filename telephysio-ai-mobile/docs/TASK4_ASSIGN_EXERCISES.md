# Task 4: Giao bài tập (Assign Exercises) - Triển khai

**Ngày:** 2026-05-04
**Trạng thái:** Hoàn thành

---

## 1. Mục tiêu

Cho phép Bác sĩ (Doctor) có thể:
- Tạo template bài tập mới
- Sửa template hiện có
- Cấu hình chi tiết bài tập (sets, reps, difficulty, rest time)
- Chọn bệnh nhân từ danh sách
- Giao template cho bệnh nhân

**Ràng buộc:** Luồng thao tác dưới 2 phút cho 1 bệnh nhân.

---

## 2. Files đã tạo mới

| File | Mô tả |
|------|-------|
| `src/screens/Doctor/TemplateEditorScreen.tsx` | Màn hình tạo/sửa template bài tập |
| `src/screens/Doctor/AssignTemplateScreen.tsx` | Màn hình giao bài cho bệnh nhân |
| `src/screens/Doctor/components/ExerciseCard.tsx` | Component hiển thị bài tập trong template |
| `src/screens/Doctor/components/ExercisePickerSheet.tsx` | Bottom sheet chọn bài tập từ library |
| `src/screens/Doctor/components/ExerciseConfigSheet.tsx` | Bottom sheet cấu hình sets/reps/difficulty |

---

## 3. Files đã cập nhật

| File | Thay đổi |
|------|----------|
| `src/services/firebase/types.ts` | Thêm `ExerciseDifficulty` type, thêm fields `difficulty`, `restBetweenSets`, `notes` cho Exercise; thêm `description`, `updatedAt` cho ExerciseTemplate |
| `src/services/firebase/assignmentService.ts` | Thêm functions `updateExerciseTemplate`, `deleteExerciseTemplate`, `getGlobalExercises` |
| `src/services/firebase/index.ts` | Export các types và functions mới |
| `src/navigation/types.ts` | Thêm routes `TemplateEditor`, `AssignTemplate` vào `DoctorStackParamList` |
| `src/navigation/AppNavigator.tsx` | Register 2 screens mới vào DoctorStack |
| `src/screens/Doctor/DoctorAssignmentsScreen.tsx` | Navigation đến screens mới, thêm delete template, auto-refresh on focus |

---

## 4. Luồng hoạt động (User Flow)

```
DoctorAssignments Screen
  │
  ├── [Create New Template] ──→ TemplateEditorScreen (new)
  │       ├── [Add Exercise] ──→ ExercisePickerSheet ──→ ExerciseConfigSheet
  │       └── [Save] ──→ createExerciseTemplate()
  │
  ├── [Edit] ──→ TemplateEditorScreen (edit)
  │       ├── [Add/Remove Exercise]
  │       └── [Save] ──→ updateExerciseTemplate()
  │
  ├── [Assign] ──→ AssignTemplateScreen
  │       ├── Select Patient
  │       └── [Assign Template] ──→ createAssignment()
  │
  └── [Delete] ──→ Confirm Alert ──→ deleteExerciseTemplate()
```

---

## 5. Chi tiết từng Screen

### 5.1. TemplateEditorScreen

**Chức năng:**
- Nhập tên template và mô tả
- Thêm/xóa bài tập từ exercise library
- Cấu hình chi tiết cho từng bài tập (sets, reps, difficulty, rest, notes)
- Tính tổng thời gian tự động
- Lưu template mới hoặc cập nhật template hiện có

**Props/Params:**
```typescript
templateId?: string  // Nếu có → edit mode, nếu không → create mode
```

### 5.2. AssignTemplateScreen

**Chức năng:**
- Hiển thị thông tin template đang chọn
- Tìm kiếm và chọn bệnh nhân
- Xác nhận giao bài
- Tạo assignment mới trong Firebase

**Props/Params:**
```typescript
templateId: string
templateName: string
```

### 5.3. ExercisePickerSheet

**Chức năng:**
- Modal bottom sheet
- Tìm kiếm bài tập theo tên
- Lọc theo category (All, Lower Body, Upper Body, Core)
- Loại trừ bài tập đã thêm trong template

### 5.4. ExerciseConfigSheet

**Chức năng:**
- Điều chỉnh số sets (1-10)
- Điều chỉnh số reps (1-50)
- Chọn difficulty (Easy, Medium, Hard)
- Chọn thời gian nghỉ giữa sets (30s, 60s, 90s, 120s)
- Ghi chú cho bài tập

### 5.5. ExerciseCard

**Chức năng:**
- Hiển thị thông tin bài tập (tên, sets, reps, category, difficulty)
- Nút xóa bài tập khỏi template

---

## 6. Thay đổi Data Model

### Exercise (cập nhật)

```typescript
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  // ... existing fields
  difficulty?: ExerciseDifficulty;  // NEW
  restBetweenSets?: number;         // NEW: seconds
  notes?: string;                   // NEW: doctor's notes
}
```

### ExerciseTemplate (cập nhật)

```typescript
export interface ExerciseTemplate {
  // ... existing fields
  description?: string;   // NEW
  updatedAt?: Timestamp;  // NEW
}
```

---

## 7. Firebase Services mới

### updateExerciseTemplate
```typescript
export async function updateExerciseTemplate(
  templateId: string,
  data: Partial<Pick<ExerciseTemplate, 'name' | 'description' | 'exercises' | 'totalDuration'>>
): Promise<void>
```

### deleteExerciseTemplate
```typescript
export async function deleteExerciseTemplate(templateId: string): Promise<void>
```

### getGlobalExercises
```typescript
export async function getGlobalExercises(): Promise<Exercise[]>
```

---

## 8. Cách chạy thử

1. Đăng nhập với tài khoản Doctor
2. Vào tab **Assignments**
3. Nhấn **Create New Template**
4. Điền tên template, thêm exercises, cấu hình
5. Nhấn **Save**
6. Quay lại, nhấn **Assign** trên template vừa tạo
7. Chọn bệnh nhân và nhấn **Assign Template**

---

## 9. Lưu ý kỹ thuật

- `DoctorAssignmentsScreen` tự động refresh khi focus (sau khi quay lại từ editor)
- `ExercisePickerSheet` tự động load exercises từ Firebase khi mở
- `ExerciseConfigSheet` reset state khi nhận exercise mới
- Navigation types đã được cập nhật để hỗ trợ params mới

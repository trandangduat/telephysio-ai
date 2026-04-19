# Hướng dẫn Kết nối Dịch vụ Firebase

Ứng dụng này sử dụng Firebase như một Backend-as-a-Service (BaaS) nhằm phục vụ các tính năng chính:
- **Authentication**: Đăng nhập/Đăng ký dành cho Bác sĩ và Bệnh nhân.
- **Firestore (Realtime Database)**: Lưu trữ và đồng bộ hóa Phác đồ tập, lịch sử luyện tập, và kết quả phân tích góc khớp.
- **Storage**: Lưu trữ ảnh/video hồ sơ, video hướng dẫn bài tập.

## Các bước cấu hình Firebase (Firebase Setup)

### 1. Tạo Project trên Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Đăng nhập và nhấn **Add project**.
3. Điền tên dự án (ví dụ: `telephysio-ai`). Chọn tắt Google Analytics (có thể bật sau).
4. Nhấn **Create project**.

### 2. Thêm Ứng dụng Web vào Project
(Trong Expo React Native, ứng dụng hiện dùng Firebase JavaScript SDK).
1. Tại Dashboard của dự án Firebase, chọn biểu tượng **Web** `</>`.
2. Đặt tên ứng dụng (VD: `telephysio-ai-mobile-app`).
3. Click **Register app** và sao chép cấu hình Firebase (`firebaseConfig`).

### 3. Tích hợp vào dự án React Native
Tạo file cấu hình tại `telephysio-ai-mobile/src/services/firebase/config.ts`:

```typescript
// telephysio-ai-mobile/src/services/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Dán cấu hình Firebase của bạn vào đây.
// Với Expo SDK 55, ưu tiên truyền qua EXPO_PUBLIC_* thay vì hardcode trực tiếp.
const firebaseConfig = {
  apiKey: "API_KEY_CỦA_BẠN",
  authDomain: "telephysio-ai-xxxx.firebaseapp.com",
  projectId: "telephysio-ai-xxxx",
  storageBucket: "telephysio-ai-xxxx.firebasestorage.app",
  messagingSenderId: "MESSAGING_SENDER_ID",
  appId: "APP_ID",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất các dịch vụ để sử dụng
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 4. Thiết lập Authentication (Đăng nhập)
1. Trong Firebase Console, vào mục **Authentication** > **Get Started**.
2. Chọn tab **Sign-in method**, bật **Email/Password**.

### 5. Thiết lập Cloud Firestore (Cơ sở dữ liệu)
1. Trong Firebase Console, vào mục **Firestore Database** > **Create database**.
2. Bắt đầu ở **Test mode** (chế độ thử nghiệm để dễ lập trình ban đầu) hoặc **Production mode** (chế độ sản xuất).
3. Sau khi tạo xong, vào tab **Rules** và cập nhật quyền đọc/ghi bảo mật cơ bản (chỉ cho phép user đã đăng nhập):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. Các collection chính dự kiến: `users` (bệnh nhân/bác sĩ), `exercises` (bài tập), `sessions` (lịch sử tập).

### 6. Ẩn API Key (Bảo mật)
Không nên hardcode `firebaseConfig` vào mã nguồn trực tiếp khi push lên GitHub.
Hãy sử dụng biến môi trường:
1. Tạo file `.env` ở thư mục gốc của dự án.
2. Thêm các biến `EXPO_PUBLIC_FIREBASE_API_KEY`, v.v.
3. Trong code `config.ts`, truy xuất thông qua `process.env.EXPO_PUBLIC_FIREBASE_API_KEY`.

Ví dụ:

```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

## Ghi chú tương thích sau nâng cấp

- Ứng dụng hiện chạy trên `expo@^55.0.15`, `react@19.2.0` và `react-native@0.83.4`.
- Nếu cài thêm package liên quan đến Firebase hoặc native capability, ưu tiên dùng `npx expo install` cho package Expo và kiểm tra lại bằng `npx expo-doctor`.
- Sau khi đổi biến môi trường hoặc cấu hình Firebase, có thể cần khởi động lại bundler bằng `npx expo start --clear` để tránh cache cũ.

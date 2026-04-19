# Hướng dẫn Cài đặt & Thiết lập dự án (Setup Guide)

Ứng dụng này sử dụng **React Native với Expo SDK 55** để xây dựng ứng dụng di động đa nền tảng. Sau khi nâng cấp, ứng dụng đang chạy trên **React 19**, **React Native 0.83** và bộ thư viện Expo tương thích với New Architecture mặc định.

## 1. Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:
- **Node.js**: Phiên bản LTS hiện hành, ưu tiên **v20** hoặc mới hơn theo khuyến nghị của hệ sinh thái Expo mới.
- **npm** hoặc **yarn** (được cài mặc định cùng Node.js).
- Điện thoại di động có ứng dụng **Expo Go** (Android/iOS) hoặc máy ảo (Emulator/Simulator).
- Git.

## 2. Các bước cài đặt Dependencies

Di chuyển vào thư mục dự án và cài đặt dependency theo `package.json` hiện tại:

```bash
cd telephysio-ai-mobile

npm install
```

Các dependency lõi hiện tại của ứng dụng:

- `expo`: `^55.0.15`
- `react`: `19.2.0`
- `react-native`: `0.83.4`
- `expo-camera`: `~55.0.15`
- `expo-gl`: `~55.0.13`
- `expo-status-bar`: `~55.0.5`
- `@expo/metro-runtime`: `~55.0.9`
- `@react-native-async-storage/async-storage`: `2.2.0`

Khi cần thêm package Expo mới, ưu tiên dùng:

```bash
npx expo install <ten-package>
```

Lệnh này giúp Expo chọn đúng version tương thích với SDK 55, tránh conflict giữa `expo`, `react`, `react-native` và native module.

## 3. Khởi chạy ứng dụng

Chạy lệnh sau để khởi động Metro bundler của Expo:

```bash
npx expo start
```

- Để chạy trên thiết bị thật: Dùng điện thoại mở ứng dụng **Expo Go** và quét mã QR hiện ra trên Terminal.
- Để chạy trên máy ảo Android (cần có Android Studio): Bấm phím `a` trên Terminal.
- Để chạy trên máy ảo iOS (cần có Xcode trên máy Mac): Bấm phím `i` trên Terminal.

Nếu vừa nâng cấp dependency hoặc gặp lỗi cache, dùng thêm:

```bash
npx expo start --clear
```

## 4. Lưu ý khi dùng Expo Go với WSL2 trên Windows

Nếu chạy `Expo Go` từ môi trường `WSL2`, có thể thiết bị không truy cập được dev server nếu WSL đang dùng IP nội bộ `172.x.x.x`. Cách khắc phục ngắn gọn:

1. Tạo hoặc cập nhật file `%USERPROFILE%/.wslconfig` trên Windows:

```ini
[wsl2]
networkingMode=mirrored

[experimental]
hostAddressLoopback=true
```

2. Khởi động lại WSL:

```bash
wsl --shutdown
```

3. Mở lại terminal WSL rồi chạy lại app:

```bash
npx expo start
```

4. Kiểm tra IP hiện trên QR code của Expo:
- Nếu cấu hình đúng, IP này nên giống IP khi chạy `ipconfig` trong PowerShell.
- Nếu vẫn thấy dải `172.x.x.x`, `mirrored mode` thường chưa được áp dụng đúng.

5. Nếu vẫn không vào được từ điện thoại, mở inbound trên Hyper-V firewall bằng PowerShell chạy quyền Administrator:

```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```

Ý nghĩa nhanh:
- `networkingMode=mirrored`: WSL dùng cùng IP với máy Windows, giúp thiết bị trong LAN truy cập được Expo dev server.
- `hostAddressLoopback=true`: giúp tiến trình phía Windows truy cập service đang chạy trong WSL qua địa chỉ host/IP thuận tiện hơn.

# Hướng dẫn Cài đặt & Thiết lập dự án (Setup Guide)

Ứng dụng này sử dụng **React Native với Expo SDK 55** để xây dựng ứng dụng di động đa nền tảng. Sau khi nâng cấp, ứng dụng đang chạy trên **React 19**, **React Native 0.83** và bộ thư viện Expo tương thích với New Architecture mặc định.

Workflow mặc định hiện tại là chạy app bằng **Docker** để cả team dùng chung một môi trường phát triển nhất quán, không cần tự cài dependency Node của ứng dụng trên máy host.

## 1. Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:
- **Docker Engine** và **Docker Compose plugin**.
- Điện thoại di động có ứng dụng **Expo Go** (Android/iOS) hoặc máy ảo (Emulator/Simulator).
- Git.

Node.js không còn là yêu cầu bắt buộc để chạy app hằng ngày, vì Node và dependency của dự án đã được đóng gói trong container.

## 2. Chuẩn bị biến môi trường

Tạo file `.env` từ mẫu có sẵn:

```bash
cd telephysio-ai-mobile
cp .env.example .env
```

Sau đó điền các giá trị `EXPO_PUBLIC_FIREBASE_*` thật của bạn vào file `.env`.

## 3. Khởi động ứng dụng bằng Docker

Di chuyển vào thư mục dự án và chạy:

```bash
cd telephysio-ai-mobile
docker compose up --build
```

Lần chạy đầu tiên sẽ lâu hơn do Docker phải build image và cài dependency bằng `npm ci`.

Container hiện tại sẽ:

- dùng `node:20-bookworm`
- cài dependency từ `package-lock.json`
- mount mã nguồn từ máy host vào `/app`
- giữ `node_modules` bên trong container để tránh xung đột giữa host và container
- chạy Expo bằng `npm run docker:start` tương đương `expo start --tunnel`

Các dependency lõi hiện tại của ứng dụng vẫn là:

- `expo`: `^55.0.15`
- `react`: `19.2.0`
- `react-native`: `0.83.4`
- `expo-camera`: `~55.0.15`
- `expo-gl`: `~55.0.13`
- `expo-status-bar`: `~55.0.5`
- `@expo/metro-runtime`: `~55.0.9`
- `@react-native-async-storage/async-storage`: `2.2.0`

Khi cần thêm package Expo mới, ưu tiên dùng trong container:

```bash
docker compose run --rm expo npx expo install <ten-package>
```

Lệnh này giúp Expo chọn đúng version tương thích với SDK 55, tránh conflict giữa `expo`, `react`, `react-native` và native module.

Nếu cần cài thêm package npm thông thường và cập nhật lockfile:

```bash
docker compose run --rm expo npm install <ten-package>
```

Sau khi thay đổi `package.json` hoặc `package-lock.json`, rebuild lại image để môi trường chạy chính đồng bộ:

```bash
docker compose build --no-cache
```

Nếu container vẫn hiển thị dependency cũ sau khi rebuild, hãy xóa luôn named volume đang giữ `node_modules` rồi khởi động lại:

```bash
docker compose down -v
docker compose up --build
```

## 4. Cách sử dụng Expo sau khi container đã chạy

Sau khi `docker compose up --build` chạy xong, Expo sẽ hiển thị QR code và URL từ trong container.

- Để chạy trên thiết bị thật: Dùng điện thoại mở ứng dụng **Expo Go** và quét mã QR hiện ra trên Terminal.
- Để chạy trên máy ảo Android hoặc iOS, bạn vẫn cần emulator/simulator ở máy host. Việc mở thiết bị từ phím tắt tương tác trong container có thể không ổn định bằng việc mở Expo Go trên thiết bị thật.

Nếu vừa nâng cấp dependency hoặc gặp lỗi cache, dùng thêm:

```bash
docker compose run --rm expo npm run docker:start:clear
```

Khi muốn dừng môi trường:

```bash
docker compose down
```

## 5. Chạy lệnh bảo trì trong container

Một số lệnh hữu ích:

```bash
docker compose run --rm expo npx expo-doctor
docker compose run --rm expo npx expo install --fix
docker compose run --rm expo npx tsc --noEmit
```

Lưu ý: `docker compose run --rm expo ...` có thể tạo hoặc dùng lại volume `node_modules` của service `expo`. Vì vậy sau khi nâng cấp dependency, cách an toàn nhất là `docker compose down -v` rồi `docker compose up --build` để đồng bộ lại hoàn toàn môi trường chạy chính.

Nếu bạn thật sự cần chạy app ngoài Docker để debug cục bộ, vẫn có thể dùng `npx expo start`, nhưng đó không còn là workflow chuẩn của dự án.

## 6. Lưu ý khi dùng Expo Go với WSL2 trên Windows

Nếu chạy Docker Desktop kết hợp `WSL2`, Expo trong container đang dùng `--tunnel` để giảm phụ thuộc vào IP mạng nội bộ. Tuy vậy, nếu bạn chuyển sang chế độ LAN hoặc debug mạng cục bộ, thiết bị vẫn có thể không truy cập được dev server nếu WSL đang dùng IP nội bộ `172.x.x.x`. Cách khắc phục ngắn gọn:

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
cd telephysio-ai-mobile
docker compose up --build
```

4. Kiểm tra IP hiện trên QR code của Expo:
- Nếu cấu hình đúng, IP này nên giống IP khi chạy `ipconfig` trong PowerShell.
- Nếu vẫn thấy dải `172.x.x.x`, `mirrored mode` thường chưa được áp dụng đúng.

5. Nếu vẫn không vào được từ điện thoại khi dùng LAN hoặc các cổng local, mở inbound trên Hyper-V firewall bằng PowerShell chạy quyền Administrator:

```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```

Ý nghĩa nhanh:
- `networkingMode=mirrored`: WSL dùng cùng IP với máy Windows, giúp thiết bị trong LAN truy cập được Expo dev server.
- `hostAddressLoopback=true`: giúp tiến trình phía Windows truy cập service đang chạy trong WSL qua địa chỉ host/IP thuận tiện hơn.

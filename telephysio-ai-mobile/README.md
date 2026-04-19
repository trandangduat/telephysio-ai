# TelePhysioAI Mobile Application

TelePhysioAI là hệ thống hỗ trợ phục hồi vận động từ xa tích hợp trí tuệ nhân tạo (AI Pose Tracking) nhằm tối ưu hóa quá trình luyện tập và theo dõi người bị chậm phát triển vận động hoặc khuyết tật vận động.

## Cấu trúc thư mục (Skeleton)

- `assets/`: Chứa các tệp tĩnh như hình ảnh, âm thanh, và các mô hình AI (`.tflite`).
- `src/components/`: Các thành phần giao diện (UI Components).
- `src/screens/`: Các màn hình của ứng dụng (theo Use Cases).
- `src/navigation/`: Quản lý điều hướng (React Navigation).
- `src/services/`: Dịch vụ ngoại vi (Firebase, AI Posenet/LSTM, Audio).
- `src/store/`: Quản lý trạng thái toàn cục (Zustand).
- `src/utils/`: Các hàm tiện ích dùng chung.
- `docs/`: Tài liệu hướng dẫn thiết lập và phát triển.

## Bắt đầu

Vui lòng tham khảo tài liệu chi tiết trong thư mục `docs/`:
1. [Hướng dẫn cài đặt & Thiết lập dự án](docs/SETUP_GUIDE.md)
2. [Cấu hình Firebase](docs/FIREBASE_CONFIG.md)

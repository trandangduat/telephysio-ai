1. `telephysio-ai-mobile/docs/SETUP_GUIDE.md`
   - Hướng dẫn cài dependency, chạy app, clear cache, và lưu ý quan trọng khi dùng Expo Go với WSL2 trên Windows.

2. `.agents/`
   - Chứa các skill phục vụ AI agent. Hiện có skill nâng cấp Expo, setup Tailwind, native data fetching, Expo module, API routes, và các kỹ năng khác.

## Cấu trúc thực tế của repo

- App chính nằm trong `telephysio-ai-mobile/`.
- Repo root không phải Node workspace và không có root `package.json`.
- Mọi thay đổi code app nên thực hiện từ thư mục `telephysio-ai-mobile/`.

## Git Team Rules

Các quy tắc đơn giản khi làm việc nhóm bằng Git trong dự án này:

1. Không code trực tiếp trên `main`
   - Mỗi thay đổi nên đi từ một branch riêng.

2. Mỗi task một branch rõ ràng
   - Ví dụ: `feature/session-camera`, `fix/firebase-env`, `docs/setup-guide`.

3. Trước khi mở PR, cập nhật nhánh của mình từ `main`
   - Tránh để PR bị conflict quá lâu.

4. Chỉ commit các file liên quan đến task đang làm
   - Không gom nhiều thay đổi không liên quan vào một PR.

5. Không commit file bí mật
   - Không commit `.env`.
   - Chỉ commit `.env.example` khi thêm hoặc đổi env key.

6. Trước khi push, chạy kiểm tra tối thiểu trong `telephysio-ai-mobile/`
   - `npm install` nếu vừa đổi dependency
   - `npx expo-doctor`
   - `npx tsc --noEmit`

7. PR nên mô tả ngắn gọn
   - Đã đổi gì
   - Ảnh hưởng màn hình/chức năng nào
   - Cách kiểm tra lại

8. Nếu thay dependency Expo, dùng `npx expo install`
   - Không tự ý nâng package Expo bằng `npm install` vì dễ lệch version SDK.

9. Nếu sửa docs/setup/config, cập nhật tài liệu liên quan ngay trong cùng PR
   - Đặc biệt là `SETUP_GUIDE.md`, `FIREBASE_CONFIG.md`, `.env.example`, `AGENTS.md` nếu cần.

10. Nếu đang dùng Windows + WSL2, kiểm tra Expo Go trước khi báo lỗi runtime cho cả team
   - Dùng hướng dẫn trong `telephysio-ai-mobile/docs/SETUP_GUIDE.md`.
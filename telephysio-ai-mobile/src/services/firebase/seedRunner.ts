import { seedMockData } from './seedService';

async function run() {
  console.log("Khởi động quá trình Seed...");
  const success = await seedMockData();
  if (success) {
    console.log("Xong! Dữ liệu đã được đẩy lên Firebase Firestore.");
  } else {
    console.log("Có lỗi xảy ra.");
  }
  process.exit(0);
}

run();

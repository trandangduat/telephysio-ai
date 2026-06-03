/**
 * @file libraryService.ts
 * @description Dịch vụ xử lý dữ liệu thư viện (library) từ Firebase Firestore.
 */

import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "./config";
import { LibraryItem } from "./types";

/**
 * Lấy danh sách các mục thư viện từ Firestore.
 * Sắp xếp theo ngày tạo mới nhất.
 * 
 * @param {number} maxItems Số lượng mục tối đa muốn lấy (mặc định: 50)
 * @return {Promise<LibraryItem[]>} Mảng chứa dữ liệu các mục thư viện
 */
export const getLibraryItems = async (
  maxItems = 50,
): Promise<LibraryItem[]> => {
  try {
    const q = query(
      collection(db, "library_items"),
      orderBy("createdAt", "desc"),
      limit(maxItems),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as LibraryItem);
  } catch (error) {
    console.error("Error fetching library items:", error);
    throw error;
  }
};

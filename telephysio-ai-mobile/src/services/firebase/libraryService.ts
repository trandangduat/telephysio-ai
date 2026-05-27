import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "./config";
import { LibraryItem } from "./types";

/**
 * Fetch all library items from Firestore.
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

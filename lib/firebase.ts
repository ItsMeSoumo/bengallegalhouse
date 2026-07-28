import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { ExamResult, ResultDocument } from "./types";

// ── Firebase Configuration ──────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Initialize Firebase (singleton) ─────────────────────────────────────────

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ── Firestore Collections ───────────────────────────────────────────────────

const RESULTS_COLLECTION = "exam_results";

// ── Save Exam Result ────────────────────────────────────────────────────────

export async function saveExamResult(result: ExamResult): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, RESULTS_COLLECTION), {
      ...result,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving exam result:", error);
    throw new Error("Failed to save exam result");
  }
}

// ── Get All Exam Results ────────────────────────────────────────────────────

export async function getAllExamResults(): Promise<ResultDocument[]> {
  try {
    const q = query(
      collection(db, RESULTS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ResultDocument[];
  } catch (error) {
    console.error("Error fetching exam results:", error);
    throw new Error("Failed to fetch exam results");
  }
}

export { db };

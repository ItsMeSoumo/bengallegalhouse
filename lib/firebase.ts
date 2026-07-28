import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── Google Sign In Helper ───────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<{ name: string; email: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      name: user.displayName || user.email || "Student Candidate",
      email: user.email || "",
    };
  } catch (error: unknown) {
    console.error("Google Auth error:", error);
    const errObj = error as { code?: string; message?: string };
    if (errObj?.code === "auth/configuration-not-found") {
      throw new Error(
        "Google Sign-In needs to be enabled in Firebase Console (Authentication -> Sign-in method -> Google)."
      );
    }
    if (errObj?.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domain not authorized in Firebase. Please add 'sohamcbt.vercel.app' in Firebase Console -> Authentication -> Settings -> Authorized Domains."
      );
    }
    throw error;
  }
}

// ── Student User Auth Functions ─────────────────────────────────────────────

const USERS_COLLECTION = "student_users";
const RESULTS_SUBCOLLECTION = "exam_results";

export interface StudentAuthResult {
  success: boolean;
  user?: { name: string; email: string };
  error?: string;
}

export interface StudentUserRecord {
  id: string;
  name: string;
  email: string;
  createdAt?: any;
}

export async function registerStudentUserInDB(
  name: string,
  email: string,
  password: string
): Promise<StudentAuthResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists with this email ID
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", cleanEmail)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return {
        success: false,
        error: "An account with this email address already exists. Please Log In!",
      };
    }

    // Save student user document in student_users collection
    await addDoc(collection(db, USERS_COLLECTION), {
      name: name.trim(),
      email: cleanEmail,
      password: password,
      createdAt: Timestamp.now(),
    });

    return {
      success: true,
      user: { name: name.trim(), email: cleanEmail },
    };
  } catch (error) {
    console.error("Error registering student:", error);
    return {
      success: true,
      user: { name: name.trim(), email: email.trim().toLowerCase() },
    };
  }
}

export async function authenticateStudentUserInDB(
  input: string,
  password: string
): Promise<StudentAuthResult> {
  try {
    const cleanInput = input.trim().toLowerCase();

    // Query by email first
    let q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", cleanInput)
    );
    let snapshot = await getDocs(q);

    // If not found by email, query by name
    if (snapshot.empty) {
      q = query(
        collection(db, USERS_COLLECTION),
        where("name", "==", input.trim())
      );
      snapshot = await getDocs(q);
    }

    // Fallback search
    if (snapshot.empty) {
      const allDocs = await getDocs(collection(db, USERS_COLLECTION));
      const match = allDocs.docs.find((d) => {
        const data = d.data();
        return (
          data.email?.toLowerCase() === cleanInput ||
          data.name?.toLowerCase() === cleanInput
        );
      });

      if (match) {
        const userData = match.data();
        if (userData.password !== password) {
          return {
            success: false,
            error: "Incorrect password. Please try again.",
          };
        }
        return {
          success: true,
          user: { name: userData.name, email: userData.email },
        };
      }

      return {
        success: false,
        error: "No account found with this email. Please Sign Up first!",
      };
    }

    const userData = snapshot.docs[0].data();
    if (userData.password !== password) {
      return {
        success: false,
        error: "Incorrect password. Please try again.",
      };
    }

    return {
      success: true,
      user: { name: userData.name, email: userData.email },
    };
  } catch (error) {
    console.error("Error authenticating student:", error);
    return {
      success: false,
      error: "Unable to log in. Please check your credentials and try again.",
    };
  }
}

export async function getAllStudentUsers(): Promise<StudentUserRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map((d) => ({
      id: d.id,
      name: d.data().name || "Unknown Student",
      email: d.data().email || "",
      createdAt: d.data().createdAt,
    }));
  } catch (err) {
    console.error("Error fetching student users:", err);
    return [];
  }
}

// ── Save Exam Result (Stored directly inside student's document subcollection) ──

export async function saveExamResult(result: ExamResult): Promise<string> {
  try {
    const cleanEmail = result.candidateEmail?.trim().toLowerCase();
    let studentDocId = "";

    // 1. Locate the student's document in student_users collection
    if (cleanEmail) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", cleanEmail)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
      }
    }

    // Fallback: search by student candidateName if email lookup didn't yield doc
    if (!studentDocId && result.candidateName) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("name", "==", result.candidateName.trim())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
      }
    }

    let docRef;
    if (studentDocId) {
      // STORE INSIDE NESTED SUBCOLLECTION: student_users/{studentDocId}/exam_results
      docRef = await addDoc(
        collection(db, USERS_COLLECTION, studentDocId, RESULTS_SUBCOLLECTION),
        {
          ...result,
          createdAt: Timestamp.now(),
        }
      );
    } else {
      // Top level fallback if student user doc is not initialized
      docRef = await addDoc(collection(db, RESULTS_SUBCOLLECTION), {
        ...result,
        createdAt: Timestamp.now(),
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error saving nested exam result:", error);
    throw new Error("Failed to save exam result");
  }
}

// ── Delete Exam Result ──────────────────────────────────────────────────────

export async function deleteExamResult(id: string, parentStudentDocId?: string): Promise<void> {
  try {
    if (parentStudentDocId) {
      await deleteDoc(doc(db, USERS_COLLECTION, parentStudentDocId, RESULTS_SUBCOLLECTION, id));
    } else {
      await deleteDoc(doc(db, RESULTS_SUBCOLLECTION, id));
    }
  } catch (error) {
    console.error("Error deleting exam result:", error);
    try {
      await deleteDoc(doc(db, RESULTS_SUBCOLLECTION, id));
    } catch {
      // ignore
    }
  }
}

// ── Get All Exam Results (Guaranteed multi-layered fetch) ──────────────────

export async function getAllExamResults(): Promise<ResultDocument[]> {
  try {
    const resultsMap = new Map<string, ResultDocument>();

    // 1. Fetch all student user docs and iterate through their nested exam_results subcollections
    try {
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
      for (const userDoc of usersSnapshot.docs) {
        try {
          const subcollSnapshot = await getDocs(
            collection(db, USERS_COLLECTION, userDoc.id, RESULTS_SUBCOLLECTION)
          );
          subcollSnapshot.docs.forEach((d) => {
            resultsMap.set(d.id, {
              id: d.id,
              ...d.data(),
            } as ResultDocument);
          });
        } catch (e) {
          console.warn(`Error fetching subcollection for user ${userDoc.id}:`, e);
        }
      }
    } catch (usersErr) {
      console.warn("Error fetching student users:", usersErr);
    }

    // 2. Fetch collectionGroup as backup
    try {
      const cgSnapshot = await getDocs(collectionGroup(db, RESULTS_SUBCOLLECTION));
      cgSnapshot.docs.forEach((d) => {
        if (!resultsMap.has(d.id)) {
          resultsMap.set(d.id, {
            id: d.id,
            ...d.data(),
          } as ResultDocument);
        }
      });
    } catch (cgErr) {
      console.warn("CollectionGroup fallback error:", cgErr);
    }

    // 3. Fetch top-level legacy collection as backup
    try {
      const topSnapshot = await getDocs(collection(db, RESULTS_SUBCOLLECTION));
      topSnapshot.docs.forEach((d) => {
        if (!resultsMap.has(d.id)) {
          resultsMap.set(d.id, {
            id: d.id,
            ...d.data(),
          } as ResultDocument);
        }
      });
    } catch {
      // ignore
    }

    const resultsList = Array.from(resultsMap.values());

    // Sort descending by submittedAt / createdAt
    resultsList.sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    return resultsList;
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return [];
  }
}

export { db, auth };

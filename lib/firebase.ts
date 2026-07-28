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
  orderBy,
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
      // ✅ STORE INSIDE NESTED SUBCOLLECTION: student_users/{studentDocId}/exam_results
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
    // Fallback attempt top-level
    try {
      await deleteDoc(doc(db, RESULTS_SUBCOLLECTION, id));
    } catch {
      // ignore
    }
  }
}

// ── Get All Exam Results (Queries nested subcollections across all students) ──

export async function getAllExamResults(): Promise<ResultDocument[]> {
  try {
    const resultsList: ResultDocument[] = [];

    // 1. Fetch subcollection documents across all student user documents
    try {
      const subcollQuery = query(
        collectionGroup(db, RESULTS_SUBCOLLECTION),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(subcollQuery);
      querySnapshot.docs.forEach((d) => {
        resultsList.push({
          id: d.id,
          ...d.data(),
        } as ResultDocument);
      });
    } catch (subErr) {
      console.warn("Subcollection group query fallback:", subErr);
    }

    // 2. Fetch top-level fallback documents
    try {
      const topLevelQuery = query(
        collection(db, RESULTS_SUBCOLLECTION),
        orderBy("createdAt", "desc")
      );
      const topSnapshot = await getDocs(topLevelQuery);
      topSnapshot.docs.forEach((d) => {
        if (!resultsList.some((r) => r.id === d.id)) {
          resultsList.push({
            id: d.id,
            ...d.data(),
          } as ResultDocument);
        }
      });
    } catch {
      // ignore top level if empty
    }

    return resultsList;
  } catch (error) {
    console.error("Error fetching exam results:", error);
    throw new Error("Failed to fetch exam results");
  }
}

export { db, auth };

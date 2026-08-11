import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ExamResult, ResultDocument, ExamPaper } from "./types";

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

export async function loginWithGoogle(): Promise<{ name: string; email: string; token: string }> {
  console.log("🔑 [GOOGLE AUTH] Initializing Google Sign-In popup...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    const studentInfo = {
      name: user.displayName || user.email || "Student Candidate",
      email: user.email || "",
      token,
    };
    console.log("🔑 [GOOGLE AUTH] Popup sign-in successful. User details:", {
      name: studentInfo.name,
      email: studentInfo.email,
      hasToken: !!studentInfo.token,
    });

    // Auto-register Google student user document asynchronously (non-blocking for fast redirect)
    if (studentInfo.email) {
      registerStudentUserInDB(studentInfo.name, studentInfo.email, "google_oauth_user").catch((regErr) => {
        console.warn("Google user auto-registration notice:", regErr);
      });
    }

    return studentInfo;
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
        "Domain not authorized in Firebase. Please add your Vercel domain (e.g. oneplacecbt.vercel.app) in Firebase Console -> Authentication -> Settings -> Authorized Domains."
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
  createdAt?: string | number | null;
}

export async function registerStudentUserInDB(
  name: string,
  email: string,
  password: string
): Promise<StudentAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Valid email is required" };
  }

  // Deterministic document ID derived from email to guarantee zero duplicate documents
  const docId = cleanEmail.replace(/[^a-z0-9]/gi, "_");

  console.log(`\n📝 [DB WRITE: signup] Attempting to register user:
      - Name: ${name}
      - Email: ${cleanEmail}
      - Doc ID: ${docId}`);

  try {
    const userDocRef = doc(db, USERS_COLLECTION, docId);

    // Check if user already exists in collection
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", cleanEmail)
    );
    console.log(`🔍 [DB READ: signup check] Checking if email '${cleanEmail}' exists in collection '${USERS_COLLECTION}'`);
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const existingData = snapshot.docs[0].data();
      console.log(`📝 [DB WRITE: signup] User already exists in DB:`, existingData);
      return {
        success: true,
        user: { name: existingData.name || name.trim(), email: cleanEmail },
      };
    }

    // Save student user document deterministically using setDoc with merge
    console.log(`📝 [DB WRITE: signup] Setting user document '${docId}' in '${USERS_COLLECTION}'...`);
    await setDoc(
      userDocRef,
      {
        name: name.trim(),
        email: cleanEmail,
        password: password,
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
    console.log(`📝 [DB WRITE: signup] Successfully registered new user. Firestore Doc ID: ${docId}`);

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
  const cleanInput = input.trim().toLowerCase();
  console.log(`\n🔑 [DB READ: login] Authenticating student. Input (email/name): '${cleanInput}'`);
  try {
    // Query by email first
    let q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", cleanInput)
    );
    console.log(`🔍 [DB READ: login] Querying '${USERS_COLLECTION}' by email == '${cleanInput}'`);
    let snapshot = await getDocs(q);

    // If not found by email, query by name
    if (snapshot.empty) {
      console.log(`🔍 [DB READ: login] Email not found. Querying '${USERS_COLLECTION}' by name == '${input.trim()}'`);
      q = query(
        collection(db, USERS_COLLECTION),
        where("name", "==", input.trim())
      );
      snapshot = await getDocs(q);
    }

    // Fallback search
    if (snapshot.empty) {
      console.log(`🔍 [DB READ: login] Direct query empty. Performing fallback collection scan...`);
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
        console.log(`🔍 [DB READ: login] Match found in scan:`, userData);
        if (userData.password !== password) {
          console.warn(`🔑 [DB READ: login] Password mismatch for user: ${userData.email}`);
          return {
            success: false,
            error: "Incorrect password. Please try again.",
          };
        }
        console.log(`🔑 [DB READ: login] Authentication successful for: ${userData.email}`);
        return {
          success: true,
          user: { name: userData.name, email: userData.email },
        };
      }

      console.warn(`🔑 [DB READ: login] No account found matching: '${cleanInput}'`);
      return {
        success: false,
        error: "No account found with this email. Please Sign Up first!",
      };
    }

    const userData = snapshot.docs[0].data();
    console.log(`🔍 [DB READ: login] Direct match found:`, userData);
    if (userData.password !== password) {
      console.warn(`🔑 [DB READ: login] Password mismatch for user: ${userData.email}`);
      return {
        success: false,
        error: "Incorrect password. Please try again.",
      };
    }

    console.log(`🔑 [DB READ: login] Authentication successful for: ${userData.email}`);
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
    return snapshot.docs.map((d) => {
      const data = d.data();
      let createdAtIso: string | null = null;

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt.seconds === "number") {
          createdAtIso = new Date(data.createdAt.seconds * 1000).toISOString();
        } else if (typeof data.createdAt === "string" || typeof data.createdAt === "number") {
          createdAtIso = new Date(data.createdAt).toISOString();
        }
      }

      return {
        id: d.id,
        name: data.name || data.email || "Student Candidate",
        email: data.email || "",
        createdAt: createdAtIso,
      };
    });
  } catch (err) {
    console.error("Error fetching student users from DB:", err);
    return [];
  }
}

// ── Save Exam Result (Stored directly inside student's document subcollection) ──

export async function saveExamResult(result: ExamResult): Promise<string> {
  const cleanEmail = result.candidateEmail?.trim().toLowerCase();
  console.log(`\n💾 [DB WRITE: saveResult] Saving exam results for:
      - Candidate Name: ${result.candidateName}
      - Candidate Email: ${cleanEmail}
      - Exam ID: ${result.examId}`);
  try {
    let studentDocId = "";

    // 1. Locate the student's document in student_users collection
    if (cleanEmail) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", cleanEmail)
      );
      console.log(`🔍 [DB READ: saveResult] Locating student doc ID by email: '${cleanEmail}'`);
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
        console.log(`🔍 [DB READ: saveResult] Student doc ID found: '${studentDocId}'`);
      }
    }

    // Fallback: search by student candidateName if email lookup didn't yield doc
    if (!studentDocId && result.candidateName) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("name", "==", result.candidateName.trim())
      );
      console.log(`🔍 [DB READ: saveResult] Locating student doc ID by name: '${result.candidateName.trim()}'`);
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
        console.log(`🔍 [DB READ: saveResult] Student doc ID found (by name): '${studentDocId}'`);
      }
    }

    let docRef;
    if (studentDocId) {
      const path = `${USERS_COLLECTION}/${studentDocId}/${RESULTS_SUBCOLLECTION}`;
      console.log(`💾 [DB WRITE: saveResult] Writing document to subcollection path: '${path}'`);
      // STORE INSIDE NESTED SUBCOLLECTION: student_users/{studentDocId}/exam_results
      docRef = await addDoc(
        collection(db, USERS_COLLECTION, studentDocId, RESULTS_SUBCOLLECTION),
        {
          ...result,
          createdAt: Timestamp.now(),
        }
      );
    } else {
      console.log(`💾 [DB WRITE: saveResult] No student ID found. Saving to top-level fallback: '${RESULTS_SUBCOLLECTION}'`);
      // Top level fallback if student user doc is not initialized
      docRef = await addDoc(collection(db, RESULTS_SUBCOLLECTION), {
        ...result,
        createdAt: Timestamp.now(),
      });
    }

    console.log(`💾 [DB WRITE: saveResult] Exam result saved successfully. Created Doc ID: '${docRef.id}'`);
    return docRef.id;
  } catch (error) {
    console.error("Error saving nested exam result:", error);
    throw new Error("Failed to save exam result");
  }
}

// ── Delete Student User ──────────────────────────────────────────────────────

export async function deleteStudentUserInDB(userDocIdOrEmail: string): Promise<boolean> {
  try {
    const cleanInput = userDocIdOrEmail.trim().toLowerCase();

    // 1. Direct doc deletion if ID
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userDocIdOrEmail));
    } catch {
      // ignore
    }

    // 2. Query search by email or name
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    for (const uDoc of snapshot.docs) {
      const data = uDoc.data();
      if (
        uDoc.id === userDocIdOrEmail ||
        data.email?.toLowerCase() === cleanInput ||
        data.name?.toLowerCase() === cleanInput
      ) {
        await deleteDoc(doc(db, USERS_COLLECTION, uDoc.id));
      }
    }
    return true;
  } catch (err) {
    console.error("Error deleting student user in DB:", err);
    return false;
  }
}

// ── Delete Exam Result ──────────────────────────────────────────────────────

export async function deleteExamResult(
  id: string,
  parentStudentDocId?: string,
  candidateEmail?: string,
  candidateName?: string,
  deleteUserAccount: boolean = false
): Promise<void> {
  try {
    let deleted = false;

    // 1. Delete nested subcollection result if parentStudentDocId is known
    if (parentStudentDocId) {
      try {
        await deleteDoc(
          doc(db, USERS_COLLECTION, parentStudentDocId, RESULTS_SUBCOLLECTION, id)
        );
        deleted = true;
      } catch (e) {
        console.warn("Direct path result deletion error:", e);
      }
    }

    // 2. Fallback: collectionGroup search across subcollections
    if (!deleted) {
      try {
        const cgSnapshot = await getDocs(collectionGroup(db, RESULTS_SUBCOLLECTION));
        for (const d of cgSnapshot.docs) {
          if (d.id === id) {
            await deleteDoc(d.ref);
            deleted = true;
            break;
          }
        }
      } catch (cgErr) {
        console.warn("Collection group search delete error:", cgErr);
      }
    }

    // 3. Fallback: top-level collection
    try {
      await deleteDoc(doc(db, RESULTS_SUBCOLLECTION, id));
    } catch {
      // ignore
    }

    // 4. Delete user account from student_users collection if requested
    if (deleteUserAccount) {
      if (parentStudentDocId) {
        try {
          await deleteDoc(doc(db, USERS_COLLECTION, parentStudentDocId));
        } catch {
          // ignore
        }
      }

      const cleanEmail = candidateEmail?.trim().toLowerCase();
      const cleanName = candidateName?.trim().toLowerCase();

      if (cleanEmail || cleanName) {
        try {
          const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
          for (const uDoc of usersSnapshot.docs) {
            const uData = uDoc.data();
            if (
              (cleanEmail && uData.email?.toLowerCase() === cleanEmail) ||
              (cleanName && uData.name?.toLowerCase() === cleanName)
            ) {
              await deleteDoc(doc(db, USERS_COLLECTION, uDoc.id));
            }
          }
        } catch (uErr) {
          console.warn("User account lookup delete error:", uErr);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting exam result / user:", error);
    throw new Error("Failed to delete record from database");
  }
}

// ── Get All Exam Results (Guaranteed multi-layered fetch) ──────────────────

export async function getAllExamResults(): Promise<ResultDocument[]> {
  try {
    const resultsMap = new Map<string, ResultDocument>();

    // 1. Fetch all student user docs and iterate through their nested exam_results subcollections
    try {
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
      console.log(`\n🚨 [DATABASE READ TRACE] Total ${usersSnapshot.docs.length} users fetched from '${USERS_COLLECTION}' collection!`);

      let subcollectionCount = 0;
      for (const userDoc of usersSnapshot.docs) {
        subcollectionCount++;
        const userData = userDoc.data();
        console.log(`👉 [DATABASE READ TRACE] Querying nested '${RESULTS_SUBCOLLECTION}' subcollection for:
            - User ID: ${userDoc.id}
            - Name: ${userData.name || "N/A"}
            - Email: ${userData.email || "N/A"}
            - Created At: ${userData.createdAt && typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate().toISOString() : "N/A"}
            (${subcollectionCount}/${usersSnapshot.docs.length})`);

        try {
          const subcollSnapshot = await getDocs(
            collection(db, USERS_COLLECTION, userDoc.id, RESULTS_SUBCOLLECTION)
          );
          subcollSnapshot.docs.forEach((d) => {
            resultsMap.set(d.id, ({
              id: d.id,
              studentDocId: userDoc.id,
              ...d.data(),
            } as unknown) as ResultDocument);
          });
        } catch (e) {
          console.warn(`Error fetching subcollection for user ${userDoc.id}:`, e);
        }
      }
      console.log(`🚨 [DATABASE READ TRACE] Done. Queried ${subcollectionCount} subcollections in total!\n`);
    } catch (usersErr) {
      console.warn("Error fetching student users:", usersErr);
    }

    // 2. Fetch collectionGroup as backup
    try {
      const cgSnapshot = await getDocs(collectionGroup(db, RESULTS_SUBCOLLECTION));
      cgSnapshot.docs.forEach((d) => {
        if (!resultsMap.has(d.id)) {
          const parentUserDocId = d.ref.parent.parent?.id;
          resultsMap.set(d.id, ({
            id: d.id,
            studentDocId: parentUserDocId,
            ...d.data(),
          } as unknown) as ResultDocument);
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

export async function getCandidateExamResults(
  candidateName: string,
  candidateEmail?: string
): Promise<ResultDocument[]> {
  try {
    const cleanEmail = candidateEmail?.trim().toLowerCase();
    let studentDocId = "";

    console.log(`\n🔍 [DB READ: getCandidateResults] Looking up candidate records for:
        - Email: '${cleanEmail}'
        - Name: '${candidateName}'`);

    // 1. Locate student doc ID
    if (cleanEmail) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", cleanEmail)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
        console.log(`🔍 [DB READ: getCandidateResults] Found student doc ID by email: '${studentDocId}'`);
      }
    }

    if (!studentDocId && candidateName) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("name", "==", candidateName.trim())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        studentDocId = snapshot.docs[0].id;
        console.log(`🔍 [DB READ: getCandidateResults] Found student doc ID by name: '${studentDocId}'`);
      }
    }

    const resultsList: ResultDocument[] = [];

    if (studentDocId) {
      // Query specific student's nested subcollection
      console.log(`🔍 [DB READ: getCandidateResults] Querying nested '${RESULTS_SUBCOLLECTION}' for student ID: '${studentDocId}'`);
      const subcollSnapshot = await getDocs(
        collection(db, USERS_COLLECTION, studentDocId, RESULTS_SUBCOLLECTION)
      );
      subcollSnapshot.docs.forEach((d) => {
        resultsList.push(({
          id: d.id,
          studentDocId,
          ...d.data(),
        } as unknown) as ResultDocument);
      });
    } else {
      // Query top-level fallback collection
      console.log(`🔍 [DB READ: getCandidateResults] No student ID found. Scanning top-level '${RESULTS_SUBCOLLECTION}' for candidate email/name...`);
      let q = query(
        collection(db, RESULTS_SUBCOLLECTION),
        where("candidateName", "==", candidateName.trim())
      );
      let snapshot = await getDocs(q);

      if (snapshot.empty && cleanEmail) {
        q = query(
          collection(db, RESULTS_SUBCOLLECTION),
          where("candidateEmail", "==", cleanEmail)
        );
        snapshot = await getDocs(q);
      }

      snapshot.docs.forEach((d) => {
        resultsList.push({
          id: d.id,
          ...d.data(),
        } as ResultDocument);
      });
    }

    console.log(`🔍 [DB READ: getCandidateResults] Completed. Retrieved ${resultsList.length} total results for this candidate.\n`);

    // Sort descending by submittedAt / createdAt
    resultsList.sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    return resultsList;
  } catch (error) {
    console.error("Error fetching candidate exam results:", error);
    return [];
  }
}

export const EXAMS_COLLECTION = "exam_papers";

function cleanUndefinedFields<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

export async function saveExamPaperInDB(paper: ExamPaper): Promise<boolean> {
  try {
    console.log(`🔥 [FIRESTORE WRITE: saveExamPaperInDB] Persisting exam paper '${paper.id}' to collection '${EXAMS_COLLECTION}':`, {
      id: paper.id,
      title: paper.title,
      scheduledDate: paper.scheduledDate ? `'${paper.scheduledDate}'` : "DELETING_FIELD (Always Available 24/7)",
      scheduledStartTime: paper.scheduledStartTime ? `'${paper.scheduledStartTime}'` : "DELETING_FIELD",
      scheduledEndTime: paper.scheduledEndTime ? `'${paper.scheduledEndTime}'` : "DELETING_FIELD",
      totalTimeMinutes: paper.totalTimeMinutes,
      status: paper.status,
      questionCount: paper.questions?.length || 0,
    });

    // Notify Server API Route so logs print directly in VS Code / Terminal running 'npm run dev'
    if (typeof window !== "undefined") {
      fetch("/api/admin/save-exam-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", paper }),
      }).catch((err) => {
        console.debug("⚠️ [SERVER LOG NOTICE] Failed to trigger terminal logging:", err);
      });
    }

    const payload: Record<string, unknown> = {
      ...cleanUndefinedFields(paper as unknown as Record<string, unknown>),
      subtitle: paper.subtitle || "",
      description: paper.description || "",
      maxAttempts: paper.maxAttempts ?? 1,
      isPrivate: paper.isPrivate ?? false,
      questions: paper.questions || [],
      scheduledDate: paper.scheduledDate ? paper.scheduledDate : deleteField(),
      scheduledStartTime: paper.scheduledStartTime ? paper.scheduledStartTime : deleteField(),
      scheduledEndTime: paper.scheduledEndTime ? paper.scheduledEndTime : deleteField(),
    };

    await setDoc(doc(db, EXAMS_COLLECTION, paper.id), payload, { merge: true });
    console.log(`✅ [FIRESTORE SUCCESS] Exam paper '${paper.id}' successfully saved & merged into Firestore DB!`);
    return true;
  } catch (err) {
    console.error("❌ [FIRESTORE ERROR] Failed to save exam paper in Firestore DB:", err);
    return false;
  }
}

export async function deleteExamPaperInDB(paperId: string): Promise<boolean> {
  try {
    console.log(`🔥 [FIRESTORE WRITE: deleteExamPaperInDB] Deleting exam paper '${paperId}' from collection '${EXAMS_COLLECTION}'`);

    if (typeof window !== "undefined") {
      fetch("/api/admin/save-exam-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", paperId }),
      }).catch((err) => {
        console.debug("⚠️ [SERVER LOG NOTICE] Failed to trigger terminal logging:", err);
      });
    }

    await deleteDoc(doc(db, EXAMS_COLLECTION, paperId));
    console.log(`✅ [FIRESTORE SUCCESS] Exam paper '${paperId}' deleted from Firestore DB!`);
    return true;
  } catch (err) {
    console.error("❌ [FIRESTORE ERROR] Failed to delete exam paper in Firestore DB:", err);
    return false;
  }
}

export async function seedExamPapersToDB(initialPapers: ExamPaper[]): Promise<boolean> {
  try {
    for (const paper of initialPapers) {
      const cleaned = cleanUndefinedFields(paper as unknown as Record<string, unknown>);
      await setDoc(doc(db, EXAMS_COLLECTION, paper.id), cleaned, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn("Error seeding exam papers to Firestore DB:", err);
    return false;
  }
}

export async function getExamPapersFromDB(initialFallback: ExamPaper[] = []): Promise<ExamPaper[]> {
  try {
    const snap = await getDocs(collection(db, EXAMS_COLLECTION));
    if (!snap.empty) {
      const list: ExamPaper[] = [];
      snap.forEach((d) => list.push(d.data() as ExamPaper));
      console.log(`📖 [FIRESTORE READ: getExamPapersFromDB] Loaded ${list.length} papers from Firestore DB:`, list.map(p => ({
        id: p.id,
        title: p.title,
        scheduledDate: p.scheduledDate || "None (Always Open)",
        scheduledStartTime: p.scheduledStartTime || "None",
        scheduledEndTime: p.scheduledEndTime || "None",
        questionsCount: p.questions?.length || 0,
      })));
      return list;
    } else if (initialFallback.length > 0) {
      console.log(`📖 [FIRESTORE SEED] Collection '${EXAMS_COLLECTION}' empty. Seeding initial fallback papers...`);
      await seedExamPapersToDB(initialFallback);
      return initialFallback;
    }
  } catch (err) {
    console.error("❌ Error fetching exam papers from Firestore DB:", err);
  }
  return initialFallback;
}

export { db, auth };

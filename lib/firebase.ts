import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ExamResult, ResultDocument, ExamPaper, ExamSession } from "./types";

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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
      const docId = studentInfo.email.toLowerCase().trim().replace(/[^a-z0-9]/gi, "_");
      setDoc(
        doc(db, USERS_COLLECTION, docId),
        {
          name: studentInfo.name,
          email: studentInfo.email.toLowerCase().trim(),
          uid: user.uid,
          provider: "google",
          lastLoginAt: Timestamp.now(),
        },
        { merge: true }
      ).catch((regErr) => {
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
  user?: { name: string; email: string; token?: string };
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
  const cleanName = name.trim();
  if (!cleanEmail) {
    return { success: false, error: "Valid email is required" };
  }

  console.log(`\n📝 [AUTH: signup] Registering user in Firebase Auth: ${cleanName} (${cleanEmail})`);

  try {
    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(userCredential.user, { displayName: cleanName });
    const token = await userCredential.user.getIdToken();

    // 2. Save public profile metadata in Firestore (WITHOUT PASSWORD)
    const docId = cleanEmail.replace(/[^a-z0-9]/gi, "_");
    await setDoc(
      doc(db, USERS_COLLECTION, docId),
      {
        name: cleanName,
        email: cleanEmail,
        uid: userCredential.user.uid,
        provider: "password",
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`📝 [AUTH: signup] Successfully registered user with Firebase Auth: ${cleanEmail}`);
    return {
      success: true,
      user: { name: cleanName, email: cleanEmail, token },
    };
  } catch (error: any) {
    console.error("Firebase Registration error:", error);
    if (error.code === "auth/email-already-in-use") {
      return {
        success: false,
        error: "An account with this email already exists. Please Log In!",
      };
    }
    if (error.code === "auth/weak-password") {
      return {
        success: false,
        error: "Password should be at least 6 characters long.",
      };
    }
    if (error.code === "auth/invalid-email") {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }
    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    };
  }
}

export async function authenticateStudentUserInDB(
  input: string,
  password: string
): Promise<StudentAuthResult> {
  const cleanInput = input.trim().toLowerCase();
  console.log(`\n🔑 [AUTH: login] Authenticating student with Firebase Auth: '${cleanInput}'`);

  if (!cleanInput || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    // 1. Authenticate credentials securely against Firebase Auth engine
    const userCredential = await signInWithEmailAndPassword(auth, cleanInput, password);
    const token = await userCredential.user.getIdToken();
    const displayName = userCredential.user.displayName || cleanInput.split("@")[0];

    // 2. Update last login metadata in Firestore
    const docId = cleanInput.replace(/[^a-z0-9]/gi, "_");
    setDoc(
      doc(db, USERS_COLLECTION, docId),
      {
        name: displayName,
        email: cleanInput,
        uid: userCredential.user.uid,
        lastLoginAt: Timestamp.now(),
      },
      { merge: true }
    ).catch((err) => console.warn("Notice updating login timestamp:", err));

    console.log(`🔑 [AUTH: login] Authentication successful for: ${cleanInput}`);
    return {
      success: true,
      user: { name: displayName, email: cleanInput, token },
    };
  } catch (error: any) {
    console.error("Firebase Login error:", error);
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      return {
        success: false,
        error: "Incorrect email or password. Please try again.",
      };
    }
    if (error.code === "auth/invalid-email") {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }
    if (error.code === "auth/too-many-requests") {
      return {
        success: false,
        error: "Access temporarily disabled due to many failed attempts. Try again later or reset password.",
      };
    }
    return {
      success: false,
      error: error.message || "Unable to log in. Please check your credentials.",
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

// ── Save Exam Result (Stored in flat high-performance root collection) ──────

export async function saveExamResult(result: ExamResult): Promise<string> {
  const cleanEmail = result.candidateEmail?.trim().toLowerCase() || "";
  console.log(`\n💾 [DB WRITE: saveResult] Saving exam result in flat collection '${RESULTS_SUBCOLLECTION}' for candidate: ${result.candidateName} (${cleanEmail})`);

  try {
    const docRef = await addDoc(collection(db, RESULTS_SUBCOLLECTION), {
      ...result,
      candidateEmail: cleanEmail,
      candidateName: result.candidateName.trim(),
      createdAt: Timestamp.now(),
    });

    console.log(`💾 [DB WRITE: saveResult] Result successfully written to '${RESULTS_SUBCOLLECTION}/${docRef.id}'`);
    return docRef.id;
  } catch (error) {
    console.error("Error saving exam result:", error);
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
    // 1. Delete document directly from root exam_results collection
    await deleteDoc(doc(db, RESULTS_SUBCOLLECTION, id));
    console.log(`🗑️ [DB DELETE] Deleted exam result '${id}' from '${RESULTS_SUBCOLLECTION}'`);

    // 2. Delete user account from student_users if requested
    if (deleteUserAccount) {
      const cleanEmail = candidateEmail?.trim().toLowerCase();
      const cleanName = candidateName?.trim().toLowerCase();

      if (parentStudentDocId) {
        try {
          await deleteDoc(doc(db, USERS_COLLECTION, parentStudentDocId));
        } catch {
          // ignore
        }
      }

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

// ── Get All Exam Results (Fast 1-Query Fetch from Flat Collection) ──────────

export async function getAllExamResults(): Promise<ResultDocument[]> {
  try {
    console.log(`\n🔍 [DB READ: getAllExamResults] Fetching all records from flat collection '${RESULTS_SUBCOLLECTION}'`);
    let resultsList: ResultDocument[] = [];

    try {
      const q = query(
        collection(db, RESULTS_SUBCOLLECTION),
        orderBy("submittedAt", "desc")
      );
      const snapshot = await getDocs(q);
      resultsList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as ResultDocument));
    } catch {
      // Fallback in-memory sorting if Firestore orderBy index is not yet built
      const snapshot = await getDocs(collection(db, RESULTS_SUBCOLLECTION));
      resultsList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as ResultDocument));
      resultsList.sort((a, b) => {
        const timeA = new Date(a.submittedAt || 0).getTime();
        const timeB = new Date(b.submittedAt || 0).getTime();
        return timeB - timeA;
      });
    }

    console.log(`✅ [DB READ: getAllExamResults] Retrieved ${resultsList.length} submissions in 1 query.\n`);
    return resultsList;
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return [];
  }
}

// ── Get Candidate Exam Results (Direct Query from Flat Collection) ──────────

export async function getCandidateExamResults(
  candidateName: string,
  candidateEmail?: string
): Promise<ResultDocument[]> {
  try {
    const cleanEmail = candidateEmail?.trim().toLowerCase();
    const resultsMap = new Map<string, ResultDocument>();

    console.log(`\n🔍 [DB READ: getCandidateResults] Querying '${RESULTS_SUBCOLLECTION}' for: ${candidateName} (${cleanEmail || "No email"})`);

    if (cleanEmail) {
      const q = query(
        collection(db, RESULTS_SUBCOLLECTION),
        where("candidateEmail", "==", cleanEmail)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((d) => {
        resultsMap.set(d.id, { id: d.id, ...d.data() } as ResultDocument);
      });
    }

    if (candidateName && candidateName.trim()) {
      const q = query(
        collection(db, RESULTS_SUBCOLLECTION),
        where("candidateName", "==", candidateName.trim())
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((d) => {
        if (!resultsMap.has(d.id)) {
          resultsMap.set(d.id, { id: d.id, ...d.data() } as ResultDocument);
        }
      });
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

// ── Exam Session Lifecycle (Server-Authoritative) ───────────────────────────

export const SESSIONS_COLLECTION = "exam_sessions";

export async function createOrGetExamSession(params: {
  examId: string;
  examTitle: string;
  candidateName: string;
  candidateEmail: string;
  totalTimeMinutes: number;
  scheduledDate?: string;
  scheduledEndTime?: string;
}): Promise<{ session: ExamSession; isNew: boolean }> {
  const cleanEmail = params.candidateEmail.trim().toLowerCase();
  const cleanName = params.candidateName.trim();
  const now = Date.now();

  // Deterministic Active Session ID for (candidateEmail + examId)
  const sessionId = `sess_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}_${params.examId.replace(/[^a-z0-9]/gi, "_")}`;
  const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);

  try {
    const existingSnap = await getDoc(sessionDocRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as ExamSession;
      if (data.status === "in_progress") {
        if (now < data.expiresAt) {
          console.log(`⏱️ [SESSION] Restoring ongoing active session '${sessionId}' (Expires in ${Math.round((data.expiresAt - now) / 1000)}s)`);
          return { session: { ...data, id: sessionId }, isNew: false };
        } else {
          console.log(`⏱️ [SESSION] Active session '${sessionId}' expired at ${new Date(data.expiresAt).toISOString()}`);
          await setDoc(sessionDocRef, { status: "expired" }, { merge: true });
        }
      }
    }

    // Calculate duration
    let nominalDurationSec = (params.totalTimeMinutes || 30) * 60;
    if (params.scheduledDate && params.scheduledEndTime) {
      const endIso = `${params.scheduledDate}T${params.scheduledEndTime}:00`;
      const endMs = new Date(endIso).getTime();
      if (!isNaN(endMs)) {
        const untilEndSec = Math.max(0, Math.floor((endMs - now) / 1000));
        nominalDurationSec = Math.min(nominalDurationSec, untilEndSec);
      }
    }

    const expiresAt = now + nominalDurationSec * 1000;
    const newSession: ExamSession = {
      id: sessionId,
      examId: params.examId,
      examTitle: params.examTitle,
      candidateName: cleanName,
      candidateEmail: cleanEmail,
      serverStartTime: now,
      expiresAt: expiresAt,
      totalTimeSeconds: nominalDurationSec,
      status: "in_progress",
      tabSwitchCount: 0,
      createdAt: new Date(now).toISOString(),
    };

    await setDoc(sessionDocRef, newSession);
    console.log(`🌱 [SESSION] Created new server-authoritative session '${sessionId}' (Duration: ${nominalDurationSec}s)`);
    return { session: newSession, isNew: true };
  } catch (err) {
    console.error("Error creating/getting exam session:", err);
    throw err;
  }
}

export async function getExamSessionById(sessionId: string): Promise<ExamSession | null> {
  try {
    const snap = await getDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as ExamSession;
    }
  } catch (err) {
    console.error("Error fetching session by ID:", err);
  }
  return null;
}

export async function completeExamSession(sessionId: string): Promise<void> {
  try {
    await setDoc(
      doc(db, SESSIONS_COLLECTION, sessionId),
      {
        status: "completed",
        submittedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`🏁 [SESSION] Marked session '${sessionId}' as completed.`);
  } catch (err) {
    console.error("Error completing exam session:", err);
  }
}

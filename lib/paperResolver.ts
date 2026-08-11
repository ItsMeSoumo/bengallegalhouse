import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { ExamPaper } from "@/lib/types";
import { initialExamPapers } from "@/lib/examRegistry";
import { serverQuestions } from "@/lib/serverQuestions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// In-Memory cache for resolved papers across all routes
interface CachedResolvedPaper {
  paper: ExamPaper;
  timestamp: number;
}

const paperCache = new Map<string, CachedResolvedPaper>();
const PAPER_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Resolves an exam paper by ID with canonical ID validation, in-memory caching,
 * and a single unified auto-seed definition for initial exam papers.
 */
export async function resolveExamPaper(examId: string): Promise<ExamPaper | null> {
  if (!examId || typeof examId !== "string") return null;

  const cleanExamId = examId.trim();

  // 1. Check in-memory warm cache first
  const cached = paperCache.get(cleanExamId);
  if (cached && Date.now() - cached.timestamp < PAPER_CACHE_TTL_MS) {
    return cached.paper;
  }

  try {
    // 2. Fetch paper document directly by ID from Firestore DB
    const docRef = doc(db, "exam_papers", cleanExamId);
    const docSnap = await getDoc(docRef);

    let paper: ExamPaper | null = null;

    if (docSnap.exists()) {
      paper = docSnap.data() as ExamPaper;
    } else {
      // Check if this examId matches a known canonical initial exam paper
      const canonicalMatch = initialExamPapers.find(
        (p) => p.id === cleanExamId || p.id.toLowerCase() === cleanExamId.toLowerCase()
      );

      if (canonicalMatch) {
        console.log(`🌱 [PAPER RESOLVER] Auto-seeding canonical paper '${cleanExamId}' to Firestore...`);
        paper = {
          ...canonicalMatch,
          id: cleanExamId,
          questions:
            Array.isArray(canonicalMatch.questions) && canonicalMatch.questions.length > 0
              ? canonicalMatch.questions
              : serverQuestions,
        };

        // Asynchronously persist single canonical definition to Firestore
        setDoc(docRef, paper, { merge: true }).catch((err) =>
          console.warn("Paper auto-seed write error:", err)
        );
      } else {
        // Fallback search across collection for custom registered papers
        const allSnap = await getDocs(collection(db, "exam_papers"));
        const found = allSnap.docs.find((d) => d.id === cleanExamId || d.data().id === cleanExamId);
        if (found) {
          paper = found.data() as ExamPaper;
        }
      }
    }

    // Ensure paper has valid questions
    if (paper && Array.isArray(paper.questions) && paper.questions.length > 0) {
      paperCache.set(cleanExamId, { paper, timestamp: Date.now() });
      return paper;
    }
  } catch (err) {
    console.error(`Error resolving exam paper '${cleanExamId}':`, err);
  }

  return null;
}

/**
 * Manually evict a paper from the in-memory cache (e.g. when updated by Admin)
 */
export function invalidatePaperCache(examId: string): void {
  if (examId) {
    paperCache.delete(examId.trim());
  }
}

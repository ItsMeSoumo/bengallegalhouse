// ── Exam Registry — Client-Safe (NO serverQuestions import) ──────────────────
// Questions are loaded from Firestore DB via /api/exam/questions (server-side).
// This file contains only exam paper METADATA for UI display purposes.
// correctAnswer values are NEVER present here on the client.

import { ExamPaper, ServerQuestion } from "./types";
import {
  saveExamPaperInDB,
  deleteExamPaperInDB,
  getExamPapersFromDB,
  seedExamPapersToDB,
} from "./firebase";

// Metadata-only exam papers (questions: [] — loaded from DB at runtime)
export const initialExamPapers: ExamPaper[] = [
  {
    id: "culet-2026-comprehensive-mock-3",
    title: "Comprehensive Mock Examination & Practice Booklet 2026",
    subtitle: "Advanced Multidisciplinary Assessment (100 Questions)",
    description: "Full 100-question multidisciplinary assessment paper covering Vocabulary, Quantitative Aptitude, Constitution, Legal Principles, and Reasoning.",
    totalTimeMinutes: 120,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 1,
    status: "active",
    questions: [], // Loaded from Firestore DB at runtime
  },
  {
    id: "culet-2026-hard-mixed",
    title: "CULET-2026 MOCK TEST — HARD MIXED SET",
    subtitle: "Comprehensive Law Practice Exam",
    description: "Challenge yourself with a fully mixed 100-question practice set covering General Knowledge (25), English (35), Current Affairs (20), Quantitative Aptitude (10), Logical Reasoning (5), and Legal Aptitude (5).",
    totalTimeMinutes: 120,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 1,
    status: "active",
    questions: [], // Questions loaded from Firestore — never bundled client-side
  },
  {
    id: "culet-2026-mock-2",
    title: "CULET-2026 MOCK TEST 2",
    subtitle: "Law Entrance Practice Examination",
    description: "Complete 100-question comprehensive mock exam covering Constitutional Law, Legal Reasoning, Logical Reasoning, English, and General Knowledge.",
    totalTimeMinutes: 120,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 1,
    status: "active",
    questions: [], // Questions loaded from Firestore — never bundled client-side
  },
  {
    id: "legal-aptitude-mock-1",
    title: "Legal Aptitude & Constitutional Law Test",
    subtitle: "Subject Specialization Paper",
    description: "Focused 30-question assessment on Legal Principles, Law of Torts, Indian Constitution, and Criminal Law.",
    totalTimeMinutes: 40,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 50,
    maxAttempts: 1,
    status: "active",
    questions: [],
  },
  {
    id: "gk-current-affairs-1",
    title: "General Knowledge & Legal Awareness Practice",
    subtitle: "Quick Practice Paper",
    description: "20-question speed drill on General Knowledge, Landmark Court Rulings, and Current Legal Affairs.",
    totalTimeMinutes: 25,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 3,
    status: "active",
    questions: [],
  },
];

const STORAGE_KEY = "soham_cbt_exam_papers";

function loadFromStorage(): ExamPaper[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((p: ExamPaper) => ({
            ...p,
            questions: Array.isArray(p?.questions) ? p.questions : [],
          }));
        }
      }
    } catch (e) {
      console.error("Error reading exam papers from localStorage:", e);
    }
  }
  return [...initialExamPapers];
}

function saveToStorage(papers: ExamPaper[]): void {
  currentExamPapers = papers;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    } catch (e) {
      console.error("Error saving exam papers to localStorage:", e);
    }
  }
}

// Helper to save paper array to local storage and sync with Firestore DB
function persistPapersAndSync(papers: ExamPaper[], targetPaper?: ExamPaper, deleteId?: string): void {
  try {
    saveToStorage(papers);
    if (targetPaper) {
      saveExamPaperInDB(targetPaper).catch((err) =>
        console.error("DB save failed for exam paper:", targetPaper.id, err)
      );
    }
    if (deleteId) {
      deleteExamPaperInDB(deleteId).catch((err) =>
        console.error("DB delete failed for exam paper ID:", deleteId, err)
      );
    }
  } catch (err) {
    console.error("Error in persistPapersAndSync:", err);
  }
}

// In-memory global store initialized from storage
let currentExamPapers: ExamPaper[] = loadFromStorage();

export async function syncExamPapersWithDB(): Promise<ExamPaper[]> {
  try {
    const dbPapers = await getExamPapersFromDB(initialExamPapers);
    if (Array.isArray(dbPapers) && dbPapers.length > 0) {
      saveToStorage(dbPapers);
      return dbPapers;
    }
  } catch (err) {
    console.warn("DB sync warning:", err);
  }
  return getExamPapers();
}

export function getExamPapers(): ExamPaper[] {
  try {
    currentExamPapers = loadFromStorage();
    return currentExamPapers || [];
  } catch (err) {
    console.error("Error in getExamPapers:", err);
    return initialExamPapers;
  }
}

export function getExamPaperById(id: string): ExamPaper | undefined {
  if (!id) return undefined;
  try {
    const papers = getExamPapers();
    return papers.find((p) => p && p.id === id);
  } catch (err) {
    console.error("Error in getExamPaperById:", err);
    return undefined;
  }
}

export function addExamPaper(paper: ExamPaper): void {
  if (!paper || !paper.id) return;
  const papers = getExamPapers();
  papers.push(paper);
  persistPapersAndSync(papers, paper);
}

export function updateExamPaper(updated: ExamPaper): void {
  if (!updated || !updated.id) return;
  const papers = getExamPapers();
  const idx = papers.findIndex((p) => p && p.id === updated.id);
  if (idx !== -1) {
    papers[idx] = updated;
    persistPapersAndSync(papers, updated);
  }
}

export function deleteExamPaper(id: string): void {
  if (!id) return;
  const papers = getExamPapers();
  const filtered = papers.filter((p) => p && p.id !== id);
  persistPapersAndSync(filtered, undefined, id);
}

export function addQuestionToExam(examId: string, newQ: ServerQuestion): void {
  if (!examId || !newQ) return;
  const papers = getExamPapers();
  const paper = papers.find((p) => p && p.id === examId);
  if (paper) {
    if (!Array.isArray(paper.questions)) paper.questions = [];
    paper.questions.push(newQ);
    persistPapersAndSync(papers, paper);
  }
}

export function resetExamPapersToDefault(): void {
  try {
    saveToStorage([...initialExamPapers]);
    seedExamPapersToDB(initialExamPapers).catch((err) =>
      console.error("Error seeding default papers to DB:", err)
    );
  } catch (err) {
    console.error("Error in resetExamPapersToDefault:", err);
  }
}


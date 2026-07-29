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
          return parsed.map((p: ExamPaper) => ({ ...p, questions: p.questions || [] }));
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

// In-memory global store initialized from storage
let currentExamPapers: ExamPaper[] = loadFromStorage();


export async function syncExamPapersWithDB(): Promise<ExamPaper[]> {
  try {
    const dbPapers = await getExamPapersFromDB(initialExamPapers);
    if (dbPapers && dbPapers.length > 0) {
      saveToStorage(dbPapers);
      return dbPapers;
    }
  } catch (err) {
    console.warn("DB sync warning:", err);
  }
  return getExamPapers();
}

export function getExamPapers(): ExamPaper[] {
  currentExamPapers = loadFromStorage();
  return currentExamPapers;
}

export function getExamPaperById(id: string): ExamPaper | undefined {
  const papers = getExamPapers();
  return papers.find((p) => p.id === id);
}

export function addExamPaper(paper: ExamPaper): void {
  const papers = getExamPapers();
  papers.push(paper);
  saveToStorage(papers);
  saveExamPaperInDB(paper);
}

export function updateExamPaper(updated: ExamPaper): void {
  const papers = getExamPapers();
  const idx = papers.findIndex((p) => p.id === updated.id);
  if (idx !== -1) {
    papers[idx] = updated;
    saveToStorage(papers);
    saveExamPaperInDB(updated);
  }
}

export function deleteExamPaper(id: string): void {
  const papers = getExamPapers();
  const filtered = papers.filter((p) => p.id !== id);
  saveToStorage(filtered);
  deleteExamPaperInDB(id);
}

export function addQuestionToExam(examId: string, newQ: ServerQuestion): void {
  const papers = getExamPapers();
  const paper = papers.find((p) => p.id === examId);
  if (paper) {
    if (!paper.questions) paper.questions = [];
    paper.questions.push(newQ);
    saveToStorage(papers);
    saveExamPaperInDB(paper);
  }
}

export function resetExamPapersToDefault(): void {
  saveToStorage([...initialExamPapers]);
  seedExamPapersToDB(initialExamPapers);
}

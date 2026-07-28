import { ExamPaper, ServerQuestion } from "./types";
import { serverQuestions } from "./serverQuestions";

export const initialExamPapers: ExamPaper[] = [
  {
    id: "culet-2026-mock-2",
    title: "CULET-2026 MOCK TEST 2",
    subtitle: "Law Entrance Practice Examination",
    description: "Complete 100-question comprehensive mock exam covering Constitutional Law, Legal Reasoning, Logical Reasoning, English, and General Knowledge.",
    totalTimeMinutes: 120,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    status: "active",
    questions: serverQuestions,
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
    status: "active",
    questions: serverQuestions.slice(0, 30),
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
    status: "active",
    questions: serverQuestions.slice(30, 50),
  },
];

// In-memory global store to allow dynamic changes during session
let currentExamPapers: ExamPaper[] = [...initialExamPapers];

export function getExamPapers(): ExamPaper[] {
  return currentExamPapers;
}

export function getExamPaperById(id: string): ExamPaper | undefined {
  return currentExamPapers.find((p) => p.id === id);
}

export function addExamPaper(paper: ExamPaper): void {
  currentExamPapers.push(paper);
}

export function updateExamPaper(updated: ExamPaper): void {
  const idx = currentExamPapers.findIndex((p) => p.id === updated.id);
  if (idx !== -1) {
    currentExamPapers[idx] = updated;
  }
}

export function deleteExamPaper(id: string): void {
  currentExamPapers = currentExamPapers.filter((p) => p.id !== id);
}

export function addQuestionToExam(examId: string, newQ: ServerQuestion): void {
  const paper = currentExamPapers.find((p) => p.id === examId);
  if (paper) {
    paper.questions.push(newQ);
  }
}

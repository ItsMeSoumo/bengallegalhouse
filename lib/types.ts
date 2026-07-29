// ── Question Types ──────────────────────────────────────────────────────────

export interface PublicQuestion {
  id: number;
  question: string;
  options: string[];
  subject: string;
}

export interface ServerQuestion extends PublicQuestion {
  correctAnswer: number; // index of correct option (0-3)
  explanation?: string;
}

// Retain Question interface as alias for public view or admin view
export type Question = PublicQuestion;

// ── Exam Paper Management ───────────────────────────────────────────────────

export interface ExamPaper {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalTimeMinutes: number; // in minutes
  marksPerCorrect: number;
  negativeMarks: number;
  passingPercentage: number;
  maxAttempts: number; // 0 = unlimited, 1, 2, 3, etc.
  status: "active" | "paused";
  questions: ServerQuestion[];
  // ── Exam Scheduling (optional) ──
  scheduledDate?: string;      // ISO date string e.g. "2026-07-30"
  scheduledStartTime?: string; // 24h format e.g. "13:00"
  scheduledEndTime?: string;   // 24h format e.g. "14:00"
}

// ── Exam Configuration ─────────────────────────────────────────────────────

export interface ExamConfig {
  totalTime: number; // in seconds
  marksPerCorrect: number;
  negativeMarks: number; // deducted per wrong answer
  passingPercentage: number;
  totalQuestions: number;
}

// ── Exam State ──────────────────────────────────────────────────────────────

export type QuestionStatus =
  | "unanswered"
  | "answered"
  | "marked"
  | "marked-answered"
  | "current";

export interface ExamState {
  candidateName: string;
  currentQuestionIndex: number;
  answers: (number | null)[]; // selected option index or null
  markedForReview: boolean[];
  visitedQuestions: boolean[];
  isSubmitted: boolean;
  startTime: number;
  endTime: number | null;
  tabSwitchCount: number;
  examId?: string;
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface ExamResult {
  examId?: string;
  examTitle?: string;
  candidateName: string;
  candidateEmail?: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // in seconds
  submittedAt: string; // ISO string
  answers: (number | null)[];
  tabSwitchCount?: number;
  autoSubmitted?: boolean;
}

// ── Firebase Document ───────────────────────────────────────────────────────

export interface ResultDocument extends ExamResult {
  id?: string;
  studentDocId?: string;
}

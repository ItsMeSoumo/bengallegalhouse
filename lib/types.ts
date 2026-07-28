// ── Question Types ──────────────────────────────────────────────────────────

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option (0-3)
  subject: string;
  explanation?: string;
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
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface ExamResult {
  candidateName: string;
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
}

// ── Firebase Document ───────────────────────────────────────────────────────

export interface ResultDocument extends ExamResult {
  id?: string;
}

// ── Status & Enum Types ──────────────────────────────────────────────────────

/** Exam availability status */
export type ExamStatus = "active" | "paused";

/** Question status for UI rendering in palette and controls */
export type QuestionStatus =
  | "unanswered"
  | "answered"
  | "marked"
  | "marked-answered"
  | "current";

// ── Question Types ──────────────────────────────────────────────────────────

/** Publicly safe question model stripped of correct answer and solution explanation */
export interface PublicQuestion {
  id: number;
  question: string;
  options: string[];
  subject?: string;
}

/** Full server-side question model including evaluation key and explanatory details */
export interface ServerQuestion extends PublicQuestion {
  correctAnswer: number; // index of correct option (0-3)
  explanation?: string;
}

/** Alias for question representation */
export type Question = PublicQuestion;

// ── Exam Paper Management ───────────────────────────────────────────────────

/** Definition of an examination paper configured by administrators */
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
  status: ExamStatus;
  isPrivate?: boolean; // true = hidden from students, false/undefined = public/visible
  questions: ServerQuestion[];
  // ── Exam Scheduling (optional) ──
  scheduledDate?: string;      // ISO date string e.g. "2026-07-30"
  scheduledStartTime?: string; // 24h format e.g. "13:00"
  scheduledEndTime?: string;   // 24h format e.g. "14:00"
}

// ── Exam Configuration ─────────────────────────────────────────────────────

/** Configuration defaults for exam grading and time boundaries */
export interface ExamConfig {
  totalTime: number; // in seconds
  marksPerCorrect: number;
  negativeMarks: number; // deducted per wrong answer
  passingPercentage: number;
  totalQuestions: number;
}

// ── Exam State ──────────────────────────────────────────────────────────────

/** Dynamic runtime state for student taking an active examination */
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

/** Evaluated result metrics for a completed examination */
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

/** Firestore database document structure for exam results */
export interface ResultDocument extends ExamResult {
  id?: string;
  studentDocId?: string;
}


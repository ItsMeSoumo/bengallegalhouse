import { ExamConfig } from "./types";

// ── Exam Configuration ──────────────────────────────────────────────────────

/**
 * Standard default configuration for examination duration, scoring, and passing criteria.
 */
export const EXAM_CONFIG: ExamConfig = {
  /** Total exam duration: 7200 seconds (120 minutes / 2 hours) */
  totalTime: 7200,
  /** Score reward per correctly answered question */
  marksPerCorrect: 1,
  /** Penalty deduction per incorrectly answered question */
  negativeMarks: 0.25,
  /** Minimum score percentage required to pass the test */
  passingPercentage: 40,
  /** Default count of questions in standard paper */
  totalQuestions: 100,
};

// ── Palette Colors ──────────────────────────────────────────────────────────

/**
 * Tailwind styling class mapping for question palette status visual indicators.
 */
export const PALETTE_COLORS = {
  current: "bg-gold-500 text-navy-950 border-gold-400",
  answered: "bg-success/80 text-white border-success",
  markedAnswered: "bg-purple/80 text-white border-purple",
  marked: "bg-warning/80 text-navy-950 border-warning",
  unanswered: "bg-navy-700/60 text-foreground/50 border-navy-600/40",
};

// ── Exam Info Display ───────────────────────────────────────────────────────

/**
 * Static metadata and candidate instruction rules displayed on the exam overview screen.
 */
export const EXAM_INFO = {
  title: "Law Practice CBT",
  subtitle: "CULET-2026 Mock Test 2",
  examName: "Comprehensive Practice Paper for Law Entrance Examination",
  description:
    "This examination contains 100 mandatory questions covering Legal Aptitude, General Knowledge, Reasoning, English, and Current Affairs.",
  rules: [
    `Total Questions: ${EXAM_CONFIG.totalQuestions}`,
    `Time Limit: ${EXAM_CONFIG.totalTime / 60} minutes`,
    `Correct Answer: +${EXAM_CONFIG.marksPerCorrect} mark`,
    `Wrong Answer: -${EXAM_CONFIG.negativeMarks} mark`,
    `Unanswered: 0 marks`,
    `Maximum Marks: ${EXAM_CONFIG.totalQuestions * EXAM_CONFIG.marksPerCorrect}`,
    "Strict Anti-Cheating Protocol Enabled",
    "Tab switching or window minimization is monitored",
    "Exam auto-submits on 4th tab switch or when timer expires",
    "Right-click, text copy, and keyboard shortcuts are disabled",
  ],
};

// ── Timer Thresholds ────────────────────────────────────────────────────────

/**
 * Remaining time thresholds (in seconds) for triggering visual warning alerts in the UI timer.
 */
export const TIMER_THRESHOLDS = {
  /** Trigger amber warning indicator when 10 minutes (600s) remain */
  warning: 600,
  /** Trigger red critical alert indicator when 3 minutes (180s) remain */
  danger: 180,
};


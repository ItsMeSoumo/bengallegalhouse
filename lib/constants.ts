import { ExamConfig } from "./types";

// ── Exam Configuration (Hardcoded) ──────────────────────────────────────────

export const EXAM_CONFIG: ExamConfig = {
  totalTime: 7200, // 120 minutes in seconds (2 hours)
  marksPerCorrect: 4, // +4 for each correct answer
  negativeMarks: 1, // -1 for each wrong answer
  passingPercentage: 40, // 40% to pass
  totalQuestions: 100,
};

// ── Exam Info Display ───────────────────────────────────────────────────────

export const EXAM_INFO = {
  title: "Law Practice CBT",
  subtitle: "CULET-2026 Mock Test 2",
  examName: "Comprehensive Practice Paper for Law Entrance Examination",
  description:
    "This examination contains 100 mandatory questions covering Legal Aptitude, General Knowledge, Reasoning, English, and Current Affairs.",
  rules: [
    `Total Questions: ${EXAM_CONFIG.totalQuestions}`,
    `Time Limit: ${EXAM_CONFIG.totalTime / 60} minutes`,
    `Correct Answer: +${EXAM_CONFIG.marksPerCorrect} marks`,
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

export const TIMER_THRESHOLDS = {
  warning: 600, // 10 minutes — turns yellow
  danger: 180, // 3 minutes — turns red + pulse
};

// ── Question Palette Colors ─────────────────────────────────────────────────

export const PALETTE_COLORS = {
  current: "#d4a843", // gold
  answered: "#22c55e", // green
  markedAnswered: "#a855f7", // purple
  marked: "#f59e0b", // amber
  unanswered: "#374151", // grey
  visited: "#1e293b", // dark slate
};

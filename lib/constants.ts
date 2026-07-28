import { ExamConfig } from "./types";

// ── Exam Configuration (Hardcoded) ──────────────────────────────────────────

export const EXAM_CONFIG: ExamConfig = {
  totalTime: 1800, // 30 minutes in seconds
  marksPerCorrect: 4, // +4 for each correct answer
  negativeMarks: 1, // -1 for each wrong answer
  passingPercentage: 40, // 40% to pass
  totalQuestions: 30,
};

// ── Exam Info Display ───────────────────────────────────────────────────────

export const EXAM_INFO = {
  title: "Bengal Legal House",
  subtitle: "Computer Based Test",
  examName: "Legal Aptitude Assessment",
  description:
    "This examination tests your knowledge of Indian law including Constitutional Law, IPC, CrPC, CPC, Evidence Act, Contract Act, and Family Law.",
  rules: [
    `Total Questions: ${EXAM_CONFIG.totalQuestions}`,
    `Time Limit: ${EXAM_CONFIG.totalTime / 60} minutes`,
    `Correct Answer: +${EXAM_CONFIG.marksPerCorrect} marks`,
    `Wrong Answer: -${EXAM_CONFIG.negativeMarks} mark`,
    `Unanswered: 0 marks`,
    `Maximum Marks: ${EXAM_CONFIG.totalQuestions * EXAM_CONFIG.marksPerCorrect}`,
    `Passing: ${EXAM_CONFIG.passingPercentage}%`,
    "No switching between tabs during exam",
    "Exam auto-submits when time expires",
  ],
};

// ── Timer Thresholds ────────────────────────────────────────────────────────

export const TIMER_THRESHOLDS = {
  warning: 300, // 5 minutes — turns yellow
  danger: 60, // 1 minute — turns red + pulse
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

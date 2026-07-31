import { EXAM_CONFIG } from "./constants";
import { ExamResult, ExamState, ServerQuestion, QuestionStatus } from "./types";

// ── Time Formatting ─────────────────────────────────────────────────────────

export function formatTime(totalSeconds: number): string {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ── Score Calculation ───────────────────────────────────────────────────────

export function calculateScore(
  answers: (number | null)[],
  questions: ServerQuestion[]
): {
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
} {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  safeQuestions.forEach((q, index) => {
    const answer = safeAnswers[index];
    if (answer === null || answer === undefined) {
      unansweredCount++;
    } else if (q && typeof q.correctAnswer === "number" && answer === q.correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const rawMarks =
    correctCount * (EXAM_CONFIG?.marksPerCorrect ?? 1) -
    wrongCount * (EXAM_CONFIG?.negativeMarks ?? 0.25);

  const totalMarks = Math.round(rawMarks * 100) / 100;

  const maxMarks = safeQuestions.length * (EXAM_CONFIG?.marksPerCorrect ?? 1);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
  const passingPercentage = EXAM_CONFIG?.passingPercentage ?? 40;
  const passed = percentage >= passingPercentage;

  return {
    correctCount,
    wrongCount,
    unansweredCount,
    totalMarks,
    maxMarks,
    percentage: Math.round(percentage * 100) / 100,
    passed,
  };
}

// ── Question Status ─────────────────────────────────────────────────────────

export function getQuestionStatus(
  index: number,
  state: ExamState
): QuestionStatus {
  if (!state || typeof index !== "number" || index < 0) return "unanswered";

  if (index === state.currentQuestionIndex) return "current";

  const answers = Array.isArray(state.answers) ? state.answers : [];
  const markedForReview = Array.isArray(state.markedForReview) ? state.markedForReview : [];

  const isAnswered = answers[index] !== null && answers[index] !== undefined;
  const isMarked = Boolean(markedForReview[index]);

  if (isMarked && isAnswered) return "marked-answered";
  if (isMarked) return "marked";
  if (isAnswered) return "answered";
  return "unanswered";
}

// ── Build Exam Result ───────────────────────────────────────────────────────

export function buildExamResult(
  state: ExamState,
  questions: ServerQuestion[]
): ExamResult {
  const safeState: ExamState = state || {
    candidateName: "Candidate",
    currentQuestionIndex: 0,
    answers: [],
    markedForReview: [],
    visitedQuestions: [],
    isSubmitted: true,
    startTime: Date.now(),
    endTime: Date.now(),
    tabSwitchCount: 0,
  };
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const scoreData = calculateScore(safeState.answers, safeQuestions);
  const totalTime = EXAM_CONFIG?.totalTime ?? 1800;
  const timeTaken =
    typeof safeState.endTime === "number" && typeof safeState.startTime === "number"
      ? Math.max(0, Math.floor((safeState.endTime - safeState.startTime) / 1000))
      : totalTime;

  return {
    candidateName: safeState.candidateName || "Candidate",
    totalQuestions: safeQuestions.length,
    ...scoreData,
    timeTaken,
    submittedAt: new Date().toISOString(),
    answers: safeState.answers || [],
  };
}

// ── Class Name Helper ───────────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}


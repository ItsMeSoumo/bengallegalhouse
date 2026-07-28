import { EXAM_CONFIG } from "./constants";
import { ExamResult, ExamState, ServerQuestion, QuestionStatus } from "./types";

// ── Time Formatting ─────────────────────────────────────────────────────────

export function formatTime(totalSeconds: number): string {
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
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  answers.forEach((answer, index) => {
    if (answer === null || answer === undefined) {
      unansweredCount++;
    } else if (index < questions.length && answer === questions[index].correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const rawMarks =
    correctCount * EXAM_CONFIG.marksPerCorrect -
    wrongCount * EXAM_CONFIG.negativeMarks;

  const totalMarks = Math.round(rawMarks * 100) / 100;

  const maxMarks = questions.length * EXAM_CONFIG.marksPerCorrect;
  const percentage = (totalMarks / maxMarks) * 100;
  const passed = percentage >= EXAM_CONFIG.passingPercentage;

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
  if (index === state.currentQuestionIndex) return "current";

  const isAnswered = state.answers[index] !== null;
  const isMarked = state.markedForReview[index];

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
  const scoreData = calculateScore(state.answers, questions);
  const timeTaken = state.endTime
    ? Math.floor((state.endTime - state.startTime) / 1000)
    : EXAM_CONFIG.totalTime;

  return {
    candidateName: state.candidateName,
    totalQuestions: questions.length,
    ...scoreData,
    timeTaken,
    submittedAt: new Date().toISOString(),
    answers: state.answers,
  };
}

// ── Class Name Helper ───────────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

import { PublicQuestion } from "./types";
import { serverQuestions } from "./serverQuestions";

// ── 100 Public MCQs (Stripped of correctAnswer and explanation for Client Security) ──

export const questions: PublicQuestion[] = serverQuestions.map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ correctAnswer, explanation, ...publicFields }) => publicFields
);

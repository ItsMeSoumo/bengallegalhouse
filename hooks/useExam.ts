"use client";

import { useState, useCallback } from "react";
import { ExamState, Question } from "@/lib/types";

/**
 * Type guard to verify if an unknown object conforms to the ExamState interface structure.
 */
export function isValidExamState(obj: unknown): obj is ExamState {
  if (typeof obj !== "object" || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.candidateName === "string" &&
    typeof s.currentQuestionIndex === "number" &&
    Array.isArray(s.answers) &&
    Array.isArray(s.markedForReview) &&
    Array.isArray(s.visitedQuestions) &&
    typeof s.isSubmitted === "boolean" &&
    typeof s.startTime === "number" &&
    (s.endTime === null || typeof s.endTime === "number") &&
    typeof s.tabSwitchCount === "number"
  );
}

interface UseExamReturn {
  state: ExamState;
  selectAnswer: (optionIndex: number) => void;
  clearAnswer: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  toggleMark: () => void;
  initExam: (candidateName: string, restoredState?: Partial<ExamState>) => void;
  incrementTabSwitch: () => number;
}

const createInitialState = (totalQuestions: number): ExamState => ({
  candidateName: "",
  currentQuestionIndex: 0,
  answers: new Array(totalQuestions).fill(null),
  markedForReview: new Array(totalQuestions).fill(false),
  visitedQuestions: new Array(totalQuestions).fill(false),
  isSubmitted: false,
  startTime: Date.now(),
  endTime: null,
  tabSwitchCount: 0,
});

export function useExam(questions: Question[]): UseExamReturn {
  const totalQuestions = questions.length;
  const [state, setState] = useState<ExamState>(() => createInitialState(totalQuestions));

  const initExam = useCallback(
    (candidateName: string, restoredState?: Partial<ExamState>) => {
      setState(() => {
        const defaultState = createInitialState(totalQuestions);
        if (!restoredState) {
          return { ...defaultState, candidateName };
        }

        const answers =
          Array.isArray(restoredState.answers) && restoredState.answers.length === totalQuestions
            ? restoredState.answers
            : defaultState.answers;

        const markedForReview =
          Array.isArray(restoredState.markedForReview) && restoredState.markedForReview.length === totalQuestions
            ? restoredState.markedForReview
            : defaultState.markedForReview;

        const visitedQuestions =
          Array.isArray(restoredState.visitedQuestions) && restoredState.visitedQuestions.length === totalQuestions
            ? restoredState.visitedQuestions
            : (() => {
                const visited = new Array(totalQuestions).fill(false);
                if (totalQuestions > 0) visited[0] = true;
                return visited;
              })();

        const newState: ExamState = {
          candidateName: candidateName || restoredState.candidateName || "",
          currentQuestionIndex:
            typeof restoredState.currentQuestionIndex === "number" &&
            restoredState.currentQuestionIndex >= 0 &&
            restoredState.currentQuestionIndex < totalQuestions
              ? restoredState.currentQuestionIndex
              : 0,
          answers,
          markedForReview,
          visitedQuestions,
          isSubmitted: Boolean(restoredState.isSubmitted),
          startTime: typeof restoredState.startTime === "number" ? restoredState.startTime : Date.now(),
          endTime: typeof restoredState.endTime === "number" ? restoredState.endTime : null,
          tabSwitchCount: typeof restoredState.tabSwitchCount === "number" ? restoredState.tabSwitchCount : 0,
        };

        return isValidExamState(newState) ? newState : defaultState;
      });
    },
    [totalQuestions]
  );

  const selectAnswer = useCallback((optionIndex: number) => {
    setState((prev) => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = optionIndex;
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const clearAnswer = useCallback(() => {
    setState((prev) => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = null;
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex >= totalQuestions - 1) return prev;
      const nextIdx = prev.currentQuestionIndex + 1;
      const newVisited = [...prev.visitedQuestions];
      newVisited[nextIdx] = true;
      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        visitedQuestions: newVisited,
      };
    });
  }, [totalQuestions]);

  const prevQuestion = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex <= 0) return prev;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
    });
  }, []);

  const jumpToQuestion = useCallback(
    (index: number) => {
      setState((prev) => {
        if (index < 0 || index >= totalQuestions) return prev;
        const newVisited = [...prev.visitedQuestions];
        newVisited[index] = true;
        return {
          ...prev,
          currentQuestionIndex: index,
          visitedQuestions: newVisited,
        };
      });
    },
    [totalQuestions]
  );

  const toggleMark = useCallback(() => {
    setState((prev) => {
      const newMarked = [...prev.markedForReview];
      newMarked[prev.currentQuestionIndex] = !newMarked[prev.currentQuestionIndex];
      return { ...prev, markedForReview: newMarked };
    });
  }, []);

  const incrementTabSwitch = useCallback((): number => {
    let newCount = 0;
    setState((prev) => {
      newCount = prev.tabSwitchCount + 1;
      return { ...prev, tabSwitchCount: newCount };
    });
    return newCount;
  }, []);

  return {
    state,
    selectAnswer,
    clearAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleMark,
    initExam,
    incrementTabSwitch,
  };
}


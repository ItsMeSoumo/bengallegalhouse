"use client";

import { useState, useCallback } from "react";
import { ExamState, Question } from "@/lib/types";

interface UseExamReturn {
  state: ExamState;
  selectAnswer: (optionIndex: number) => void;
  clearAnswer: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  toggleMark: () => void;
  initExam: (candidateName: string) => void;
  incrementTabSwitch: () => number;
}

export function useExam(questions: Question[]): UseExamReturn {
  const [state, setState] = useState<ExamState>({
    candidateName: "",
    currentQuestionIndex: 0,
    answers: new Array(questions.length).fill(null),
    markedForReview: new Array(questions.length).fill(false),
    visitedQuestions: new Array(questions.length).fill(false),
    isSubmitted: false,
    startTime: Date.now(),
    endTime: null,
    tabSwitchCount: 0,
  });

  const initExam = useCallback(
    (candidateName: string) => {
      setState({
        candidateName,
        currentQuestionIndex: 0,
        answers: new Array(questions.length).fill(null),
        markedForReview: new Array(questions.length).fill(false),
        visitedQuestions: (() => {
          const visited = new Array(questions.length).fill(false);
          visited[0] = true;
          return visited;
        })(),
        isSubmitted: false,
        startTime: Date.now(),
        endTime: null,
        tabSwitchCount: 0,
      });
    },
    [questions.length]
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
      if (prev.currentQuestionIndex >= questions.length - 1) return prev;
      const nextIdx = prev.currentQuestionIndex + 1;
      const newVisited = [...prev.visitedQuestions];
      newVisited[nextIdx] = true;
      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        visitedQuestions: newVisited,
      };
    });
  }, [questions.length]);

  const prevQuestion = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex <= 0) return prev;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
    });
  }, []);

  const jumpToQuestion = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= questions.length) return prev;
      const newVisited = [...prev.visitedQuestions];
      newVisited[index] = true;
      return {
        ...prev,
        currentQuestionIndex: index,
        visitedQuestions: newVisited,
      };
    });
  }, [questions.length]);

  const toggleMark = useCallback(() => {
    setState((prev) => {
      const newMarked = [...prev.markedForReview];
      newMarked[prev.currentQuestionIndex] =
        !newMarked[prev.currentQuestionIndex];
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

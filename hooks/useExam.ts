"use client";

import { useState, useCallback } from "react";
import { ExamState, ExamResult, Question } from "@/lib/types";
import { EXAM_CONFIG } from "@/lib/constants";
import { buildExamResult } from "@/lib/utils";

interface UseExamReturn {
  state: ExamState;
  selectAnswer: (optionIndex: number) => void;
  clearAnswer: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  toggleMark: () => void;
  submitExam: () => ExamResult;
  initExam: (candidateName: string) => void;
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

  const submitExam = useCallback((): ExamResult => {
    const endTime = Date.now();
    setState((prev) => ({
      ...prev,
      isSubmitted: true,
      endTime,
    }));

    const finalState: ExamState = {
      ...state,
      isSubmitted: true,
      endTime,
    };

    return buildExamResult(finalState, questions);
  }, [state, questions]);

  return {
    state,
    selectAnswer,
    clearAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleMark,
    submitExam,
    initExam,
  };
}

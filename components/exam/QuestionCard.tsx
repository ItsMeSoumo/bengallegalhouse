"use client";

import { Question, ServerQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question | ServerQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  isReview?: boolean;
}

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  isReview = false,
}: QuestionCardProps) {
  const optionLabels = ["A", "B", "C", "D"];
  const correctAnswer = "correctAnswer" in question ? (question as ServerQuestion).correctAnswer : undefined;
  const explanation = "explanation" in question ? (question as ServerQuestion).explanation : undefined;

  return (
    <div className="animate-fade-in">
      {/* Subject Badge + Question Number */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-400 border border-gold-500/20">
          {question.subject}
        </span>
        <span className="text-sm text-foreground/40">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-lg md:text-xl font-semibold text-white leading-relaxed mb-8">
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isUnanswered = selectedAnswer === null || selectedAnswer === undefined;
          const isSelected = selectedAnswer === idx;
          const isCorrect = isReview && !isUnanswered && correctAnswer !== undefined && idx === correctAnswer;
          const isWrong = isReview && isSelected && correctAnswer !== undefined && idx !== correctAnswer;

          return (
            <button
              key={idx}
              onClick={() => !isReview && onSelectAnswer(idx)}
              disabled={isReview}
              className={cn(
                "option-card w-full flex items-center gap-4 p-4 rounded-xl border text-left",
                "border-navy-600/50 bg-navy-800/50",
                !isReview && isSelected && "selected",
                isCorrect && "correct",
                isWrong && "wrong",
                isReview && "cursor-default"
              )}
            >
              {/* Option Label */}
              <span
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold",
                  !isReview && isSelected
                    ? "bg-gold-500 text-navy-950"
                    : isCorrect
                      ? "bg-success text-white"
                      : isWrong
                        ? "bg-danger text-white"
                        : "bg-navy-700 text-foreground/60"
                )}
              >
                {optionLabels[idx]}
              </span>

              {/* Option Text */}
              <span
                className={cn(
                  "text-sm md:text-base",
                  isSelected && !isReview
                    ? "text-gold-300"
                    : isCorrect
                      ? "text-green-300"
                      : isWrong
                        ? "text-red-300"
                        : "text-foreground/80"
                )}
              >
                {option}
              </span>

              {/* Correct/Wrong indicator */}
              {isReview && isCorrect && (
                <span className="ml-auto text-success">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              {isWrong && (
                <span className="ml-auto text-danger">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation (review mode) */}
      {isReview && explanation && (
        <div className="mt-6 p-4 rounded-xl bg-info/10 border border-info/20">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">Explanation:</span>{" "}
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

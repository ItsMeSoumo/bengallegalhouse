"use client";

import { ExamResult } from "@/lib/types";
import { Question } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { downloadExamScorecardPDF } from "@/lib/generatePdfReport";
import { EXAM_CONFIG } from "@/lib/constants";
import Card from "@/components/ui/Card";
import QuestionCard from "./QuestionCard";
import { useState } from "react";

interface ResultsCardProps {
  result: ExamResult;
  questions: Question[];
}

export default function ResultsCard({ result, questions }: ResultsCardProps) {
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Score donut
  const maxMarks = result.maxMarks;
  const scorePercent = (result.totalMarks / maxMarks) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const visualPercent = Math.max(0, scorePercent);
  const strokeDashoffset =
    circumference - (visualPercent / 100) * circumference;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score Card */}
      <Card variant={result.passed ? "success" : "error"} className="text-center">
        {/* Pass/Fail Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6",
            result.passed
              ? "bg-success/15 text-success border border-success/30"
              : "bg-danger/15 text-danger border border-danger/30"
          )}
        >
          {result.passed ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {result.passed ? "PASSED" : "FAILED"}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {result.candidateName}
        </h2>
        <p className="text-sm text-foreground/50 mb-8">
          Submitted at{" "}
          {new Date(result.submittedAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {/* Score Donut */}
        <div className="flex justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={result.passed ? "#22c55e" : "#ef4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {result.totalMarks}
              </span>
              <span className="text-xs text-foreground/50">
                / {result.maxMarks}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label="Correct"
            value={result.correctCount}
            suffix={`(+${result.correctCount * EXAM_CONFIG.marksPerCorrect})`}
            color="text-success"
          />
          <StatBox
            label="Wrong"
            value={result.wrongCount}
            suffix={`(-${result.wrongCount * EXAM_CONFIG.negativeMarks})`}
            color="text-danger"
          />
          <StatBox
            label="Unanswered"
            value={result.unansweredCount}
            suffix="(0)"
            color="text-foreground/50"
          />
          <StatBox
            label="Accuracy"
            value={`${result.percentage}%`}
            suffix={`Time: ${formatTime(result.timeTaken)}`}
            color="text-gold-400"
          />
        </div>
      </Card>

      {/* Review & Download PDF Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setShowReview(!showReview)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-700/60 text-foreground/70 hover:text-white hover:bg-navy-600 transition-all cursor-pointer border border-navy-600/40"
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              showReview && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {showReview ? "Hide" : "Review"} Answers
        </button>

        <button
          onClick={() => {
            try {
              downloadExamScorecardPDF(result);
            } catch (err) {
              console.error("Error generating PDF scorecard:", err);
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500 hover:text-navy-950 font-bold transition-all cursor-pointer border border-gold-500/40 shadow-lg"
        >
          📄 Download PDF Scorecard
        </button>
      </div>

      {/* Answer Review */}
      {showReview && (
        <Card className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Answer Review</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                disabled={reviewIndex === 0}
                className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-sm text-foreground/50">
                {reviewIndex + 1} / {questions.length}
              </span>
              <button
                onClick={() =>
                  setReviewIndex(
                    Math.min(questions.length - 1, reviewIndex + 1)
                  )
                }
                disabled={reviewIndex === questions.length - 1}
                className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <QuestionCard
            question={questions[reviewIndex]}
            questionIndex={reviewIndex}
            totalQuestions={questions.length}
            selectedAnswer={result.answers[reviewIndex]}
            onSelectAnswer={() => {}}
            isReview
          />
        </Card>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  suffix: string;
  color: string;
}) {
  return (
    <div className="glass-card-light p-4 rounded-xl text-center">
      <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-foreground/30 mt-1">{suffix}</p>
    </div>
  );
}

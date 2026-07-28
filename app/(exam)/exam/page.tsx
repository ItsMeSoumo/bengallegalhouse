"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ExamHeader from "@/components/exam/ExamHeader";
import QuestionCard from "@/components/exam/QuestionCard";
import QuestionPalette from "@/components/exam/QuestionPalette";
import Button from "@/components/ui/Button";
import { useTimer } from "@/hooks/useTimer";
import { useExam } from "@/hooks/useExam";
import { questions } from "@/lib/questions";
import { EXAM_CONFIG } from "@/lib/constants";

export default function ExamPage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const exam = useExam(questions);
  const currentQuestion = questions[exam.state.currentQuestionIndex];

  // Ref to track latest state for auto-submit
  const examStateRef = useRef(exam.state);
  examStateRef.current = exam.state;

  // Refs for tracking tab switches reliably without React state async latency
  const tabSwitchRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const currentState = examStateRef.current;
      const timeTaken = Math.floor((Date.now() - currentState.startTime) / 1000);
      const activeExamId = sessionStorage.getItem("activeExamId") || "culet-2026-mock-2";

      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: activeExamId,
          candidateName: currentState.candidateName,
          candidateEmail: sessionStorage.getItem("candidateEmail") || "",
          answers: currentState.answers,
          timeTaken,
        }),
      });

      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem("examResult", JSON.stringify(data.result));
      } else {
        console.error("Submission error:", data.error);
      }
      router.push("/results");
    } catch (err) {
      console.error("Failed to submit exam:", err);
      router.push("/results");
    }
  }, [router, isSubmitting]);

  const [examTimeSec, setExamTimeSec] = useState(EXAM_CONFIG.totalTime);

  useEffect(() => {
    const savedTime = sessionStorage.getItem("activeExamTime");
    if (savedTime && !isNaN(Number(savedTime))) {
      setExamTimeSec(Number(savedTime));
    }
  }, []);

  const timer = useTimer(examTimeSec, handleSubmit);

  // ── Tab Switch / Anti-Cheating Monitors ─────────────────────────────────────

  const handleTabSwitchViolation = useCallback(() => {
    if (exam.state.isSubmitted || isSubmitting) return;

    const now = Date.now();
    // Ignore duplicate events within 1 second (prevent blur + visibilitychange double-triggering)
    if (now - lastViolationTimeRef.current < 1000) return;
    lastViolationTimeRef.current = now;

    tabSwitchRef.current += 1;
    const count = tabSwitchRef.current;
    exam.incrementTabSwitch();

    if (count >= 4) {
      setWarningMessage(
        "Maximum tab switch violations (4/4) reached! Your exam is being automatically submitted now."
      );
      setShowWarningModal(true);
      setTimeout(() => {
        handleSubmit();
      }, 1200);
    } else {
      setWarningMessage(
        `Warning (${count}/3): Navigating away or switching tabs during the exam is strictly prohibited! (Exam auto-submits on 4th violation)`
      );
      setShowWarningModal(true);
    }
  }, [exam, isSubmitting, handleSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitchViolation();
      }
    };

    const handleBlur = () => {
      handleTabSwitchViolation();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+C, Ctrl+V
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "i" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "c" || e.key === "C"))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTabSwitchViolation]);

  // Initialize exam on mount
  useEffect(() => {
    const name = sessionStorage.getItem("candidateName");
    if (!name) {
      router.push("/");
      return;
    }
    setCandidateName(name);
    exam.initExam(name);
    timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answeredCount = exam.state.answers.filter((a) => a !== null).length;

  if (!candidateName) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-foreground/40">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen select-none">
      {/* Header with Timer */}
      <ExamHeader
        timeLeft={timer.timeLeft}
        candidateName={candidateName}
        onSubmit={() => setShowConfirmModal(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Question Area */}
        <main className="flex-1 p-4 md:p-8">
          {/* Security Banner */}
          {exam.state.tabSwitchCount > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs flex items-center justify-between animate-pulse">
              <span className="font-semibold">
                ⚠️ Anti-Cheating Warning: Tab Switches Detected ({exam.state.tabSwitchCount}/3)
              </span>
              <span>Auto-submit at 4 violations</span>
            </div>
          )}

          <div className="glass-card p-6 md:p-8">
            <QuestionCard
              question={currentQuestion}
              questionIndex={exam.state.currentQuestionIndex}
              totalQuestions={questions.length}
              selectedAnswer={
                exam.state.answers[exam.state.currentQuestionIndex]
              }
              onSelectAnswer={exam.selectAnswer}
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-navy-600/30">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exam.clearAnswer}
                  disabled={
                    exam.state.answers[exam.state.currentQuestionIndex] === null
                  }
                >
                  Clear
                </Button>
                <Button
                  variant={
                    exam.state.markedForReview[exam.state.currentQuestionIndex]
                      ? "outline"
                      : "ghost"
                  }
                  size="sm"
                  onClick={exam.toggleMark}
                >
                  <svg
                    className="w-4 h-4"
                    fill={
                      exam.state.markedForReview[
                        exam.state.currentQuestionIndex
                      ]
                        ? "currentColor"
                        : "none"
                    }
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  {exam.state.markedForReview[exam.state.currentQuestionIndex]
                    ? "Unmark"
                    : "Mark for Review"}
                </Button>

                {/* Mobile palette toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowPalette(!showPalette)}
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Palette
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exam.prevQuestion}
                  disabled={exam.state.currentQuestionIndex === 0}
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
                  Previous
                </Button>

                {exam.state.currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={exam.nextQuestion}
                  >
                    Next
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
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar — Question Palette (Desktop) */}
        <aside className="hidden lg:block w-72 p-4 pl-0">
          <div className="sticky top-24">
            <QuestionPalette
              totalQuestions={questions.length}
              state={exam.state}
              onJump={exam.jumpToQuestion}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Palette Drawer */}
      {showPalette && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowPalette(false)}
        >
          <div className="modal-overlay absolute inset-0" />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 p-4 bg-navy-900 border-l border-navy-700 animate-slide-up overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Question Palette</h3>
              <button
                onClick={() => setShowPalette(false)}
                className="p-1 rounded hover:bg-navy-700 cursor-pointer transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <QuestionPalette
              totalQuestions={questions.length}
              state={exam.state}
              onJump={(i) => {
                exam.jumpToQuestion(i);
                setShowPalette(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-overlay absolute inset-0"
            onClick={() => setShowWarningModal(false)}
          />
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in space-y-4 text-center border-danger/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger/15 text-danger mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">
              Anti-Cheating Security Alert
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {warningMessage}
            </p>
            <Button
              variant="danger"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowWarningModal(false)}
            >
              I Understand & Return to Exam
            </Button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-overlay absolute inset-0"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative glass-card p-8 max-w-md w-full animate-scale-in space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/15 mb-4">
                <svg
                  className="w-8 h-8 text-danger"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Submit Exam?
              </h3>
              <p className="text-sm text-foreground/50">
                This action cannot be undone.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="glass-card-light p-3 rounded-xl">
                <p className="text-lg font-bold text-success">{answeredCount}</p>
                <p className="text-xs text-foreground/40">Answered</p>
              </div>
              <div className="glass-card-light p-3 rounded-xl">
                <p className="text-lg font-bold text-foreground/50">
                  {questions.length - answeredCount}
                </p>
                <p className="text-xs text-foreground/40">Unanswered</p>
              </div>
              <div className="glass-card-light p-3 rounded-xl">
                <p className="text-lg font-bold text-warning">
                  {exam.state.markedForReview.filter(Boolean).length}
                </p>
                <p className="text-xs text-foreground/40">Marked</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

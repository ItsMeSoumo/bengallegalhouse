"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { ExamResult } from "@/lib/types";
import { EXAM_INFO } from "@/lib/constants";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    try {
      const storedResult = sessionStorage.getItem("examResult");
      const candidateName = sessionStorage.getItem("candidateName");

      // If no active candidate session or result, redirect to home login
      if (!candidateName && !storedResult) {
        router.push("/");
        return;
      }

      if (storedResult) {
        setResult(JSON.parse(storedResult));
      }
    } catch (error) {
      console.error("Error parsing stored exam result:", error);
      router.push("/");
    }
  }, [router]);

  const handleReturnToDashboard = () => {
    sessionStorage.removeItem("examResult");
    sessionStorage.removeItem("activeExamId");
    sessionStorage.removeItem("activeExamTitle");
    sessionStorage.removeItem("activeExamTime");
    // Preserve candidateName & candidateEmail so student remains logged in!
    router.push("/dashboard");
  };

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-navy-950">
        <Spinner size="xl" label="Loading submission confirmation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-navy-950">
      {/* Header */}
      <header className="glass-card !rounded-none border-x-0 border-t-0 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <svg
                className="w-5 h-5 text-navy-950"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gradient-gold">
                {EXAM_INFO.title}
              </h1>
              <p className="text-xs text-foreground/40">Exam Submission Confirmed</p>
            </div>
          </div>
        </div>
      </header>

      {/* Confirmation Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-8 flex flex-col justify-center">
        <Card variant="highlight" className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success border border-success/30 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white">
            Submission Successful!
          </h2>

          <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
            Thank you, <span className="font-semibold text-gold-400">{result.candidateName}</span>. 
            Your examination responses have been securely recorded and submitted to the administrator for evaluation.
          </p>

          <div className="glass-card-light p-4 rounded-xl space-y-2 text-left text-sm max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-foreground/45">Candidate:</span>
              <span className="font-medium text-white">{result.candidateName}</span>
            </div>
            {result.examTitle && (
              <div className="flex justify-between">
                <span className="text-foreground/45">Paper:</span>
                <span className="font-medium text-gold-400">{result.examTitle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-foreground/45">Submitted:</span>
              <span className="font-medium text-white">
                {new Date(result.submittedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/45">Status:</span>
              <span className="font-semibold text-success">Responses Logged</span>
            </div>
          </div>

          <p className="text-xs text-foreground/40 italic">
            You remain logged in to your student account. Click below to return to your dashboard.
          </p>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handleReturnToDashboard}
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Return to Student Dashboard
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-foreground/20 border-t border-navy-700/30 mt-auto">
        © {new Date().getFullYear()} Law Practice CBT. All rights reserved.
      </footer>
    </div>
  );
}

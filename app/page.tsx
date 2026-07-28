"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { EXAM_INFO, EXAM_CONFIG } from "@/lib/constants";

export default function Home() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!name.trim()) {
      setError("Please enter your full name to proceed");
      return;
    }
    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }
    // Store name in sessionStorage for exam page
    sessionStorage.setItem("candidateName", name.trim());
    router.push("/exam");
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-8 animate-slide-up">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-2xl shadow-gold-500/25 mb-4">
            <svg
              className="w-10 h-10 text-navy-950"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-gold">
            {EXAM_INFO.title}
          </h1>
          <p className="text-foreground/50 text-lg">{EXAM_INFO.subtitle}</p>
        </div>

        {/* Exam Info Card */}
        <Card variant="highlight" className="space-y-6">
          <div className="text-center pb-4 border-b border-navy-600/30">
            <h2 className="text-lg font-bold text-white">
              {EXAM_INFO.examName}
            </h2>
            <p className="text-sm text-foreground/40 mt-1">
              {EXAM_INFO.description}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card-light p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-gold-400">
                {EXAM_CONFIG.totalQuestions}
              </p>
              <p className="text-xs text-foreground/40">Questions</p>
            </div>
            <div className="glass-card-light p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-gold-400">
                {EXAM_CONFIG.totalTime / 60}
              </p>
              <p className="text-xs text-foreground/40">Minutes</p>
            </div>
            <div className="glass-card-light p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-gold-400">
                {EXAM_CONFIG.totalQuestions * EXAM_CONFIG.marksPerCorrect}
              </p>
              <p className="text-xs text-foreground/40">Max Marks</p>
            </div>
          </div>

          {/* Rules */}
          <div>
            <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
              Exam Rules
            </h3>
            <ul className="space-y-2">
              {EXAM_INFO.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground/60"
                >
                  <span className="text-gold-500 mt-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Name Input & Start */}
        <Card className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground/70">
              Candidate Full Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="Enter your full name"
              className="mt-2 w-full px-4 py-3 rounded-xl bg-navy-800 border border-navy-600/50 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
              autoFocus
            />
          </label>

          {error && (
            <p className="text-sm text-danger flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleStart}
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Start Examination
          </Button>

          <p className="text-center text-xs text-foreground/30">
            By starting, you agree to the exam rules listed above
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/20">
          © {new Date().getFullYear()} Bengal Legal House. All rights reserved.
        </p>
      </div>
    </div>
  );
}

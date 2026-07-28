"use client";

import Timer from "@/components/ui/Timer";
import Button from "@/components/ui/Button";
import { EXAM_INFO } from "@/lib/constants";

interface ExamHeaderProps {
  timeLeft: number;
  candidateName: string;
  onSubmit: () => void;
}

export default function ExamHeader({
  timeLeft,
  candidateName,
  onSubmit,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left — Branding */}
        <div className="flex items-center gap-4">
          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <svg
              className="w-5 h-5 text-navy-950"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2L3 7v11h14V7l-7-5zM9 16H5v-5h4v5zm6 0h-4v-5h4v5z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-gradient-gold">
              {EXAM_INFO.title}
            </h1>
            <p className="text-xs text-foreground/40">{candidateName}</p>
          </div>
        </div>

        {/* Center — Timer */}
        <Timer timeLeft={timeLeft} />

        {/* Right — Submit */}
        <Button variant="danger" size="sm" onClick={onSubmit}>
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Submit
        </Button>
      </div>
    </header>
  );
}

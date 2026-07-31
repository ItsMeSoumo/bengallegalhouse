"use client";

import React from "react";
import { ExamState, QuestionStatus } from "@/lib/types";
import { getQuestionStatus, cn } from "@/lib/utils";

interface QuestionPaletteProps {
  totalQuestions: number;
  state: ExamState;
  onJump: (index: number) => void;
}

export default function QuestionPalette({
  totalQuestions,
  state,
  onJump,
}: QuestionPaletteProps) {
  const getStatusColor = (status: QuestionStatus): string => {
    switch (status) {
      case "current":
        return "bg-gold-500 text-navy-950 border-gold-400";
      case "answered":
        return "bg-success/80 text-white border-success";
      case "marked-answered":
        return "bg-purple/80 text-white border-purple";
      case "marked":
        return "bg-warning/80 text-navy-950 border-warning";
      case "unanswered":
        return "bg-navy-700/60 text-foreground/50 border-navy-600/40";
      default:
        return "bg-navy-700/60 text-foreground/50 border-navy-600/40";
    }
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
        Question Palette
      </h3>

      {/* Grid of buttons */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const status = getQuestionStatus(i, state);
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={cn("palette-btn", getStatusColor(status))}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2 pt-4 border-t border-navy-600/30">
        <p className="text-xs text-foreground/40 uppercase tracking-wider font-semibold mb-3">
          Legend
        </p>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <LegendItem color="bg-gold-500" label="Current" />
          <LegendItem color="bg-success/80" label="Answered" />
          <LegendItem color="bg-warning/80" label="Marked for Review" />
          <LegendItem color="bg-purple/80" label="Marked & Answered" />
          <LegendItem color="bg-navy-700/60" label="Not Visited" />
        </div>
      </div>
    </div>
  );
}

const LegendItem = React.memo(function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-4 h-4 rounded", color)} />
      <span className="text-foreground/60">{label}</span>
    </div>
  );
});


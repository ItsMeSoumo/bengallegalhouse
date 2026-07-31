"use client";

import { formatTime, cn } from "@/lib/utils";
import { TIMER_THRESHOLDS, EXAM_CONFIG } from "@/lib/constants";

interface TimerProps {
  timeLeft: number;
  totalDuration?: number;
  className?: string;
}

export default function Timer({ timeLeft = 0, totalDuration, className }: TimerProps) {
  const isDanger = timeLeft <= TIMER_THRESHOLDS.danger;
  const isWarning = timeLeft <= TIMER_THRESHOLDS.warning;

  const getColor = () => {
    if (timeLeft <= 0 || isDanger) return "text-danger";
    if (isWarning) return "text-warning";
    return "text-success";
  };

  const getProgressColor = () => {
    if (timeLeft <= 0 || isDanger) return "#ef4444";
    if (isWarning) return "#f59e0b";
    return "#22c55e";
  };

  const totalTime = totalDuration || EXAM_CONFIG?.totalTime || 7200;
  const safeTimeLeft = Math.max(0, timeLeft);
  const progressPercent = totalTime > 0 ? (safeTimeLeft / totalTime) * 100 : 0;

  // SVG circle params
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        isDanger && "timer-danger",
        className
      )}
    >
      {/* Circular progress */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={getProgressColor()}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Clock icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className={cn("w-5 h-5", getColor())}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>
      </div>

      {/* Digital display */}
      <div className="flex flex-col">
        <span className="text-xs text-foreground/50 uppercase tracking-wider font-medium">
          Time Left
        </span>
        <span
          className={cn(
            "text-2xl font-mono font-bold tracking-wider",
            getColor()
          )}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}

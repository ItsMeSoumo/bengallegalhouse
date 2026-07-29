"use client";

import { useEffect, useState } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center pb-3 md:pb-4">
      <div className="pointer-events-auto glass-card !rounded-full px-5 py-2 flex items-center gap-3 border border-navy-700/50 shadow-lg shadow-navy-950/50 backdrop-blur-xl">
        {/* Pulsing live indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
        </span>

        {/* Date */}
        <span className="text-xs text-foreground/50 font-medium tracking-wide hidden sm:inline">
          {dateStr}
        </span>

        {/* Separator */}
        <span className="hidden sm:inline text-navy-600">|</span>

        {/* Time */}
        <span className="text-sm font-bold text-white tabular-nums tracking-wider">
          {timeStr}
        </span>

        {/* IST label */}
        <span className="text-[10px] text-gold-400 font-semibold uppercase tracking-widest">
          IST
        </span>
      </div>
    </div>
  );
}

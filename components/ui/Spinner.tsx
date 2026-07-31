"use client";

import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

export default function Spinner({
  size = "md",
  label,
  className = "",
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-7 h-7 border-3",
    lg: "w-10 h-10 border-4",
    xl: "w-14 h-14 border-4",
  };

  return (
    <div
      role="status"
      aria-label={label || "Loading..."}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Glowing aura */}
        <div
          className={`absolute rounded-full bg-gold-500/20 blur-md animate-pulse ${
            size === "xl" ? "w-16 h-16" : size === "lg" ? "w-12 h-12" : "w-8 h-8"
          }`}
        />
        {/* Animated spinner ring */}
        <div
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-t-gold-400 border-r-gold-500/40 border-b-navy-800 border-l-gold-500/20 animate-spin`}
        />
      </div>
      {label && (
        <p className="text-xs md:text-sm font-medium text-foreground/60 tracking-wide animate-pulse">
          {label}
        </p>
      )}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}

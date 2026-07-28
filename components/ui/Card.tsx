"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "success" | "error";
  animate?: boolean;
}

export default function Card({
  children,
  className,
  variant = "default",
  animate = true,
}: CardProps) {
  const variantBorder: Record<string, string> = {
    default: "",
    highlight: "!border-gold-500/30",
    success: "!border-success/30",
    error: "!border-danger/30",
  };

  return (
    <div
      className={cn(
        "glass-card p-6",
        variantBorder[variant],
        animate && "animate-scale-in",
        className
      )}
    >
      {children}
    </div>
  );
}

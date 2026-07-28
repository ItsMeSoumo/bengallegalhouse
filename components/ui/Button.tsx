"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-lg shadow-gold-500/20",
  secondary:
    "bg-navy-700 text-white hover:bg-navy-600 active:bg-navy-800 border border-navy-600",
  danger:
    "bg-danger text-white hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-500/20",
  ghost:
    "bg-transparent text-foreground hover:bg-glass-light active:bg-navy-700",
  outline:
    "bg-transparent border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 active:bg-gold-500/20",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-semibold transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import {
  loginWithGoogle,
  registerStudentUserInDB,
  authenticateStudentUserInDB,
} from "@/lib/firebase";

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Redirect if session is already active
  useEffect(() => {
    const existingName = sessionStorage.getItem("candidateName");
    if (existingName) {
      router.push("/dashboard");
    }
  }, [router]);

  // Handle Credentials Login & Registration Verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (authMode === "signup") {
        // ── SIGN UP VERIFICATION ─────────────────────────────────────────────
        if (!fullName.trim()) {
          setError("Please enter your full name");
          setIsSubmitting(false);
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("Please enter a valid email address");
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 4) {
          setError("Password must be at least 4 characters long");
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsSubmitting(false);
          return;
        }

        // Register user
        const res = await registerStudentUserInDB(fullName, email, password);
        if (!res.success) {
          setError(res.error || "An account with this email address already exists. Please Log In!");
          setIsSubmitting(false);
          return;
        }

        // Save Student Session
        sessionStorage.setItem("candidateName", res.user!.name);
        sessionStorage.setItem("candidateEmail", res.user!.email);
        router.push("/dashboard");
      } else {
        // ── LOG IN VERIFICATION ──────────────────────────────────────────────
        if (!email.trim()) {
          setError("Please enter your email or full name");
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setError("Please enter your password");
          setIsSubmitting(false);
          return;
        }

        // Check user credentials
        const res = await authenticateStudentUserInDB(email, password);
        if (!res.success) {
          setError(res.error || "Authentication failed. Please check your credentials.");
          setIsSubmitting(false);
          return;
        }

        // Log In Successful
        sessionStorage.setItem("candidateName", res.user!.name);
        sessionStorage.setItem("candidateEmail", res.user!.email);
        router.push("/dashboard");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google Login / Signup
  const handleGoogleAuth = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const googleUser = await loginWithGoogle();
      if (googleUser.email) {
        // Auto-register user if new
        await registerStudentUserInDB(googleUser.name, googleUser.email, "google_oauth_user");
      }

      sessionStorage.setItem("candidateName", googleUser.name);
      sessionStorage.setItem("candidateEmail", googleUser.email);
      if (googleUser.token) {
        sessionStorage.setItem("authToken", googleUser.token);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(
        errObj?.message ||
        "Google Sign-In needs to be enabled in Firebase Console (Authentication → Sign-in method → Google)."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 py-8 bg-navy-950">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 animate-scale-in">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-xl shadow-gold-500/20 mb-2">
            <svg
              className="w-8 h-8 text-navy-950"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-gold">
            Law Practice CBT
          </h1>
          <p className="text-xs md:text-sm text-foreground/45">
            Student Examination Portal
          </p>
        </div>

        {/* Clean Auth Card */}
        <Card variant="highlight" className="p-6 md:p-8 space-y-6">
          {/* Tab Switcher */}
          <div className="flex border-b border-navy-700/60 pb-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError("");
              }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-all cursor-pointer ${authMode === "login"
                ? "text-gold-400 border-b-2 border-gold-400 font-bold"
                : "text-foreground/40 hover:text-white"
                }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setError("");
              }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-all cursor-pointer ${authMode === "signup"
                ? "text-gold-400 border-b-2 border-gold-400 font-bold"
                : "text-foreground/40 hover:text-white"
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 text-sm transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                {authMode === "signup" ? "Email Address" : "Email or Name"}
              </label>
              <input
                type={authMode === "signup" ? "email" : "text"}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder={authMode === "signup" ? "student@example.com" : "Registered email or name"}
                className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 text-sm transition-all"
              />
            </div>

            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 text-sm transition-all"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-danger flex items-center gap-1.5 font-medium pt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            <Button size="lg" type="submit" className="w-full mt-2 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>
                    {authMode === "login" ? "Logging In..." : "Creating Account..."}
                  </span>
                </>
              ) : authMode === "login" ? (
                "Log In & Continue"
              ) : (
                "Create Account & Continue"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-700/60" />
            </div>
            <span className="relative px-3 bg-navy-900 text-[11px] text-foreground/40 uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-navy-900 border border-navy-700 hover:bg-navy-800 text-white text-sm font-semibold transition cursor-pointer"
          >
            {isSubmitting ? (
              <Spinner size="sm" label="Connecting..." />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/20">
          © {new Date().getFullYear()} Law Practice CBT. All rights reserved.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { EXAM_INFO } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface StudentSidebarProps {
  studentName: string;
  activeTab: "exams" | "results" | "profile";
  setActiveTab: (tab: "exams" | "results" | "profile") => void;
}

export default function StudentSidebar({
  studentName = "Student",
  activeTab,
  setActiveTab,
}: StudentSidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("candidateName");
        localStorage.removeItem("candidateEmail");
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("candidateName");
        sessionStorage.removeItem("candidateEmail");
        sessionStorage.removeItem("authToken");
        sessionStorage.clear();
      }
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out in StudentSidebar:", error);
      window.location.href = "/";
    }
  };

  return (
    <aside className="w-full md:w-64 glass-card !rounded-none md:!rounded-2xl border-y-0 md:border-y border-l-0 md:border-navy-700/60 p-5 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 border-b border-navy-600/30 pb-4">
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
            <h2 className="text-sm font-bold text-gradient-gold">
              {EXAM_INFO.title}
            </h2>
            <p className="text-xs text-foreground/40">Student Portal</p>
          </div>
        </div>

        {/* Student Profile Summary */}
        <div className="p-3 rounded-xl bg-navy-800/60 border border-navy-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500/20 text-gold-400 font-bold flex items-center justify-center border border-gold-500/30 text-sm">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {studentName}
            </p>
            <span className="text-[10px] text-success font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Verified Student
            </span>
          </div>
        </div>

        {/* Navigation Options */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab("exams")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === "exams"
                ? "bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/15"
                : "text-foreground/60 hover:text-white hover:bg-navy-800/50"
              }`}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Available Exams
          </button>

          <button
            onClick={() => setActiveTab("results")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === "results"
                ? "bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/15"
                : "text-foreground/60 hover:text-white hover:bg-navy-800/50"
              }`}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            My Submissions
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === "profile"
                ? "bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/15"
                : "text-foreground/60 hover:text-white hover:bg-navy-800/50"
              }`}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Profile
          </button>
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-navy-600/30">
        <Button
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-2 text-danger hover:bg-danger/10 border-danger/20"
          onClick={handleLogout}
        >
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log Out
        </Button>
      </div>
    </aside>
  );
}

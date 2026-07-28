"use client";

import Button from "@/components/ui/Button";

interface AdminSidebarProps {
  activeTab: "candidates" | "exams";
  setActiveTab: (tab: "candidates" | "exams") => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="w-full md:w-64 glass-card !rounded-none md:!rounded-2xl border-y-0 md:border-y border-l-0 md:border-navy-700/60 p-5 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-navy-600/30 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <svg
              className="w-5 h-5 text-navy-950"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gradient-gold">
              Law Practice CBT
            </h2>
            <p className="text-xs text-foreground/40">Admin Control Center</p>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 font-bold flex items-center justify-center text-xs">
            ADM
          </div>
          <div>
            <p className="text-xs font-bold text-white">Master Admin</p>
            <span className="text-[10px] text-gold-400 font-medium">
              Full System Privileges
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab("candidates")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "candidates"
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            Student Results
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "exams"
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Examinations & Papers
          </button>
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-navy-600/30">
        <Button
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-2 text-danger hover:bg-danger/10 border-danger/20"
          onClick={onLogout}
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
          Admin Logout
        </Button>
      </div>
    </aside>
  );
}

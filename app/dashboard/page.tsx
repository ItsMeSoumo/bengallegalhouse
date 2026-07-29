"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/components/layout/StudentSidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { getExamPapers, syncExamPapersWithDB } from "@/lib/examRegistry";
import { getCandidateExamResults } from "@/lib/firebase";
import { ExamPaper, ResultDocument } from "@/lib/types";
import { downloadExamScorecardPDF } from "@/lib/generatePdfReport";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"exams" | "results" | "profile">("exams");
  const [pastResults, setPastResults] = useState<ResultDocument[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modals
  const [selectedPaperToStart, setSelectedPaperToStart] = useState<ExamPaper | null>(null);
  const [limitReachedPaper, setLimitReachedPaper] = useState<ExamPaper | null>(null);

  // Authentication Protection Check
  useEffect(() => {
    setIsClient(true);
    const name = sessionStorage.getItem("candidateName");
    const email = sessionStorage.getItem("candidateEmail") || "";
    if (!name) {
      router.push("/");
      return;
    }
    setStudentName(name);
    setStudentEmail(email);
    setExamPapers(getExamPapers());
    syncExamPapersWithDB().then(setExamPapers);
    fetchMyResults(name, email);
  }, [router]);

  // Real-time clock tick for schedule gating
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper: compute schedule status for an exam
  const getScheduleStatus = useCallback((paper: ExamPaper): "none" | "upcoming" | "live" | "closed" => {
    if (!paper.scheduledDate || !paper.scheduledStartTime || !paper.scheduledEndTime) return "none";
    const nowIST = new Date(currentTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const [sH, sM] = paper.scheduledStartTime.split(":").map(Number);
    const [eH, eM] = paper.scheduledEndTime.split(":").map(Number);
    const start = new Date(paper.scheduledDate + "T00:00:00");
    start.setHours(sH, sM, 0, 0);
    const end = new Date(paper.scheduledDate + "T00:00:00");
    end.setHours(eH, eM, 0, 0);
    if (nowIST < start) return "upcoming";
    if (nowIST >= start && nowIST <= end) return "live";
    return "closed";
  }, [currentTime]);

  const fetchMyResults = async (name: string, email: string) => {
    setLoadingResults(true);
    try {
      const myResults = await getCandidateExamResults(name, email);
      setPastResults(myResults);
    } catch (err) {
      console.error("Error fetching my results:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleStartExamClick = (paper: ExamPaper) => {
    const attemptsTaken = pastResults.filter((r) => r.examId === paper.id).length;
    const maxAllowed = paper.maxAttempts || 0;

    if (maxAllowed > 0 && attemptsTaken >= maxAllowed) {
      setLimitReachedPaper(paper);
      return;
    }

    setSelectedPaperToStart(paper);
  };

  const confirmStartExam = () => {
    if (!selectedPaperToStart) return;
    sessionStorage.setItem("activeExamId", selectedPaperToStart.id);
    sessionStorage.setItem("activeExamTitle", selectedPaperToStart.title);
    sessionStorage.setItem("activeExamTime", String(selectedPaperToStart.totalTimeMinutes * 60));
    router.push("/exam");
  };

  if (!isClient || !studentName) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-navy-950">
        <Spinner size="xl" label="Verifying student authorization..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-navy-950 text-foreground p-0 md:p-6 gap-0 md:gap-6">
      {/* App Sidebar */}
      <StudentSidebar
        studentName={studentName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* Top Welcome Bar */}
        <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Welcome back, <span className="text-gradient-gold">{studentName}</span> 👋
            </h1>
            <p className="text-xs text-foreground/40 mt-1">
              Law Entrance Examination Student Dashboard
            </p>
          </div>
        </div>

        {/* Tab 1: Available Exams */}
        {activeTab === "exams" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-white">
              Available Examinations & Practice Papers
            </h2>

            {loadingResults ? (
              <Card className="text-center py-16">
                <Spinner size="lg" label="Retrieving database records and attempt allowances..." />
              </Card>
            ) : (
              <div className="space-y-6">
                {examPapers.map((paper) => {
                  const attemptsTaken = pastResults.filter((r) => r.examId === paper.id).length;
                  const maxAllowed = paper.maxAttempts || 0; // 0 = unlimited
                  const isLimitReached = maxAllowed > 0 && attemptsTaken >= maxAllowed;
                  const scheduleStatus = getScheduleStatus(paper);

                  return (
                    <Card key={paper.id} variant="highlight" className="p-6 space-y-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-navy-600/30 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/30">
                              {paper.subtitle}
                            </span>
                            {maxAllowed > 0 && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLimitReached
                                  ? "bg-danger/20 text-danger border border-danger/30"
                                  : "bg-navy-800 text-purple-300 border border-purple-500/30"
                                  }`}
                              >
                                Attempts: {attemptsTaken} / {maxAllowed}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white mt-2">
                            {paper.title}
                          </h3>
                          <p className="text-xs text-foreground/50 mt-1 max-w-2xl">
                            {paper.description}
                          </p>
                        </div>

                        {paper.status === "paused" ? (
                          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-warning/15 text-warning border border-warning/30">
                            Paused by Admin
                          </span>
                        ) : isLimitReached ? (
                          <div className="w-full md:w-auto px-5 py-3 rounded-xl text-xs md:text-sm font-bold bg-navy-900/90 text-gold-300 border border-gold-500/40 flex items-center justify-center gap-2 shadow-md cursor-not-allowed select-none">
                            <svg
                              className="w-4 h-4 text-gold-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span>Attempt Limit Reached</span>
                          </div>
                        ) : scheduleStatus === "upcoming" ? (
                          <div className="w-full md:w-auto px-5 py-3 rounded-xl text-xs md:text-sm font-bold bg-purple/10 text-purple-300 border border-purple/30 flex items-center justify-center gap-2 shadow-md cursor-not-allowed select-none">
                            <span className="text-base">🕐</span>
                            <span>Opens at {paper.scheduledStartTime} IST</span>
                          </div>
                        ) : scheduleStatus === "closed" ? (
                          <div className="w-full md:w-auto px-5 py-3 rounded-xl text-xs md:text-sm font-bold bg-danger/10 text-danger border border-danger/30 flex items-center justify-center gap-2 shadow-md cursor-not-allowed select-none">
                            <span className="text-base">🔒</span>
                            <span>Exam Window Closed</span>
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            onClick={() => handleStartExamClick(paper)}
                            className="w-full md:w-auto"
                          >
                            Start Examination
                          </Button>
                        )}
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                        <div className="glass-card-light p-3 rounded-xl">
                          <p className="text-xs text-foreground/40">Questions</p>
                          <p className="text-lg font-bold text-gold-400">
                            {paper.questions.length}
                          </p>
                        </div>
                        <div className="glass-card-light p-3 rounded-xl">
                          <p className="text-xs text-foreground/40">Timer Duration</p>
                          <p className="text-lg font-bold text-gold-400">
                            {paper.totalTimeMinutes} Mins
                          </p>
                        </div>
                        <div className="glass-card-light p-3 rounded-xl">
                          <p className="text-xs text-foreground/40">Marking Scheme</p>
                          <p className="text-lg font-bold">
                            <span className="text-success">+{paper.marksPerCorrect}</span>
                            <span className="text-foreground/40 mx-1">/</span>
                            <span className="text-danger">-{paper.negativeMarks}</span>
                          </p>
                        </div>
                        <div className="glass-card-light p-3 rounded-xl">
                          <p className="text-xs text-foreground/40">Max Attempts</p>
                          <p className="text-lg font-bold text-purple-400">
                            {maxAllowed === 0 ? "Unlimited" : `${maxAllowed} ${maxAllowed === 1 ? "Time" : "Times"}`}
                          </p>
                        </div>
                        <div className="glass-card-light p-3 rounded-xl">
                          <p className="text-xs text-foreground/40">My Attempts</p>
                          <p className={`text-lg font-bold ${isLimitReached ? "text-danger" : "text-white"}`}>
                            {attemptsTaken} {maxAllowed > 0 ? `/ ${maxAllowed}` : ""}
                          </p>
                        </div>

                      {/* Schedule info row */}
                      {paper.scheduledDate && paper.scheduledStartTime && paper.scheduledEndTime && (
                        <div className={`col-span-full glass-card-light p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold ${
                          scheduleStatus === "live" ? "text-success border border-success/20" :
                          scheduleStatus === "upcoming" ? "text-purple-300 border border-purple/20" :
                          "text-danger border border-danger/20"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span>{scheduleStatus === "live" ? "🟢" : scheduleStatus === "upcoming" ? "🕐" : "🔒"}</span>
                            <span>
                              {scheduleStatus === "live" ? "LIVE NOW" : scheduleStatus === "upcoming" ? "Upcoming" : "Closed"}
                              {" — "}
                              {new Date(paper.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              {", "}{paper.scheduledStartTime} – {paper.scheduledEndTime} IST
                            </span>
                          </div>

                          {/* Calculated window duration */}
                          {(() => {
                            const [sh, sm] = paper.scheduledStartTime.split(":").map(Number);
                            const [eh, em] = paper.scheduledEndTime.split(":").map(Number);
                            if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
                              let sMins = sh * 60 + sm;
                              let eMins = eh * 60 + em;
                              if (eMins <= sMins) eMins += 1440;
                              const diff = eMins - sMins;
                              const hrs = Math.floor(diff / 60);
                              const m = diff % 60;
                              const durationStr = hrs > 0 && m > 0 ? `${hrs}h ${m}m` : hrs > 0 ? `${hrs} Hour${hrs > 1 ? "s" : ""}` : `${m} Mins`;
                              return (
                                <span className="px-2.5 py-0.5 rounded-full bg-navy-900/80 text-foreground/70 border border-white/10 text-[11px] font-bold shrink-0">
                                  ⏱️ {durationStr} Window
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Performance / Results */}
        {activeTab === "results" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-white">
              My Past Exam Submissions
            </h2>

            {loadingResults ? (
              <Card className="text-center py-16">
                <Spinner size="lg" label="Fetching your exam submissions from database..." />
              </Card>
            ) : pastResults.length === 0 ? (
              <Card className="text-center py-12 space-y-3">
                <p className="text-sm text-foreground/50">
                  You haven&apos;t taken any exams yet.
                </p>
                <Button size="sm" onClick={() => setActiveTab("exams")} className="mx-auto">
                  Browse Available Exams
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastResults.map((res, i) => (
                  <Card key={res.id || i} variant="highlight" className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider">
                          {res.examTitle || "CULET-2026 Mock Test 2"}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                          <span>✅ Successfully Submitted</span>
                        </h3>
                        <p className="text-xs text-foreground/40 mt-1">
                          Submitted on {new Date(res.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-success/15 text-success border border-success/30">
                        Submitted
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Profile Info */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in max-w-xl">
            <h2 className="text-lg font-bold text-white">Student Profile Information</h2>
            <Card variant="highlight" className="p-6 space-y-4">
              <div>
                <label className="text-xs text-foreground/40 uppercase tracking-wider font-semibold">Full Name</label>
                <p className="text-base font-bold text-white mt-1">{studentName}</p>
              </div>
              {studentEmail && (
                <div>
                  <label className="text-xs text-foreground/40 uppercase tracking-wider font-semibold">Email Address</label>
                  <p className="text-sm font-medium text-gold-400 mt-1">{studentEmail}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-foreground/40 uppercase tracking-wider font-semibold">Exams Submitted</label>
                <p className="text-base font-bold text-white mt-1">{pastResults.length} Submissions</p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ── PRE-EXAM START CONFIRMATION MODAL ── */}
      {selectedPaperToStart && (() => {
        const attemptsTaken = pastResults.filter((r) => r.examId === selectedPaperToStart.id).length;
        const maxAllowed = selectedPaperToStart.maxAttempts || 0;
        const attemptNumber = attemptsTaken + 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-md"
              onClick={() => setSelectedPaperToStart(null)}
            />
            <div className="relative glass-card p-6 md:p-8 max-w-lg w-full animate-scale-in text-left space-y-5 border border-gold-500/30">
              <div className="flex items-center justify-between border-b border-navy-600/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
                    📝
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Start Examination</h3>
                    <p className="text-xs text-foreground/40">Pre-Exam Attempt Confirmation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPaperToStart(null)}
                  className="p-1.5 rounded-lg text-foreground/40 hover:text-white hover:bg-navy-800 transition"
                >
                  ✕
                </button>
              </div>

              {/* Exam Details Box */}
              <div className="glass-card-light p-4 rounded-xl space-y-3 border border-navy-700/60">
                <p className="text-sm font-bold text-gold-400">
                  {selectedPaperToStart.title}
                </p>

                {/* Attempt Badge Highlight */}
                <div className="p-3 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/70">
                    Examination Allowance:
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500 text-navy-950">
                    Attempts Left: {maxAllowed === 0 ? "Unlimited" : Math.max(0, maxAllowed - attemptsTaken)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 rounded bg-navy-900 border border-navy-800">
                    <span className="text-foreground/40 block text-[10px]">Timer</span>
                    <span className="font-bold text-white">{selectedPaperToStart.totalTimeMinutes} Mins</span>
                  </div>
                  <div className="p-2 rounded bg-navy-900 border border-navy-800">
                    <span className="text-foreground/40 block text-[10px]">Questions</span>
                    <span className="font-bold text-white">{selectedPaperToStart.questions.length} Qs</span>
                  </div>
                  <div className="p-2 rounded bg-navy-900 border border-navy-800">
                    <span className="text-foreground/40 block text-[10px]">Marking</span>
                    <span className="font-bold">
                      <span className="text-success">+{selectedPaperToStart.marksPerCorrect}</span>
                      <span className="text-foreground/40 font-normal mx-1">/</span>
                      <span className="text-danger">-{selectedPaperToStart.negativeMarks}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/50 text-xs text-foreground/60 space-y-1">
                <p className="font-semibold text-warning flex items-center gap-1">
                  🛡️ Anti-Cheating Protocol Monitored:
                </p>
                <p className="leading-relaxed">
                  Tab switches or window minimizations are tracked. The exam auto-submits on the 4th violation or when the timer expires.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setSelectedPaperToStart(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 font-bold"
                  onClick={confirmStartExam}
                >
                  Proceed to Start Exam →
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ATTEMPT LIMIT REACHED MODAL ── */}
      {limitReachedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-md"
            onClick={() => setLimitReachedPaper(null)}
          />
          <div className="relative glass-card p-6 md:p-8 max-w-md w-full animate-scale-in text-center space-y-5 border border-danger/40">
            <div className="w-14 h-14 rounded-full bg-danger/15 text-danger border border-danger/30 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Attempt Limit Reached</h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                You have already completed the maximum allowed{" "}
                <span className="font-bold text-gold-400">
                  {limitReachedPaper.maxAttempts} attempt(s)
                </span>{" "}
                for <span className="font-semibold text-white">&quot;{limitReachedPaper.title}&quot;</span>. Multiple attempts are locked for this examination.
              </p>
            </div>

            <Button
              variant="secondary"
              className="w-full font-semibold"
              onClick={() => setLimitReachedPaper(null)}
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

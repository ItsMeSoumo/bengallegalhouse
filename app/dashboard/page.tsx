"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/components/layout/StudentSidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { initialExamPapers } from "@/lib/examRegistry";
import { getAllExamResults } from "@/lib/firebase";
import { ExamPaper, ResultDocument } from "@/lib/types";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"exams" | "results" | "profile">("exams");
  const [pastResults, setPastResults] = useState<ResultDocument[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [examPapers] = useState<ExamPaper[]>(initialExamPapers);

  // Authentication Protection Check
  useEffect(() => {
    setIsClient(true);
    const name = sessionStorage.getItem("candidateName");
    if (!name) {
      router.push("/");
      return;
    }
    setStudentName(name);
    fetchMyResults(name);
  }, [router]);

  const fetchMyResults = async (name: string) => {
    setLoadingResults(true);
    try {
      const allResults = await getAllExamResults();
      const myResults = allResults.filter(
        (r) => r.candidateName.toLowerCase().trim() === name.toLowerCase().trim()
      );
      setPastResults(myResults);
    } catch (err) {
      console.error("Error fetching my results:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleStartExam = (paper: ExamPaper) => {
    sessionStorage.setItem("activeExamId", paper.id);
    sessionStorage.setItem("activeExamTitle", paper.title);
    sessionStorage.setItem("activeExamTime", String(paper.totalTimeMinutes * 60));
    router.push("/exam");
  };

  if (!isClient || !studentName) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-navy-950">
        <div className="animate-pulse text-foreground/45 text-sm">
          Verifying security credentials...
        </div>
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Assigned Examination Test Papers
              </h2>
              <span className="text-xs text-foreground/40 font-medium">
                {examPapers.length} Exams Available
              </span>
            </div>

            {/* List of Available Exams */}
            <div className="space-y-6">
              {examPapers.map((paper) => (
                <Card key={paper.id} variant="highlight" className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-navy-600/30 pb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/30">
                        {paper.subtitle}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-foreground/50 mt-1 max-w-2xl">
                        {paper.description}
                      </p>
                    </div>
                    {paper.status === "active" ? (
                      <Button size="lg" onClick={() => handleStartExam(paper)} className="w-full md:w-auto">
                        Start Examination
                      </Button>
                    ) : (
                      <span className="px-4 py-2 rounded-xl text-xs font-bold bg-warning/15 text-warning border border-warning/30">
                        Paused by Admin
                      </span>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
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
                      <p className="text-lg font-bold text-success">
                        +{paper.marksPerCorrect} / -{paper.negativeMarks}
                      </p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40">Max Marks</p>
                      <p className="text-lg font-bold text-white">
                        {paper.questions.length * paper.marksPerCorrect}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: My Performance / Results */}
        {activeTab === "results" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-white">
              My Past Exam Submissions
            </h2>

            {loadingResults ? (
              <Card className="text-center py-12 text-foreground/45">
                Loading your exam history...
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
                {pastResults.map((result, idx) => (
                  <Card key={result.id || idx} className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {result.examTitle || "Law Mock Test"}
                        </h4>
                        <p className="text-xs text-foreground/40">
                          Submitted on{" "}
                          {new Date(result.submittedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                        Submitted & Logged
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="glass-card-light p-3 rounded-xl">
                        <p className="text-xs text-foreground/40">Correct</p>
                        <p className="text-base font-bold text-success">
                          {result.correctCount}
                        </p>
                      </div>
                      <div className="glass-card-light p-3 rounded-xl">
                        <p className="text-xs text-foreground/40">Wrong</p>
                        <p className="text-base font-bold text-danger">
                          {result.wrongCount}
                        </p>
                      </div>
                      <div className="glass-card-light p-3 rounded-xl">
                        <p className="text-xs text-foreground/40">Unanswered</p>
                        <p className="text-base font-bold text-foreground/50">
                          {result.unansweredCount}
                        </p>
                      </div>
                      <div className="glass-card-light p-3 rounded-xl">
                        <p className="text-xs text-foreground/40">Time Taken</p>
                        <p className="text-base font-bold text-gold-400">
                          {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Profile */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <h2 className="text-lg font-bold text-white">
              Student Profile Information
            </h2>

            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-navy-600/30 pb-4">
                <div className="w-16 h-16 rounded-full bg-gold-500/20 text-gold-400 text-2xl font-bold flex items-center justify-center border border-gold-500/30">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{studentName}</h3>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Law Candidate ID: #LAW-{Math.floor(1000 + Math.random() * 9000)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-navy-700/40">
                  <span className="text-foreground/40">Account Type:</span>
                  <span className="font-semibold text-white">Student</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-700/40">
                  <span className="text-foreground/40">Security Status:</span>
                  <span className="font-semibold text-success">Verified & Protected</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-700/40">
                  <span className="text-foreground/40">Total Submissions:</span>
                  <span className="font-semibold text-gold-400">{pastResults.length}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

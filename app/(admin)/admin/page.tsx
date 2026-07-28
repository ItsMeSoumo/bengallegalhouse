"use client";

import { useEffect, useState } from "react";
import { getAllExamResults, deleteExamResult } from "@/lib/firebase";
import { ResultDocument, ExamPaper, ServerQuestion } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { EXAM_INFO } from "@/lib/constants";
import {
  initialExamPapers,
  updateExamPaper,
  addExamPaper,
  deleteExamPaper,
  addQuestionToExam,
} from "@/lib/examRegistry";
import { serverQuestions as defaultQuestions } from "@/lib/serverQuestions";

export default function AdminPage() {
  const [results, setResults] = useState<ResultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedResult, setSelectedResult] = useState<ResultDocument | null>(null);
  const [resultTab, setResultTab] = useState<"summary" | "review">("summary");
  const [adminNavTab, setAdminNavTab] = useState<"candidates" | "exams">("candidates");

  // Admin Delete Candidate Confirmation State
  const [deletingCandidate, setDeletingCandidate] = useState<ResultDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-Exam Management State
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(initialExamPapers);
  const [activeManagingExam, setActiveManagingExam] = useState<ExamPaper | null>(null);

  // Exam Edit Form State (Inside Managing Exam)
  const [examTitle, setExamTitle] = useState("");
  const [examSubtitle, setExamSubtitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examTimeMinutes, setExamTimeMinutes] = useState(120);
  const [marksPerCorrect, setMarksPerCorrect] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [examStatus, setExamStatus] = useState<"active" | "paused">("active");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Add Exam Modal State
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubtitle, setNewExamSubtitle] = useState("");
  const [newExamDescription, setNewExamDescription] = useState("");
  const [newExamTimeMinutes, setNewExamTimeMinutes] = useState(60);

  // Add Question Modal State (Inside Exam)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQText, setNewQText] = useState("");
  const [newOpt0, setNewOpt0] = useState("");
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");
  const [newOpt3, setNewOpt3] = useState("");
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQSubject, setNewQSubject] = useState("Legal Reasoning");

  // Question Search State inside Exam
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  // Admin Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Open Exam Workspace for a specific Exam
  const handleOpenManageExam = (paper: ExamPaper) => {
    setActiveManagingExam(paper);
    setExamTitle(paper.title);
    setExamSubtitle(paper.subtitle);
    setExamDescription(paper.description);
    setExamTimeMinutes(paper.totalTimeMinutes);
    setMarksPerCorrect(paper.marksPerCorrect);
    setNegativeMarks(paper.negativeMarks);
    setPassingPercentage(paper.passingPercentage);
    setExamStatus(paper.status);
  };

  // Save Settings for currently open Exam
  const handleSaveExamSettings = () => {
    if (!activeManagingExam) return;

    const updated: ExamPaper = {
      ...activeManagingExam,
      title: examTitle,
      subtitle: examSubtitle,
      description: examDescription,
      totalTimeMinutes: examTimeMinutes,
      marksPerCorrect,
      negativeMarks,
      passingPercentage,
      status: examStatus,
    };

    updateExamPaper(updated);
    setActiveManagingExam(updated);
    setExamPapers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Create New Examination
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    const id = "exam-" + Date.now();
    const newPaper: ExamPaper = {
      id,
      title: newExamTitle.trim(),
      subtitle: newExamSubtitle.trim() || "Law Practice Examination",
      description: newExamDescription.trim() || "Assessment paper designed for Law entrance candidates.",
      totalTimeMinutes: newExamTimeMinutes,
      marksPerCorrect: 1,
      negativeMarks: 0.25,
      passingPercentage: 40,
      status: "active",
      questions: defaultQuestions.slice(0, 10), // Seed with default questions
    };

    addExamPaper(newPaper);
    setExamPapers((prev) => [...prev, newPaper]);
    setShowAddExamModal(false);
    setNewExamTitle("");
    setNewExamSubtitle("");
    setNewExamDescription("");
    setNewExamTimeMinutes(60);

    // Open workspace immediately for newly created exam
    handleOpenManageExam(newPaper);
  };

  // Delete an Exam
  const handleDeleteExam = (paperId: string) => {
    if (confirm("Are you sure you want to delete this examination paper?")) {
      deleteExamPaper(paperId);
      setExamPapers((prev) => prev.filter((p) => p.id !== paperId));
      if (activeManagingExam?.id === paperId) {
        setActiveManagingExam(null);
      }
    }
  };

  // Add Question to Currently Active Exam
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManagingExam || !newQText.trim() || !newOpt0 || !newOpt1) return;

    const newQ: ServerQuestion = {
      id: activeManagingExam.questions.length + 1,
      question: newQText.trim(),
      options: [newOpt0.trim(), newOpt1.trim(), newOpt2.trim() || "N/A", newOpt3.trim() || "N/A"],
      correctAnswer: newQCorrect,
      subject: newQSubject,
    };

    addQuestionToExam(activeManagingExam.id, newQ);

    const updatedExam: ExamPaper = {
      ...activeManagingExam,
      questions: [...activeManagingExam.questions, newQ],
    };

    updateExamPaper(updatedExam);
    setActiveManagingExam(updatedExam);
    setExamPapers((prev) =>
      prev.map((p) => (p.id === updatedExam.id ? updatedExam : p))
    );

    setShowAddQuestionModal(false);
    setNewQText("");
    setNewOpt0("");
    setNewOpt1("");
    setNewOpt2("");
    setNewOpt3("");
  };

  const handleSelectResult = (res: ResultDocument | null) => {
    setSelectedResult(res);
    setResultTab("summary");
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getAllExamResults();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteExamResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
      if (selectedResult?.id === id) {
        setSelectedResult(null);
      }
      setDeletingCandidate(null);
    } catch (err) {
      alert("Failed to delete candidate result. Please check connection.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for computing SHA-256 on the client
  const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingLogin(true);
    setLoginError("");

    try {
      const passwordHash = await sha256(password);
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordHash }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("adminAuthenticated", "true");
        fetchResults();
      } else {
        setLoginError("Invalid password. Please try again.");
      }
    } catch {
      setLoginError("Something went wrong. Please check your network connection.");
    } finally {
      setCheckingLogin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    setIsClient(true);
    const sessionAuth = sessionStorage.getItem("adminAuthenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
      fetchResults();
    } else {
      setLoading(false);
    }
  }, []);

  // Filter & Sort Candidate Results
  const filteredResults = results
    .filter((r) =>
      r.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime();
          break;
        case "score":
          comparison = a.totalMarks - b.totalMarks;
          break;
        case "name":
          comparison = a.candidateName.localeCompare(b.candidateName);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  // Stats
  const totalExamsCount = results.length;
  const totalCandidatesCount = new Set(results.map((r) => r.candidateName.trim().toLowerCase())).size;

  // Filter Questions for currently managed Exam
  const paperQuestions = activeManagingExam ? activeManagingExam.questions : [];
  const subjects = ["All", ...Array.from(new Set(paperQuestions.map((q) => q.subject)))];
  const filteredQuestions = paperQuestions.filter((q) => {
    const matchesSubject = selectedSubject === "All" || q.subject === selectedSubject;
    const matchesSearch =
      q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.options.some((opt) => opt.toLowerCase().includes(questionSearch.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Get wrong and unanswered question numbers for selected result inspection
  const wrongQuestionNumbers: number[] = [];
  const unansweredQuestionNumbers: number[] = [];
  if (selectedResult) {
    selectedResult.answers.forEach((ans, idx) => {
      if (ans === null) {
        unansweredQuestionNumbers.push(idx + 1);
      } else if (ans !== defaultQuestions[idx]?.correctAnswer) {
        wrongQuestionNumbers.push(idx + 1);
      }
    });
  }

  if (!isClient) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-navy-950">
        <div className="animate-pulse text-foreground/45">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-navy-950 p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-6 animate-scale-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-2xl shadow-gold-500/25 mb-2">
              <svg className="w-8 h-8 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gradient-gold">
              Admin Portal Login
            </h2>
            <p className="text-sm text-foreground/50">
              Enter password to access examination & student management
            </p>
          </div>

          <Card variant="highlight" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-danger flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={checkingLogin || !password}
              >
                {checkingLogin ? "Authenticating..." : "Login to Admin Portal"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-navy-950 text-foreground p-0 md:p-6 gap-0 md:gap-6">
      {/* App Sidebar */}
      <AdminSidebar
        activeTab={adminNavTab}
        setActiveTab={(tab) => {
          setAdminNavTab(tab);
          setActiveManagingExam(null); // Return to list view
        }}
        onLogout={handleLogout}
      />

      {/* Main Admin Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* Top Header Bar */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {EXAM_INFO.title} — Admin Portal
            </h1>
            <p className="text-xs text-foreground/40 mt-1">
              Examination Management & Control Dashboard
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchResults}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </Button>
        </div>

        {/* SECTION 1: Student Results */}
        {adminNavTab === "candidates" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                label="Total Candidates"
                value={totalCandidatesCount}
                color="text-gold-400"
              />
              <StatCard
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                label="Total Submissions"
                value={totalExamsCount}
                color="text-info"
              />
            </div>

            {/* Filters */}
            <Card className="!p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by candidate name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "score" | "name")}
                    className="px-3 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="name">Sort by Name</option>
                  </select>
                  <button
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    className="p-2.5 rounded-xl bg-navy-800 border border-navy-600/50 hover:bg-navy-700 transition cursor-pointer"
                  >
                    <svg className={cn("w-4 h-4 transition-transform", sortOrder === "asc" && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>

            {/* Candidate Table */}
            {loading ? (
              <Card className="text-center py-12 text-foreground/45">Loading student submissions...</Card>
            ) : filteredResults.length === 0 ? (
              <Card className="text-center py-12 text-foreground/45">No student results found.</Card>
            ) : (
              <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-600/30">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">#</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Student</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Exam Title</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Score</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Correct</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Wrong</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Time</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Date</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, index) => (
                        <tr key={result.id || index} className="border-b border-navy-700/20 hover:bg-navy-800/50 transition-colors">
                          <td className="px-6 py-4 text-foreground/40">{index + 1}</td>
                          <td className="px-6 py-4 font-medium text-white">{result.candidateName}</td>
                          <td className="px-6 py-4 text-xs text-gold-400 font-semibold">{result.examTitle || "CULET-2026 Mock Test 2"}</td>
                          <td className="px-6 py-4 text-center font-bold text-gold-400">{result.totalMarks} / {result.maxMarks}</td>
                          <td className="px-6 py-4 text-center text-success font-semibold">{result.correctCount}</td>
                          <td className="px-6 py-4 text-center text-danger font-semibold">{result.wrongCount}</td>
                          <td className="px-6 py-4 text-center text-foreground/50">{formatTime(result.timeTaken)}</td>
                          <td className="px-6 py-4 text-center text-foreground/40 text-xs">
                            {new Date(result.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleSelectResult(result)} className="p-2 rounded-lg hover:bg-navy-700 transition cursor-pointer text-foreground/40 hover:text-gold-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {result.id && (
                                <button onClick={() => setDeletingCandidate(result)} className="p-2 rounded-lg hover:bg-danger/20 transition cursor-pointer text-foreground/40 hover:text-danger">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* SECTION 2: Examinations & Papers Management */}
        {adminNavTab === "exams" && (
          <div className="space-y-6 animate-fade-in">
            {/* VIEW A: Main Exams Grid View */}
            {!activeManagingExam ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Examinations & Test Papers</h2>
                    <p className="text-xs text-foreground/40 mt-1">Manage test papers, add new exams, and configure individual exam timers.</p>
                  </div>
                  <Button onClick={() => setShowAddExamModal(true)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Examination
                  </Button>
                </div>

                {/* Exam Paper Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {examPapers.map((paper) => (
                    <Card key={paper.id} variant="highlight" className="p-6 flex flex-col justify-between space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/30">
                            {paper.subtitle}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${paper.status === "active" ? "bg-success/20 text-success border border-success/30" : "bg-warning/20 text-warning border border-warning/30"}`}>
                            {paper.status === "active" ? "🟢 LIVE" : "🟡 PAUSED"}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{paper.title}</h3>
                        <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">{paper.description}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-navy-600/30">
                        <div className="glass-card-light p-2.5 rounded-xl">
                          <p className="text-[10px] text-foreground/40 uppercase">Questions</p>
                          <p className="text-base font-bold text-gold-400">{paper.questions.length}</p>
                        </div>
                        <div className="glass-card-light p-2.5 rounded-xl">
                          <p className="text-[10px] text-foreground/40 uppercase">Timer</p>
                          <p className="text-base font-bold text-white">{paper.totalTimeMinutes} Mins</p>
                        </div>
                        <div className="glass-card-light p-2.5 rounded-xl">
                          <p className="text-[10px] text-foreground/40 uppercase">Marking</p>
                          <p className="text-base font-bold text-success">+{paper.marksPerCorrect} / -{paper.negativeMarks}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={() => handleOpenManageExam(paper)}>
                          ⚙️ Control Exam
                        </Button>
                        <Button variant="secondary" size="sm" className="text-danger border-danger/20 hover:bg-danger/10" onClick={() => handleDeleteExam(paper.id)}>
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* VIEW B: Dedicated Control Panel INSIDE Selected Exam */
              <div className="space-y-6 animate-slide-up">
                {/* Back Header */}
                <div className="flex items-center justify-between border-b border-navy-600/30 pb-4">
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={() => setActiveManagingExam(null)}>
                      ← Back to All Exams
                    </Button>
                    <div>
                      <span className="text-xs text-gold-400 font-semibold">Editing Examination:</span>
                      <h2 className="text-xl font-bold text-white">{activeManagingExam.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setExamStatus((prev) => (prev === "active" ? "paused" : "active"))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      examStatus === "active" ? "bg-success/20 text-success border border-success/30" : "bg-warning/20 text-warning border border-warning/30"
                    }`}
                  >
                    {examStatus === "active" ? "🟢 LIVE & ACTIVE" : "🟡 PAUSED FOR MAINTENANCE"}
                  </button>
                </div>

                {/* Exam Settings Card */}
                <Card className="p-6 space-y-6">
                  <h3 className="text-base font-bold text-gold-400 uppercase tracking-wider">
                    ⚙️ Examination Controls & Timer Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Exam Title</label>
                      <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Subtitle / Category</label>
                      <input
                        type="text"
                        value={examSubtitle}
                        onChange={(e) => setExamSubtitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Description</label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  {/* Timer */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase mb-2">
                      Timer Duration for this Exam (Minutes)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[25, 40, 60, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setExamTimeMinutes(mins)}
                          className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                            examTimeMinutes === mins
                              ? "bg-gold-500 text-navy-950 border-gold-500 font-bold"
                              : "bg-navy-900 border-navy-700 text-foreground/60 hover:text-white"
                          }`}
                        >
                          {mins} Mins
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={examTimeMinutes}
                      onChange={(e) => setExamTimeMinutes(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  {/* Marking Scheme */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Marks (+ Correct)</label>
                      <input
                        type="number"
                        value={marksPerCorrect}
                        onChange={(e) => setMarksPerCorrect(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Deduction (- Wrong)</label>
                      <input
                        type="number"
                        value={negativeMarks}
                        onChange={(e) => setNegativeMarks(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1.5">Passing %</label>
                      <input
                        type="number"
                        value={passingPercentage}
                        onChange={(e) => setPassingPercentage(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>

                  {settingsSaved && (
                    <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                      ✓ Examination settings saved successfully!
                    </p>
                  )}

                  <Button onClick={handleSaveExamSettings} className="w-full">
                    Save Exam Controls
                  </Button>
                </Card>

                {/* Question Bank inside THIS Exam */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-white">
                      📝 Question Bank for &quot;{activeManagingExam.title}&quot; ({filteredQuestions.length} Questions)
                    </h3>
                    <Button size="sm" onClick={() => setShowAddQuestionModal(true)}>
                      ➕ Add Question to this Exam
                    </Button>
                  </div>

                  {/* Filter */}
                  <Card className="!p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Search question keyword..."
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50"
                      />
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="px-3 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm focus:outline-none cursor-pointer"
                      >
                        {subjects.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </Card>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => (
                      <Card key={q.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-navy-600/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-navy-800 text-gold-400 font-bold text-xs border border-gold-500/20">
                              Q{q.id}
                            </span>
                            <span className="text-xs text-foreground/40 font-medium">{q.subject}</span>
                          </div>
                          <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
                            Correct: Option {["A", "B", "C", "D"][q.correctAnswer]}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-white">{q.question}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-2.5 rounded-lg border text-xs flex items-center gap-2",
                                i === q.correctAnswer
                                  ? "border-success/40 bg-success/10 text-success font-semibold"
                                  : "border-navy-700/50 bg-navy-900/40 text-foreground/60"
                              )}
                            >
                              <span className="w-5 h-5 rounded flex items-center justify-center bg-navy-800 text-[10px] font-bold">
                                {["A", "B", "C", "D"][i]}
                              </span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: Add New Examination */}
        {showAddExamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setShowAddExamModal(false)} />
            <div className="relative glass-card p-6 md:p-8 max-w-lg w-full animate-scale-in space-y-6">
              <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
                <h3 className="text-lg font-bold text-white">Create New Examination Paper</h3>
                <button onClick={() => setShowAddExamModal(false)} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="e.g. CUET Test 1"
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newExamSubtitle}
                    onChange={(e) => setNewExamSubtitle(e.target.value)}
                    placeholder="e.g. Law Entrance Exam"
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Timer Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={newExamTimeMinutes}
                    onChange={(e) => setNewExamTimeMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Description</label>
                  <textarea
                    value={newExamDescription}
                    onChange={(e) => setNewExamDescription(e.target.value)}
                    placeholder="Short description of this exam..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddExamModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Examination
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Add Question to Active Exam */}
        {showAddQuestionModal && activeManagingExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setShowAddQuestionModal(false)} />
            <div className="relative glass-card p-6 md:p-8 max-w-xl w-full animate-scale-in space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
                <h3 className="text-lg font-bold text-white">Add Question to &quot;{activeManagingExam.title}&quot;</h3>
                <button onClick={() => setShowAddQuestionModal(false)} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newQSubject}
                    onChange={(e) => setNewQSubject(e.target.value)}
                    placeholder="e.g. Legal Reasoning"
                    className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Question Text</label>
                  <textarea
                    required
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Enter question statement..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-foreground/60 uppercase">Option Choices</label>
                  <input type="text" required placeholder="Option A" value={newOpt0} onChange={(e) => setNewOpt0(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                  <input type="text" required placeholder="Option B" value={newOpt1} onChange={(e) => setNewOpt1(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                  <input type="text" placeholder="Option C" value={newOpt2} onChange={(e) => setNewOpt2(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                  <input type="text" placeholder="Option D" value={newOpt3} onChange={(e) => setNewOpt3(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Select Correct Answer</label>
                  <select
                    value={newQCorrect}
                    onChange={(e) => setNewQCorrect(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 font-bold text-sm focus:outline-none cursor-pointer"
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddQuestionModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Question
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Candidate Confirmation Modal */}
        {deletingCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setDeletingCandidate(null)} />
            <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
              <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Delete {deletingCandidate.candidateName}?</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">&quot;{deletingCandidate.candidateName}&quot;</span>? This action will permanently remove their examination attempt and score records.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDeletingCandidate(null)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" disabled={isDeleting} onClick={() => deletingCandidate.id && handleDeleteCandidate(deletingCandidate.id)}>
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => handleSelectResult(null)} />
            <div className="relative glass-card p-6 md:p-8 max-w-5xl w-full animate-scale-in max-h-[90vh] flex flex-col overflow-hidden text-left">
              <div className="flex items-center justify-between mb-4 border-b border-navy-600/30 pb-3">
                <h3 className="text-lg font-bold text-white">Candidate Examination Inspection</h3>
                <button onClick={() => handleSelectResult(null)} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="flex gap-2 mb-4 border-b border-navy-600/20 pb-2">
                <button onClick={() => setResultTab("summary")} className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "summary" ? "bg-gold-500 text-navy-950" : "text-foreground/60 hover:text-white hover:bg-navy-800")}>
                  Summary
                </button>
                <button onClick={() => setResultTab("review")} className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "review" ? "bg-gold-500 text-navy-950" : "text-foreground/60 hover:text-white hover:bg-navy-800")}>
                  Question-by-Question Review
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {resultTab === "summary" ? (
                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b border-navy-600/30">
                      <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Candidate</p>
                      <h4 className="text-xl font-bold text-white">{selectedResult.candidateName}</h4>
                      <p className="text-xs text-gold-400 mt-1 font-semibold">{selectedResult.examTitle || "CULET-2026 Mock Test 2"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow label="Total Score" value={`${selectedResult.totalMarks} / ${selectedResult.maxMarks}`} />
                      <DetailRow label="Percentage" value={`${selectedResult.percentage}%`} />
                      <DetailRow label="Correct Answers" value={`${selectedResult.correctCount}`} valueColor="text-success" />
                      <DetailRow label="Wrong Answers" value={`${selectedResult.wrongCount}`} valueColor="text-danger" />
                      <DetailRow label="Unanswered" value={`${selectedResult.unansweredCount}`} />
                      <DetailRow label="Time Taken" value={formatTime(selectedResult.timeTaken)} />
                      <DetailRow label="Submitted" value={new Date(selectedResult.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} className="col-span-2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const examPaper = examPapers.find((p) => p.id === selectedResult.examId);
                      const questionList =
                        examPaper && examPaper.questions && examPaper.questions.length > 0
                          ? examPaper.questions
                          : defaultQuestions;

                      return questionList.map((question, idx) => {
                        const selectedOpt = selectedResult.answers[idx];
                        const isUnanswered = selectedOpt === null || selectedOpt === undefined;
                        const isCorrect = !isUnanswered && selectedOpt === question.correctAnswer;

                        return (
                          <div
                            key={question.id || idx}
                            className="glass-card-light p-4 md:p-5 rounded-xl space-y-3 border border-navy-700/50"
                          >
                            <div className="flex items-center justify-between border-b border-navy-600/30 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded bg-navy-800 text-gold-400 font-bold text-xs">
                                  Q{idx + 1}
                                </span>
                                {question.subject && (
                                  <span className="text-[11px] text-foreground/40 font-medium">
                                    {question.subject}
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-md",
                                  isUnanswered
                                    ? "bg-navy-800 text-foreground/50 border border-navy-700"
                                    : isCorrect
                                    ? "bg-success/15 text-success border border-success/30"
                                    : "bg-danger/15 text-danger border border-danger/30"
                                )}
                              >
                                {isUnanswered
                                  ? "UNANSWERED (0)"
                                  : isCorrect
                                  ? "CORRECT (+1)"
                                  : "WRONG (-0.25)"}
                              </span>
                            </div>

                            <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
                              {question.question}
                            </p>

                            {/* Options List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {question.options.map((optText, optIdx) => {
                                const isSelectedByUser = selectedOpt === optIdx;
                                const isOptionCorrect = question.correctAnswer === optIdx;

                                let optClass =
                                  "bg-navy-900/60 border-navy-800 text-foreground/60";
                                let badge = null;

                                // Only highlight option selections and correct answers IF the question was attempted
                                if (!isUnanswered) {
                                  if (isOptionCorrect) {
                                    optClass =
                                      "bg-success/15 border-success/50 text-white font-medium shadow-sm shadow-success/10";
                                    badge = (
                                      <span className="text-[10px] bg-success/20 text-success font-bold px-1.5 py-0.5 rounded ml-auto">
                                        ✓ Correct
                                      </span>
                                    );
                                  }

                                  if (isSelectedByUser && !isOptionCorrect) {
                                    optClass =
                                      "bg-danger/15 border-danger/50 text-white font-medium shadow-sm shadow-danger/10";
                                    badge = (
                                      <span className="text-[10px] bg-danger/20 text-danger font-bold px-1.5 py-0.5 rounded ml-auto">
                                        ✗ Selected
                                      </span>
                                    );
                                  }

                                  if (isSelectedByUser && isOptionCorrect) {
                                    badge = (
                                      <span className="text-[10px] bg-success/30 text-success font-bold px-1.5 py-0.5 rounded ml-auto">
                                        ✓ Selected & Correct
                                      </span>
                                    );
                                  }
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    className={cn(
                                      "p-3 rounded-lg border text-xs flex items-center gap-2.5 transition-all",
                                      optClass
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]",
                                        !isUnanswered && isOptionCorrect
                                          ? "bg-success text-navy-950"
                                          : !isUnanswered && isSelectedByUser
                                          ? "bg-danger text-white"
                                          : "bg-navy-800 text-foreground/40"
                                      )}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1">{optText}</span>
                                    {badge}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="!p-5 flex items-center gap-4">
      <div className={cn("p-2.5 rounded-xl bg-glass-light", color)}>{icon}</div>
      <div>
        <p className="text-xs text-foreground/40">{label}</p>
        <p className={cn("text-xl font-bold", color)}>{value}</p>
      </div>
    </Card>
  );
}

function DetailRow({ label, value, valueColor = "text-white", className }: { label: string; value: string; valueColor?: string; className?: string }) {
  return (
    <div className={cn("glass-card-light p-3 rounded-xl", className)}>
      <p className="text-xs text-foreground/40 mb-0.5">{label}</p>
      <p className={cn("text-sm font-semibold", valueColor)}>{value}</p>
    </div>
  );
}

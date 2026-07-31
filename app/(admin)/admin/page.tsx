"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllExamResults, deleteExamResult, getAllStudentUsers, deleteStudentUserInDB, StudentUserRecord, saveExamPaperInDB } from "@/lib/firebase";
import { ResultDocument, ExamPaper, ServerQuestion } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { downloadExamScorecardPDF } from "@/lib/generatePdfReport";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import AdminSidebar from "@/components/layout/AdminSidebar";
import ExamScheduler from "@/components/ui/ExamScheduler";
import NumericInput from "@/components/ui/NumericInput";
import QuestionImportModal from "@/components/ui/QuestionImportModal";
import AiQuestionExtractorModal from "@/components/ui/AiQuestionExtractorModal";
import { EXAM_INFO } from "@/lib/constants";
import {
  initialExamPapers,
  getExamPapers,
  getExamPaperById,
  syncExamPapersWithDB,
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
  const [adminNavTab, setAdminNavTab] = useState<"candidates" | "exams" | "students">("candidates");

  // Admin Registered Students State ("Only Students")
  const [studentUsers, setStudentUsers] = useState<StudentUserRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [deletingStudentUser, setDeletingStudentUser] = useState<StudentUserRecord | null>(null);

  // Admin Delete Candidate Confirmation State
  const [deletingCandidate, setDeletingCandidate] = useState<ResultDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingExamPaper, setDeletingExamPaper] = useState<ExamPaper | null>(null);
  const [visibilityAlertPaper, setVisibilityAlertPaper] = useState<ExamPaper | null>(null);

  // Multiple Selection for Candidate Results
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Multi-Exam Management State
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [activeManagingExam, setActiveManagingExam] = useState<ExamPaper | null>(null);

  // Exam Edit Form State (Inside Managing Exam)
  const [examTitle, setExamTitle] = useState("");
  const [examSubtitle, setExamSubtitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examTimeMinutes, setExamTimeMinutes] = useState(120);
  const [marksPerCorrect, setMarksPerCorrect] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [examStatus, setExamStatus] = useState<"active" | "paused">("active");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState("");

  // Exam Scheduling State
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");

  // Track if any field in the control panel has unsaved edits
  const hasUnsavedChanges = useMemo(() => {
    if (!activeManagingExam) return false;
    return (
      examTitle !== activeManagingExam.title ||
      examSubtitle !== activeManagingExam.subtitle ||
      examDescription !== activeManagingExam.description ||
      examTimeMinutes !== activeManagingExam.totalTimeMinutes ||
      marksPerCorrect !== activeManagingExam.marksPerCorrect ||
      negativeMarks !== activeManagingExam.negativeMarks ||
      passingPercentage !== activeManagingExam.passingPercentage ||
      maxAttempts !== activeManagingExam.maxAttempts ||
      examStatus !== activeManagingExam.status ||
      (scheduledDate || "") !== (activeManagingExam.scheduledDate || "") ||
      (scheduledStartTime || "") !== (activeManagingExam.scheduledStartTime || "") ||
      (scheduledEndTime || "") !== (activeManagingExam.scheduledEndTime || "")
    );
  }, [
    activeManagingExam,
    examTitle,
    examSubtitle,
    examDescription,
    examTimeMinutes,
    marksPerCorrect,
    negativeMarks,
    passingPercentage,
    maxAttempts,
    examStatus,
    scheduledDate,
    scheduledStartTime,
    scheduledEndTime,
  ]);

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

  // Question Search & Import State inside Exam
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleImportQuestions = async (importedQuestions: ServerQuestion[], mode: "append" | "overwrite") => {
    if (!activeManagingExam) return;

    let updatedQuestions: ServerQuestion[] = [];
    if (mode === "overwrite") {
      updatedQuestions = importedQuestions.map((q, idx) => ({ ...q, id: idx + 1 }));
    } else {
      const existing = activeManagingExam.questions || [];
      const startId = existing.length + 1;
      const reindexed = importedQuestions.map((q, idx) => ({ ...q, id: startId + idx }));
      updatedQuestions = [...existing, ...reindexed];
    }

    const updatedPaper: ExamPaper = {
      ...activeManagingExam,
      questions: updatedQuestions,
    };

    updateExamPaper(updatedPaper);
    setActiveManagingExam(updatedPaper);
    setExamPapers(getExamPapers());

    try {
      await saveExamPaperInDB(updatedPaper);
      setActionSuccessNotice(`Successfully imported ${importedQuestions.length} questions to ${activeManagingExam.title}!`);
      setTimeout(() => setActionSuccessNotice(""), 4000);
    } catch (err) {
      console.error("Error saving imported questions to Firestore DB:", err);
    }
  };

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
    setMaxAttempts(paper.maxAttempts ?? 1);
    setExamStatus(paper.status);
    setScheduledDate(paper.scheduledDate || "");
    setScheduledStartTime(paper.scheduledStartTime || "");
    setScheduledEndTime(paper.scheduledEndTime || "");
  };

  const handleStartTimeChange = (newStart: string) => {
    setScheduledStartTime(newStart);
    if (newStart && scheduledEndTime) {
      const [sh, sm] = newStart.split(":").map(Number);
      const [eh, em] = scheduledEndTime.split(":").map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let sMins = sh * 60 + sm;
        let eMins = eh * 60 + em;
        if (eMins <= sMins) eMins += 1440;
        const diff = eMins - sMins;
        if (diff > 0) setExamTimeMinutes(diff);
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setScheduledEndTime(newEnd);
    if (scheduledStartTime && newEnd) {
      const [sh, sm] = scheduledStartTime.split(":").map(Number);
      const [eh, em] = newEnd.split(":").map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let sMins = sh * 60 + sm;
        let eMins = eh * 60 + em;
        if (eMins <= sMins) eMins += 1440;
        const diff = eMins - sMins;
        if (diff > 0) setExamTimeMinutes(diff);
      }
    }
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
      maxAttempts,
      status: examStatus,
      scheduledDate: scheduledDate || undefined,
      scheduledStartTime: scheduledStartTime || undefined,
      scheduledEndTime: scheduledEndTime || undefined,
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
      maxAttempts: 1,
      status: "active",
      questions: [], // Starts completely clean with 0 questions
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
    deleteExamPaper(paperId);
    setExamPapers(getExamPapers());
    if (activeManagingExam?.id === paperId) {
      setActiveManagingExam(null);
    }
  };

  const resetNewQForm = () => {
    setNewQText("");
    setNewOpt0("");
    setNewOpt1("");
    setNewOpt2("");
    setNewOpt3("");
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
    const updated = getExamPaperById(activeManagingExam.id);
    if (updated) {
      setActiveManagingExam(updated);
      setExamPapers(getExamPapers());
    }
    resetNewQForm();
  };

  const handleSelectResult = (res: ResultDocument | null) => {
    setSelectedResult(res);
    setResultTab("summary");
    setActionSuccessNotice("");
  };

  const fetchStudentUsers = async () => {
    setLoadingStudents(true);
    try {
      const users = await getAllStudentUsers();
      setStudentUsers(users);
    } catch (err) {
      console.error("Error fetching student users:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getAllExamResults();
      setResults(data);
      const synced = await syncExamPapersWithDB();
      setExamPapers(synced);
      await fetchStudentUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudentUser = async (user: StudentUserRecord) => {
    setIsDeleting(true);
    try {
      await deleteStudentUserInDB(user.id);
      await fetchStudentUsers();
      setDeletingStudentUser(null);
    } catch (err) {
      console.error("Error deleting student user account:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCandidate = async (target: ResultDocument | string) => {
    setIsDeleting(true);
    try {
      const resDoc = typeof target === "string" ? results.find((r) => r.id === target) : target;
      const resId = typeof target === "string" ? target : target.id;

      if (resId) {
        await deleteExamResult(
          resId,
          resDoc?.studentDocId,
          resDoc?.candidateEmail,
          resDoc?.candidateName,
          false // DO NOT delete student account when deleting an exam result attempt
        );
        setResults((prev) => prev.filter((r) => r.id !== resId));
        if (selectedResult?.id === resId) {
          setSelectedResult(null);
        }
      }
      setDeletingCandidate(null);
    } catch (err) {
      alert("Failed to delete candidate record from database. Please check connection.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedResults((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredResults.map((r) => r.id || "").filter(Boolean);
    if (selectedResults.length === allIds.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(allIds);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      console.log(`🧹 [BULK DELETE] Starting deletion of ${selectedResults.length} selected exam results...`);

      // Perform all deletions in parallel
      await Promise.all(
        selectedResults.map(async (resId) => {
          const resDoc = results.find((r) => r.id === resId);
          if (resId && resDoc) {
            await deleteExamResult(
              resId,
              resDoc.studentDocId,
              resDoc.candidateEmail,
              resDoc.candidateName,
              false // do not delete student account
            );
          }
        })
      );

      console.log(`🧹 [BULK DELETE] Successfully deleted ${selectedResults.length} exam results.`);

      // Update local state
      setResults((prev) => prev.filter((r) => !selectedResults.includes(r.id || "")));
      if (selectedResult && selectedResults.includes(selectedResult.id || "")) {
        setSelectedResult(null);
      }
      setSelectedResults([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      alert("Failed to delete some candidate records from database. Please check connection.");
      console.error("Error in bulk delete:", err);
    } finally {
      setIsBulkDeleting(false);
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

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetch("/api/admin/check-auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchResults();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setLoading(false);
      });
  }, []);

  // Fetch student accounts when switching to the "Only Students" tab
  useEffect(() => {
    if (isAuthenticated && adminNavTab === "students") {
      fetchStudentUsers();
    }
  }, [adminNavTab, isAuthenticated]);

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

  // Filter Registered Student Users ("Only Students")
  const filteredStudentUsers = studentUsers.filter((u) => {
    const query = studentSearch.toLowerCase().trim();
    if (!query) return true;
    const nameStr = (u.name || "").toLowerCase();
    const emailStr = (u.email || "").toLowerCase();
    return nameStr.includes(query) || emailStr.includes(query);
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
                className="w-full flex items-center justify-center gap-2"
                disabled={checkingLogin || !password}
              >
                {checkingLogin ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  "Login to Admin Portal"
                )}
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
          {adminNavTab !== "exams" && (
            <Button variant="secondary" size="sm" onClick={fetchResults}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </Button>
          )}
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

            {/* Bulk Action Bar */}
            {selectedResults.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-danger/10 border border-danger/25 rounded-xl animate-scale-in">
                <span className="text-sm font-semibold text-red-300">
                  ⚡ {selectedResults.length} candidate record(s) selected
                </span>
                <Button variant="danger" size="sm" onClick={() => setShowBulkDeleteModal(true)}>
                  Delete Selected
                </Button>
              </div>
            )}

            {loading ? (
              <Card className="text-center py-16 text-foreground/45 flex flex-col items-center justify-center gap-3">
                <Spinner className="w-8 h-8 text-gold-500" />
                <span>Loading student submissions...</span>
              </Card>
            ) : filteredResults.length === 0 ? (
              <Card className="text-center py-12 text-foreground/45">No student results found.</Card>
            ) : (
              <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-600/30">
                        <th className="px-4 py-4 text-center w-12">
                          <input
                            type="checkbox"
                            checked={filteredResults.length > 0 && selectedResults.length === filteredResults.length}
                            onChange={handleSelectAll}
                            className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer"
                          />
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">#</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Student</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Exam Title</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Attempt</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Score</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Time</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Date</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, index) => {
                        const candidateSubmissions = results
                          .filter(
                            (x) =>
                              x.examId === result.examId &&
                              ((x.candidateEmail &&
                                result.candidateEmail &&
                                x.candidateEmail.toLowerCase() === result.candidateEmail.toLowerCase()) ||
                                x.candidateName.toLowerCase().trim() === result.candidateName.toLowerCase().trim())
                          )
                          .sort(
                            (a, b) =>
                              new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime()
                          );

                        const attemptNumber = candidateSubmissions.findIndex((x) => x.id === result.id) + 1;
                        const paperObj = examPapers.find((p) => p.id === result.examId);
                        const maxAtt = paperObj?.maxAttempts ?? 1;

                        return (
                          <tr key={result.id || index} className="border-b border-navy-700/20 hover:bg-navy-800/50 transition-colors">
                            <td className="px-4 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedResults.includes(result.id || "")}
                                onChange={() => handleSelectRow(result.id || "")}
                                className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 text-foreground/40">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{result.candidateName}</span>
                                {result.autoSubmitted && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/15 text-danger border border-danger/30 flex items-center gap-1 cursor-help" title={`Auto-submitted due to ${result.tabSwitchCount || 4} tab switch violations!`}>
                                    ⚠️ Cheated
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gold-400 font-semibold whitespace-nowrap">{result.examTitle || "CULET-2026 Mock Test 2"}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple/15 text-purple-300 border border-purple/30 whitespace-nowrap">
                                Attempt {attemptNumber} of {maxAtt === 0 ? "∞" : maxAtt}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gold-400 whitespace-nowrap">{result.totalMarks} / {result.maxMarks}</td>
                            <td className="px-6 py-4 text-center text-foreground/50">{formatTime(result.timeTaken)}</td>
                            <td className="px-6 py-4 text-center text-foreground/40 text-xs">
                              {new Date(result.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => downloadExamScorecardPDF(result)}
                                  title="Download Scorecard PDF"
                                  className="p-2 rounded-lg hover:bg-gold-500/20 transition cursor-pointer text-foreground/40 hover:text-gold-400"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                                <button onClick={() => handleSelectResult(result)} title="Inspect Details" className="p-2 rounded-lg hover:bg-navy-700 transition cursor-pointer text-foreground/40 hover:text-gold-400">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                {result.id && (
                                  <button onClick={() => setDeletingCandidate(result)} title="Delete Record" className="p-2 rounded-lg hover:bg-danger/20 transition cursor-pointer text-foreground/40 hover:text-danger">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                {loading ? (
                  <Card className="text-center py-16 text-foreground/45 flex flex-col items-center justify-center gap-3">
                    <Spinner className="w-8 h-8 text-gold-500" />
                    <span>Loading examinations...</span>
                  </Card>
                ) : examPapers.length === 0 ? (
                  <Card className="text-center py-12 text-foreground/45">No examination papers found.</Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {examPapers.map((paper) => (
                      <Card key={paper.id} variant="highlight" className="p-6 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/30">
                              {paper.subtitle}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              paper.isPrivate
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10"
                                : paper.status === "active"
                                ? "bg-success/20 text-success border border-success/30"
                                : "bg-warning/20 text-warning border border-warning/30"
                            }`}>
                              {paper.isPrivate ? "🔒 PRIVATE" : paper.status === "active" ? "🟢 PUBLIC" : "🟡 PAUSED"}
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
                            <p className="text-base font-bold">
                              <span className="text-success">+{paper.marksPerCorrect}</span>
                              <span className="text-foreground/40 font-normal mx-1">/</span>
                              <span className="text-danger">-{paper.negativeMarks}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-2">
                          <Button className="flex-1 min-w-[120px]" onClick={() => handleOpenManageExam(paper)}>
                            ⚙️ Control Exam
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className={paper.isPrivate ? "text-success border-success/30 bg-success/10 hover:bg-success/20 font-bold" : "text-purple-300 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 font-bold"}
                            onClick={() => setVisibilityAlertPaper(paper)}
                          >
                            {paper.isPrivate ? "🌐 Make Public" : "🔒 Make Private"}
                          </Button>
                          <Button variant="secondary" size="sm" className="text-danger border-danger/20 hover:bg-danger/10" onClick={() => setDeletingExamPaper(paper)}>
                            Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${examStatus === "active" ? "bg-success/20 text-success border border-success/30" : "bg-warning/20 text-warning border border-warning/30"
                      }`}
                  >
                    {examStatus === "active" ? "🟢 LIVE & ACTIVE" : "🟡 PAUSED FOR MAINTENANCE"}
                  </button>
                </div>

                {/* ════ Exam Settings Card — Premium Redesign ════ */}
                <div className="rounded-2xl border border-white/10 bg-navy-950/40 backdrop-blur-sm overflow-hidden">

                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-sm">⚙️</div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Examination Controls</h3>
                        <p className="text-[11px] text-foreground/40">Configure exam settings, scoring and schedule</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExamStatus((prev) => (prev === "active" ? "paused" : "active"))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition border flex items-center gap-1.5 ${examStatus === "active"
                        ? "bg-success/10 text-success border-success/30 hover:bg-success/15"
                        : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/15"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${examStatus === "active" ? "bg-success animate-pulse" : "bg-warning"}`} />
                      {examStatus === "active" ? "Live & Active" : "Paused"}
                    </button>
                  </div>

                  <div className="p-6 space-y-6">

                    {/* ── Section 1: Basic Info ── */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Basic Info</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground/50">Exam Title</label>
                          <input
                            type="text"
                            value={examTitle}
                            onChange={(e) => setExamTitle(e.target.value)}
                            placeholder="e.g. CULET-2026 Mock Test 3"
                            className="w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-white/8 text-white text-sm placeholder:text-foreground/25 focus:outline-none focus:border-gold-500/50 transition"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground/50">Subtitle / Category</label>
                          <input
                            type="text"
                            value={examSubtitle}
                            onChange={(e) => setExamSubtitle(e.target.value)}
                            placeholder="e.g. Law Entrance Practice"
                            className="w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-white/8 text-white text-sm placeholder:text-foreground/25 focus:outline-none focus:border-gold-500/50 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground/50">Description</label>
                        <textarea
                          value={examDescription}
                          onChange={(e) => setExamDescription(e.target.value)}
                          rows={2}
                          placeholder="Brief description shown to students on the dashboard..."
                          className="w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-white/8 text-white text-sm placeholder:text-foreground/25 focus:outline-none focus:border-gold-500/50 transition resize-none"
                        />
                      </div>
                    </div>

                    {/* ── Section 2: Timer & Scoring ── */}
                    <div className="space-y-3 pt-5 border-t border-white/6">
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Timer & Scoring</p>

                      {/* Duration chips + distinct custom input */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                            <span>⏱️</span> Exam Duration
                          </label>
                          <span className="text-xs font-extrabold text-gold-400 bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20">
                            {examTimeMinutes} Minutes Total
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Quick Preset Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[25, 40, 60, 90, 120].map((mins) => {
                              const isSelected = examTimeMinutes === mins;
                              return (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => setExamTimeMinutes(mins)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    isSelected
                                      ? "bg-gold-500 text-navy-950 border-gold-400 shadow-md shadow-gold-500/20"
                                      : "bg-navy-900/80 border-white/10 text-foreground/50 hover:text-white hover:border-white/20"
                                  }`}
                                >
                                  {mins}m
                                </button>
                              );
                            })}
                          </div>

                          <div className="hidden sm:block h-6 w-[1px] bg-white/10" />

                          {/* Distinct Custom Duration Box */}
                          {(() => {
                            const isCustom = ![25, 40, 60, 90, 120].includes(examTimeMinutes);
                            return (
                              <div
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all ${
                                  isCustom
                                    ? "bg-purple-500/15 border-purple-500/40 text-purple-300 ring-1 ring-purple-500/20"
                                    : "bg-navy-950/80 border-white/10 text-foreground/60"
                                }`}
                              >
                                <span className="text-xs font-bold text-foreground/50">Custom:</span>
                                <NumericInput
                                  value={examTimeMinutes}
                                  onChange={(v) => setExamTimeMinutes(v)}
                                  className="w-20 px-3 py-2 rounded-xl bg-navy-900 border border-white/10 text-gold-400 font-bold text-sm text-center focus:outline-none focus:border-gold-500 transition shadow-inner"
                                />
                                <span className="text-xs font-semibold text-foreground/50">mins</span>
                                {isCustom && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 ml-1">
                                    Active
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Scoring tiles */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {[
                          { label: "Marks / Correct", key: "marksPerCorrect", value: marksPerCorrect, setter: setMarksPerCorrect, step: 0.25, color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5", prefix: "+", hint: "per correct answer" },
                          { label: "Deduction / Wrong", key: "negativeMarks", value: negativeMarks, setter: setNegativeMarks, step: 0.05, color: "text-red-400", accent: "border-red-500/20 bg-red-500/5", prefix: "−", hint: "per wrong answer" },
                          { label: "Pass Threshold", key: "passingPercentage", value: passingPercentage, setter: setPassingPercentage, step: 1, color: "text-blue-400", accent: "border-blue-500/20 bg-blue-500/5", prefix: "", suffix: "%", hint: "Min score to pass" },
                          {
                            label: "Max Attempts",
                            key: "maxAttempts",
                            value: maxAttempts,
                            setter: setMaxAttempts,
                            step: 1,
                            color: "text-purple-400",
                            accent: "border-purple-500/20 bg-purple-500/5",
                            prefix: "",
                            hint: "0 = Unlimited",
                          },
                        ].map((tile) => (
                          <div key={tile.key} className={`rounded-xl p-3 border ${tile.accent} flex flex-col justify-between space-y-1.5`}>
                            <p className="text-[10px] font-semibold text-foreground/40 leading-tight">{tile.label}</p>
                            <div className="flex items-baseline gap-1">
                              {tile.prefix && <span className={`text-base font-bold ${tile.color}`}>{tile.prefix}</span>}
                              <NumericInput
                                step={tile.step}
                                min={tile.key === "maxAttempts" ? 0 : undefined}
                                value={tile.value}
                                onChange={(val) => (tile.setter as (n: number) => void)(val)}
                                className={`w-full bg-transparent text-base font-bold ${tile.color} focus:outline-none`}
                              />
                              {tile.suffix && <span className={`text-xs font-bold ${tile.color}`}>{tile.suffix}</span>}
                            </div>
                            <p className={`text-[9px] font-medium leading-none ${tile.key === "maxAttempts" && tile.value === 0 ? "text-purple-300 font-bold" : "text-foreground/30"}`}>
                              {tile.hint}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Section 3: Schedule Window ── */}
                    <div className="pt-5 border-t border-white/6">
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-3">Schedule Window</p>
                      <ExamScheduler
                        date={scheduledDate}
                        startTime={scheduledStartTime}
                        endTime={scheduledEndTime}
                        onDateChange={setScheduledDate}
                        onStartTimeChange={handleStartTimeChange}
                        onEndTimeChange={handleEndTimeChange}
                      />
                    </div>

                    {/* ── Save Row ── */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/6">
                      {settingsSaved ? (
                        <span className="text-xs font-bold text-success flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/30">
                          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ✓ Settings saved successfully!
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-foreground/50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/8">
                          ✓ All settings saved &amp; up to date
                        </span>
                      )}

                      <Button
                        onClick={handleSaveExamSettings}
                        className={`px-8 transition-all ${hasUnsavedChanges
                          ? "!bg-gold-500 !text-navy-950 font-bold shadow-lg shadow-gold-500/25 ring-2 ring-gold-400"
                          : ""
                          }`}
                      >
                        {hasUnsavedChanges ? "Save Changes (Unsaved)" : "Save Changes"}
                      </Button>
                    </div>

                  </div>
                </div>

                {/* Question Bank inside THIS Exam */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        📝 Question Bank for &quot;{activeManagingExam.title}&quot; ({paperQuestions.length} Questions)
                      </h3>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        Manage individual questions or drag &amp; drop an Excel/CSV file to bulk upload.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowAiModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border-purple-500/30 text-purple-300 font-bold bg-purple-500/10 hover:bg-purple-500/20"
                      >
                        <span>🤖</span>
                        <span>AI Vision Extractor</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowImportModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border-gold-500/30 text-gold-400 font-bold"
                      >
                        <span>📥</span>
                        <span>Bulk Import CSV / Excel</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowAddQuestionModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold"
                      >
                        <span>➕</span>
                        <span>Add Question</span>
                      </Button>
                    </div>
                  </div>

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

                  <div className="space-y-4">
                    {filteredQuestions.length === 0 ? (
                      <Card className="text-center py-12 text-foreground/45">
                        No questions in this exam paper yet. Click <span className="text-gold-400 font-bold">Bulk Import CSV / Excel</span> to upload questions instantly!
                      </Card>
                    ) : (
                      filteredQuestions.map((q) => (
                        <Card key={q.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-navy-600/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-navy-800 text-gold-400 font-bold text-xs border border-gold-500/20">
                                Q{q.id}
                              </span>
                              <span className="text-xs text-foreground/40 font-medium">{q.subject}</span>
                            </div>
                            <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded border border-success/20">
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

                          {q.explanation && (
                            <p className="text-xs text-foreground/40 italic pt-1 border-t border-white/5">
                              💡 <span className="font-semibold">Explanation:</span> {q.explanation}
                            </p>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Registered Student Accounts ("Only Students") */}
        {adminNavTab === "students" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={
                  <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                label="Registered Student Accounts"
                value={studentUsers.length}
                color="text-gold-400"
              />
              <StatCard
                icon={
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                label="Total Test Submissions"
                value={results.length}
                color="text-success"
              />
            </div>

            {/* Header + Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Registered Student Accounts</h2>
                <p className="text-xs text-foreground/40 mt-1">
                  List of all registered student accounts in the database ({studentUsers.length} students).
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-navy-900 border border-navy-700 rounded-xl text-xs text-white placeholder:text-foreground/40 focus:outline-none focus:border-gold-500/50"
                  />
                  <svg className="w-4 h-4 text-foreground/40 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchStudentUsers} disabled={loadingStudents}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Students Table */}
            <Card className="p-0 overflow-hidden">
              {loadingStudents ? (
                <div className="text-center py-16 text-foreground/45 flex flex-col items-center justify-center gap-3">
                  <Spinner className="w-8 h-8 text-gold-500" />
                  <span>Loading registered student accounts...</span>
                </div>
              ) : filteredStudentUsers.length === 0 ? (
                <div className="text-center py-12 text-foreground/45">
                  No registered student accounts found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-900/80 border-b border-navy-700/60 text-foreground/45 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4 text-center">Test Submissions</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/40">
                      {filteredStudentUsers.map((user) => {
                        const studentSubmissions = results.filter(
                          (r) =>
                            (user.email && r.candidateEmail?.toLowerCase() === user.email.toLowerCase()) ||
                            r.candidateName?.toLowerCase() === user.name?.toLowerCase()
                        ).length;

                        return (
                          <tr key={user.id} className="hover:bg-navy-800/30 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 font-bold flex items-center justify-center border border-gold-500/30 text-xs shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{user.name}</p>
                                  <span className="text-[10px] text-success font-medium">Verified Student</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-foreground/75 font-mono">
                              {user.email || "N/A"}
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-navy-800 text-gold-400 font-bold text-[11px] border border-navy-700">
                                {studentSubmissions} Submission{studentSubmissions !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-danger border-danger/20 hover:bg-danger/10 text-xs"
                                onClick={() => setDeletingStudentUser(user)}
                              >
                                Delete Account
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
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
                <Button variant="danger" className="flex-1 flex items-center justify-center gap-2" disabled={isDeleting} onClick={() => deletingCandidate && handleDeleteCandidate(deletingCandidate)}>
                  {isDeleting ? (
                    <>
                      <Spinner className="w-4 h-4 text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Candidate Confirmation Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setShowBulkDeleteModal(false)} />
            <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
              <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Delete Selected Attempts?</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Are you sure you want to permanently delete the <span className="font-bold text-white">{selectedResults.length}</span> selected candidate examination attempt and score records? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowBulkDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1 flex items-center justify-center gap-2" disabled={isBulkDeleting} onClick={handleBulkDelete}>
                  {isBulkDeleting ? (
                    <>
                      <Spinner className="w-4 h-4 text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Confirm Bulk Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visibility Toggle Alert Modal */}
        {visibilityAlertPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative glass-card p-6 max-w-md w-full animate-scale-in space-y-5 border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${
                  visibilityAlertPaper.isPrivate
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                }`}>
                  {visibilityAlertPaper.isPrivate ? "🌐" : "🔒"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {visibilityAlertPaper.isPrivate ? "Make Examination Public?" : "Make Examination Private (Hide)?"}
                  </h3>
                  <p className="text-xs text-foreground/50 line-clamp-1">
                    {visibilityAlertPaper.title}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/10 text-xs text-foreground/70 leading-relaxed space-y-1.5">
                {visibilityAlertPaper.isPrivate ? (
                  <p>
                    <strong className="text-success">Public Mode:</strong> All registered students will be able to see and attempt this exam on their dashboard immediately.
                  </p>
                ) : (
                  <p>
                    <strong className="text-purple-300">Private Mode:</strong> This exam will be <strong className="text-white">hidden from student dashboards</strong>. Students cannot see or take this exam while it is private.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setVisibilityAlertPaper(null)}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 font-bold ${
                    visibilityAlertPaper.isPrivate
                      ? "!bg-success !text-navy-950 shadow-md shadow-success/20"
                      : "!bg-purple-500 !text-white shadow-md shadow-purple-500/20"
                  }`}
                  onClick={() => {
                    const updated = {
                      ...visibilityAlertPaper,
                      isPrivate: !visibilityAlertPaper.isPrivate,
                    };
                    updateExamPaper(updated);
                    setExamPapers(getExamPapers());
                    setVisibilityAlertPaper(null);
                  }}
                >
                  {visibilityAlertPaper.isPrivate ? "Yes, Make Public" : "Yes, Make Private"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Student Account Confirmation Modal */}
        {deletingStudentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setDeletingStudentUser(null)} />
            <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
              <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Delete {deletingStudentUser.name}?</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Are you sure you want to delete the student account for <span className="font-bold text-white">&quot;{deletingStudentUser.name}&quot;</span> ({deletingStudentUser.email})? This action will permanently remove their user credentials from the database.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDeletingStudentUser(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isDeleting}
                  onClick={() => handleDeleteStudentUser(deletingStudentUser)}
                >
                  {isDeleting ? (
                    <>
                      <Spinner className="w-4 h-4 text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Exam Confirmation Modal */}
        {deletingExamPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-overlay absolute inset-0" onClick={() => setDeletingExamPaper(null)} />
            <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
              <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Delete {deletingExamPaper.title}?</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">&quot;{deletingExamPaper.title}&quot;</span>? This action will permanently remove this examination paper and all its associated questions.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDeletingExamPaper(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    handleDeleteExam(deletingExamPaper.id);
                    setDeletingExamPaper(null);
                  }}
                >
                  Confirm Delete
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
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Candidate Examination Inspection</h3>
                  <button
                    onClick={() => downloadExamScorecardPDF(selectedResult)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gold-500/20 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-navy-950 transition cursor-pointer flex items-center gap-1.5"
                  >
                    📄 Download Scorecard PDF
                  </button>
                </div>
                <button onClick={() => handleSelectResult(null)} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4 border-b border-navy-600/20 pb-2">
                <button onClick={() => setResultTab("summary")} className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "summary" ? "bg-gold-500 text-navy-950 font-bold" : "text-foreground/60 hover:text-white hover:bg-navy-800")}>
                  Summary
                </button>
                <button onClick={() => setResultTab("review")} className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "review" ? "bg-gold-500 text-navy-950 font-bold" : "text-foreground/60 hover:text-white hover:bg-navy-800")}>
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
                      {selectedResult.tabSwitchCount !== undefined && selectedResult.tabSwitchCount > 0 && (
                        <div className={cn("col-span-2 p-3 rounded-lg flex items-center justify-between border mt-2", selectedResult.autoSubmitted ? "bg-danger/10 border-danger/25 text-danger" : "bg-warning/10 border-warning/25 text-warning-300")}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <div className="text-left">
                              <p className="text-xs font-bold uppercase tracking-wider">Anti-Cheating Monitor</p>
                              <p className="text-[11px] opacity-80 leading-normal mt-0.5">
                                {selectedResult.autoSubmitted
                                  ? `Exam auto-submitted due to reaching maximum tab switch limit (${selectedResult.tabSwitchCount}/4).`
                                  : `Student switched tabs ${selectedResult.tabSwitchCount} time(s) during the examination.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                                  <span className="text-xs text-foreground/40 font-medium">
                                    {question.subject}
                                  </span>
                                )}
                              </div>

                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider",
                                  isUnanswered
                                    ? "bg-navy-800 text-foreground/40 border border-navy-700"
                                    : isCorrect
                                      ? "bg-success/15 text-success border border-success/30"
                                      : "bg-danger/15 text-danger border border-danger/30"
                                )}
                              >
                                {isUnanswered
                                  ? "Unanswered (0)"
                                  : isCorrect
                                    ? "Correct (+1)"
                                    : "Wrong (-0.25)"}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-white leading-relaxed">
                              {question.question}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {question.options.map((optText, optIdx) => {
                                const isOptionCorrect = !isUnanswered && optIdx === question.correctAnswer;
                                const isSelectedByUser = selectedOpt === optIdx;

                                let optClass =
                                  "bg-navy-900/60 border-navy-800 text-foreground/60";
                                let badge = null;

                                if (isOptionCorrect) {
                                  optClass =
                                    "bg-success/10 border-success/40 text-success font-medium";
                                  badge = (
                                    <span className="text-[10px] bg-success/20 text-success font-bold px-1.5 py-0.5 rounded ml-auto">
                                      ✓ Correct Key
                                    </span>
                                  );
                                }

                                if (!isUnanswered) {
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

      {showImportModal && activeManagingExam && (
        <QuestionImportModal
          examTitle={activeManagingExam.title}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportQuestions}
        />
      )}

      {showAiModal && activeManagingExam && (
        <AiQuestionExtractorModal
          examTitle={activeManagingExam.title}
          onClose={() => setShowAiModal(false)}
          onImport={handleImportQuestions}
        />
      )}
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

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getAllExamResults,
  deleteExamResult,
  getAllStudentUsers,
  deleteStudentUserInDB,
  StudentUserRecord,
  saveExamPaperInDB,
  deleteExamPaperInDB,
} from "@/lib/firebase";
import { ResultDocument, ExamPaper, ServerQuestion } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminCandidateResults from "@/components/admin/AdminCandidateResults";
import AdminStudentUsers from "@/components/admin/AdminStudentUsers";
import AdminExamManager from "@/components/admin/AdminExamManager";
import AdminModals from "@/components/admin/AdminModals";
import { EXAM_INFO } from "@/lib/constants";
import {
  getExamPapers,
  getExamPaperById,
  syncExamPapersWithDB,
  updateExamPaper,
  addExamPaper,
  deleteExamPaper,
  addQuestionToExam,
} from "@/lib/examRegistry";

export default function AdminPage() {
  const [results, setResults] = useState<ResultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ResultDocument | null>(null);
  const [adminNavTab, setAdminNavTab] = useState<"candidates" | "exams" | "students">("candidates");

  // Registered Students State
  const [studentUsers, setStudentUsers] = useState<StudentUserRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deletingStudentUser, setDeletingStudentUser] = useState<StudentUserRecord | null>(null);

  // Candidate Actions State
  const [deletingCandidate, setDeletingCandidate] = useState<ResultDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Multi-Exam Management State
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [activeManagingExam, setActiveManagingExam] = useState<ExamPaper | null>(null);
  const [deletingExamPaper, setDeletingExamPaper] = useState<ExamPaper | null>(null);
  const [visibilityAlertPaper, setVisibilityAlertPaper] = useState<ExamPaper | null>(null);

  // Active Managing Exam Form States
  const [examTitle, setExamTitle] = useState("");
  const [examSubtitle, setExamSubtitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examTimeMinutes, setExamTimeMinutes] = useState(120);
  const [marksPerCorrect, setMarksPerCorrect] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [examStatus, setExamStatus] = useState<"active" | "paused">("active");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState("");

  // Modals & Questions State
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ServerQuestion | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [showBulkDeleteQuestionsModal, setShowBulkDeleteQuestionsModal] = useState(false);
  const [isBulkDeletingQuestions, setIsBulkDeletingQuestions] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Calculate global rank map
  const ranksMap = useMemo(() => {
    const map = new Map<string, number>();
    const grouped = new Map<string, ResultDocument[]>();
    results.forEach((r) => {
      const key = r.examId || r.examTitle || "default";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    });

    grouped.forEach((examResults) => {
      const sorted = [...examResults].sort((a, b) => {
        if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
        if ((a.wrongCount ?? 0) !== (b.wrongCount ?? 0)) return (a.wrongCount ?? 0) - (b.wrongCount ?? 0);
        if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken;
        return new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
      });

      sorted.forEach((res, idx) => {
        if (res.id) {
          map.set(res.id, idx + 1);
        }
      });
    });

    return map;
  }, [results]);

  // Open Exam Workspace for a specific Exam
  const handleOpenManageExam = useCallback((paper: ExamPaper | null) => {
    if (!paper) {
      setActiveManagingExam(null);
      return;
    }
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
    setSelectedQuestionIds([]);
  }, []);

  // Save Settings for active exam
  const handleSaveExamSettings = useCallback(async (updatedPaper: ExamPaper) => {
    setIsSavingSettings(true);
    updateExamPaper(updatedPaper);
    setActiveManagingExam(updatedPaper);
    setExamPapers((prev) => prev.map((p) => (p.id === updatedPaper.id ? updatedPaper : p)));

    await saveExamPaperInDB(updatedPaper);
    setIsSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }, []);

  // Create New Examination Paper
  const handleCreateExam = useCallback(async (title: string, subtitle: string, desc: string, mins: number) => {
    const id = "exam-" + Date.now();
    const newPaper: ExamPaper = {
      id,
      title: title.trim(),
      subtitle: subtitle.trim() || "Law Practice Examination",
      description: desc.trim() || "Assessment paper designed for Law entrance candidates.",
      totalTimeMinutes: mins,
      marksPerCorrect: 1,
      negativeMarks: 0.25,
      passingPercentage: 40,
      maxAttempts: 1,
      status: "active",
      questions: [],
    };

    addExamPaper(newPaper);
    setExamPapers((prev) => [...prev, newPaper]);
    setShowAddExamModal(false);

    await saveExamPaperInDB(newPaper);
    handleOpenManageExam(newPaper);
  }, [handleOpenManageExam]);

  // Delete an Exam Paper
  const handleDeleteExam = useCallback(async (paperId: string) => {
    deleteExamPaper(paperId);
    setExamPapers(getExamPapers());
    if (activeManagingExam?.id === paperId) {
      setActiveManagingExam(null);
    }
    setDeletingExamPaper(null);
    await deleteExamPaperInDB(paperId);
  }, [activeManagingExam]);

  // Toggle Visibility
  const handleConfirmToggleVisibility = useCallback(async (paper: ExamPaper) => {
    const updated = {
      ...paper,
      isPrivate: !paper.isPrivate,
    };
    updateExamPaper(updated);
    setExamPapers(getExamPapers());
    setVisibilityAlertPaper(null);
    await saveExamPaperInDB(updated);
  }, []);

  // Question Management inside Active Exam
  const handleCreateQuestion = useCallback((qText: string, opts: string[], correct: number, subject: string) => {
    if (!activeManagingExam) return;
    const newQ: ServerQuestion = {
      id: (activeManagingExam.questions || []).length + 1,
      question: qText,
      options: opts,
      correctAnswer: correct,
      subject: subject || undefined,
    };

    addQuestionToExam(activeManagingExam.id, newQ);
    const updated = getExamPaperById(activeManagingExam.id);
    if (updated) {
      setActiveManagingExam(updated);
      setExamPapers(getExamPapers());
      saveExamPaperInDB(updated);
    }
    setShowAddQuestionModal(false);
  }, [activeManagingExam]);

  const handleSaveQuestionEdit = useCallback(async (
    qId: number,
    qText: string,
    opts: string[],
    correct: number,
    subject: string,
    expl: string
  ) => {
    if (!activeManagingExam) return;
    const updatedQuestions = (activeManagingExam.questions || []).map((q) => {
      if (q.id === qId) {
        return {
          ...q,
          question: qText,
          options: opts,
          correctAnswer: correct,
          subject: subject || undefined,
          explanation: expl || undefined,
        };
      }
      return q;
    });

    const updatedPaper: ExamPaper = {
      ...activeManagingExam,
      questions: updatedQuestions,
    };

    updateExamPaper(updatedPaper);
    setActiveManagingExam(updatedPaper);
    setExamPapers(getExamPapers());
    await saveExamPaperInDB(updatedPaper);
    setEditingQuestion(null);
    setActionSuccessNotice(`Question #${qId} updated successfully.`);
    setTimeout(() => setActionSuccessNotice(""), 3000);
  }, [activeManagingExam]);

  const handleDeleteQuestion = useCallback(async (qId: number) => {
    if (!activeManagingExam) return;
    const remaining = (activeManagingExam.questions || []).filter((q) => q.id !== qId);
    const reindexed = remaining.map((q, idx) => ({ ...q, id: idx + 1 }));

    const updatedPaper: ExamPaper = {
      ...activeManagingExam,
      questions: reindexed,
    };

    updateExamPaper(updatedPaper);
    setActiveManagingExam(updatedPaper);
    setExamPapers(getExamPapers());
    setSelectedQuestionIds([]);
    await saveExamPaperInDB(updatedPaper);
    setActionSuccessNotice(`Question #${qId} deleted successfully.`);
    setTimeout(() => setActionSuccessNotice(""), 3000);
  }, [activeManagingExam]);

  const handleBulkDeleteQuestions = useCallback(async () => {
    if (!activeManagingExam || selectedQuestionIds.length === 0) return;
    setIsBulkDeletingQuestions(true);

    const remaining = (activeManagingExam.questions || []).filter(
      (q) => !selectedQuestionIds.includes(q.id)
    );
    const reindexed = remaining.map((q, idx) => ({ ...q, id: idx + 1 }));

    const updatedPaper: ExamPaper = {
      ...activeManagingExam,
      questions: reindexed,
    };

    updateExamPaper(updatedPaper);
    setActiveManagingExam(updatedPaper);
    setExamPapers(getExamPapers());
    await saveExamPaperInDB(updatedPaper);

    const count = selectedQuestionIds.length;
    setSelectedQuestionIds([]);
    setShowBulkDeleteQuestionsModal(false);
    setIsBulkDeletingQuestions(false);
    setActionSuccessNotice(`Deleted ${count} selected question(s).`);
    setTimeout(() => setActionSuccessNotice(""), 3000);
  }, [activeManagingExam, selectedQuestionIds]);

  const handleImportQuestions = useCallback(async (importedQuestions: ServerQuestion[], mode: "append" | "overwrite") => {
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
      setActionSuccessNotice(`Successfully imported ${importedQuestions.length} questions!`);
      setTimeout(() => setActionSuccessNotice(""), 4000);
    } catch (err) {
      console.error("Error saving imported questions to Firestore DB:", err);
    }
  }, [activeManagingExam]);

  // Data Fetching
  const fetchStudentUsers = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const users = await getAllStudentUsers();
      setStudentUsers(users);
    } catch (err) {
      console.error("Error fetching student users:", err);
    } fontally: {
      setLoadingStudents(false);
    }
  }, []);

  const fetchResults = useCallback(async () => {
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
  }, [fetchStudentUsers]);

  // Deletions
  const handleDeleteStudentUser = useCallback(async (user: StudentUserRecord) => {
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
  }, [fetchStudentUsers]);

  const handleDeleteCandidate = useCallback(async (target: ResultDocument) => {
    setIsDeleting(true);
    try {
      if (target.id) {
        await deleteExamResult(
          target.id,
          target.studentDocId,
          target.candidateEmail,
          target.candidateName,
          false
        );
        setResults((prev) => prev.filter((r) => r.id !== target.id));
        if (selectedResult?.id === target.id) {
          setSelectedResult(null);
        }
      }
      setDeletingCandidate(null);
    } catch (err) {
      alert("Failed to delete candidate record from database.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedResult]);

  const handleBulkDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedResults.map(async (resId) => {
          const resDoc = results.find((r) => r.id === resId);
          if (resId && resDoc) {
            await deleteExamResult(resId, resDoc.studentDocId, resDoc.candidateEmail, resDoc.candidateName, false);
          }
        })
      );
      setResults((prev) => prev.filter((r) => !selectedResults.includes(r.id || "")));
      if (selectedResult && selectedResults.includes(selectedResult.id || "")) {
        setSelectedResult(null);
      }
      setSelectedResults([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      alert("Failed to delete candidate records.");
      console.error(err);
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedResults, results, selectedResult]);

  // Auth Helpers
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
  }, [fetchResults]);

  useEffect(() => {
    if (isAuthenticated && adminNavTab === "students") {
      fetchStudentUsers();
    }
  }, [adminNavTab, isAuthenticated, fetchStudentUsers]);

  if (!isClient) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-navy-950">
        <div className="animate-pulse text-foreground/45">Loading Admin Portal...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-navy-950 p-4">
        <div className="relative z-10 w-full max-w-md space-y-6 animate-scale-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-2xl shadow-gold-500/25 mb-2">
              <svg className="w-8 h-8 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gradient-gold">Admin Portal Login</h2>
            <p className="text-sm text-foreground/50">Enter master password to access control dashboard</p>
          </div>

          <Card variant="highlight" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 text-sm"
                  autoFocus
                />
              </div>

              {loginError && <p className="text-xs text-danger flex items-center gap-1.5 font-medium">{loginError}</p>}

              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={checkingLogin || !password}>
                {checkingLogin ? <Spinner className="w-4 h-4 text-white" /> : "Login to Admin Portal"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-navy-950 text-foreground p-0 md:p-6 gap-0 md:gap-6">
      <AdminSidebar
        activeTab={adminNavTab}
        setActiveTab={(tab) => {
          setAdminNavTab(tab);
          setActiveManagingExam(null);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{EXAM_INFO.title} — Admin Portal</h1>
            <p className="text-xs text-foreground/40 mt-1">Examination Management & Control Dashboard</p>
          </div>
          {adminNavTab !== "exams" && (
            <Button variant="secondary" size="sm" onClick={fetchResults}>
              Refresh Data
            </Button>
          )}
        </div>

        {/* SECTION 1: Candidates Results */}
        {adminNavTab === "candidates" && (
          <AdminCandidateResults
            results={results}
            examPapers={examPapers}
            loading={loading}
            onSelectResult={setSelectedResult}
            onDeleteCandidate={setDeletingCandidate}
            selectedResults={selectedResults}
            onToggleSelectResult={(id) => setSelectedResults((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            onSelectAllResults={setSelectedResults}
            onOpenBulkDeleteModal={() => setShowBulkDeleteModal(true)}
          />
        )}

        {/* SECTION 2: Student Users */}
        {adminNavTab === "students" && (
          <AdminStudentUsers
            studentUsers={studentUsers}
            loadingStudents={loadingStudents}
            onDeleteStudentUser={setDeletingStudentUser}
          />
        )}

        {/* SECTION 3: Exams & Questions Manager */}
        {adminNavTab === "exams" && (
          <AdminExamManager
            examPapers={examPapers}
            loading={loading}
            activeManagingExam={activeManagingExam}
            setActiveManagingExam={handleOpenManageExam}
            onSaveExamSettings={handleSaveExamSettings}
            onDeleteExam={handleDeleteExam}
            onOpenAddExamModal={() => setShowAddExamModal(true)}
            onOpenVisibilityAlert={setVisibilityAlertPaper}
            onDeleteExamPaperConfirm={setDeletingExamPaper}
            examTitle={examTitle}
            setExamTitle={setExamTitle}
            examSubtitle={examSubtitle}
            setExamSubtitle={setExamSubtitle}
            examDescription={examDescription}
            setExamDescription={setExamDescription}
            examTimeMinutes={examTimeMinutes}
            setExamTimeMinutes={setExamTimeMinutes}
            marksPerCorrect={marksPerCorrect}
            setMarksPerCorrect={setMarksPerCorrect}
            negativeMarks={negativeMarks}
            setNegativeMarks={setNegativeMarks}
            passingPercentage={passingPercentage}
            setPassingPercentage={setPassingPercentage}
            maxAttempts={maxAttempts}
            setMaxAttempts={setMaxAttempts}
            examStatus={examStatus}
            setExamStatus={setExamStatus}
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            scheduledStartTime={scheduledStartTime}
            setScheduledStartTime={setScheduledStartTime}
            scheduledEndTime={scheduledEndTime}
            setScheduledEndTime={setScheduledEndTime}
            isSavingSettings={isSavingSettings}
            settingsSaved={settingsSaved}
            actionSuccessNotice={actionSuccessNotice}
            onOpenAddQuestionModal={() => setShowAddQuestionModal(true)}
            onOpenAiImportModal={() => setShowAiModal(true)}
            onOpenEditQuestionModal={setEditingQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            selectedQuestionIds={selectedQuestionIds}
            onToggleSelectQuestion={(id) => setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            onSelectAllQuestions={setSelectedQuestionIds}
            onOpenBulkDeleteQuestionsModal={() => setShowBulkDeleteQuestionsModal(true)}
          />
        )}

        {/* Global Modals Container */}
        <AdminModals
          selectedResult={selectedResult}
          onCloseResultModal={() => setSelectedResult(null)}
          ranksMap={ranksMap}
          examPapers={examPapers}
          deletingCandidate={deletingCandidate}
          onCloseDeleteCandidateModal={() => setDeletingCandidate(null)}
          onConfirmDeleteCandidate={handleDeleteCandidate}
          isDeletingCandidate={isDeleting}
          showBulkDeleteModal={showBulkDeleteModal}
          onCloseBulkDeleteModal={() => setShowBulkDeleteModal(false)}
          onConfirmBulkDeleteCandidates={handleBulkDelete}
          selectedResultsCount={selectedResults.length}
          isBulkDeletingCandidates={isBulkDeleting}
          deletingStudentUser={deletingStudentUser}
          onCloseDeleteStudentUserModal={() => setDeletingStudentUser(null)}
          onConfirmDeleteStudentUser={handleDeleteStudentUser}
          isDeletingStudentUser={isDeleting}
          deletingExamPaper={deletingExamPaper}
          onCloseDeleteExamPaperModal={() => setDeletingExamPaper(null)}
          onConfirmDeleteExamPaper={handleDeleteExam}
          visibilityAlertPaper={visibilityAlertPaper}
          onCloseVisibilityAlertModal={() => setVisibilityAlertPaper(null)}
          onConfirmToggleVisibility={handleConfirmToggleVisibility}
          showAddExamModal={showAddExamModal}
          onCloseAddExamModal={() => setShowAddExamModal(false)}
          onCreateExam={handleCreateExam}
          showAddQuestionModal={showAddQuestionModal}
          onCloseAddQuestionModal={() => setShowAddQuestionModal(false)}
          onCreateQuestion={handleCreateQuestion}
          editingQuestion={editingQuestion}
          onCloseEditQuestionModal={() => setEditingQuestion(null)}
          onSaveQuestionEdit={handleSaveQuestionEdit}
          showBulkDeleteQuestionsModal={showBulkDeleteQuestionsModal}
          onCloseBulkDeleteQuestionsModal={() => setShowBulkDeleteQuestionsModal(false)}
          onConfirmBulkDeleteQuestions={handleBulkDeleteQuestions}
          selectedQuestionIds={selectedQuestionIds}
          isBulkDeletingQuestions={isBulkDeletingQuestions}
          activeManagingExamTitle={activeManagingExam?.title}
          showAiModal={showAiModal}
          onCloseAiModal={() => setShowAiModal(false)}
          onImportQuestions={handleImportQuestions}
        />
      </main>
    </div>
  );
}

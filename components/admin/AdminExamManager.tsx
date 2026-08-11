"use client";

import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ExamScheduler from "@/components/ui/ExamScheduler";
import NumericInput from "@/components/ui/NumericInput";
import Pagination from "@/components/admin/Pagination";
import { ExamPaper, ServerQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdminExamManagerProps {
  examPapers: ExamPaper[];
  loading: boolean;
  activeManagingExam: ExamPaper | null;
  setActiveManagingExam: (paper: ExamPaper | null) => void;
  onSaveExamSettings: (updatedPaper: ExamPaper) => Promise<void>;
  onDeleteExam: (paperId: string) => void;
  onOpenAddExamModal: () => void;
  onOpenVisibilityAlert: (paper: ExamPaper) => void;
  onDeleteExamPaperConfirm: (paper: ExamPaper) => void;

  // Active Exam Controls & State
  examTitle: string;
  setExamTitle: (val: string) => void;
  examSubtitle: string;
  setExamSubtitle: (val: string) => void;
  examDescription: string;
  setExamDescription: (val: string) => void;
  examTimeMinutes: number;
  setExamTimeMinutes: (val: number) => void;
  marksPerCorrect: number;
  setMarksPerCorrect: (val: number) => void;
  negativeMarks: number;
  setNegativeMarks: (val: number) => void;
  passingPercentage: number;
  setPassingPercentage: (val: number) => void;
  maxAttempts: number;
  setMaxAttempts: (val: number) => void;
  examStatus: "active" | "paused";
  setExamStatus: (status: "active" | "paused") => void;
  scheduledDate: string;
  setScheduledDate: (val: string) => void;
  scheduledStartTime: string;
  setScheduledStartTime: (val: string) => void;
  scheduledEndTime: string;
  setScheduledEndTime: (val: string) => void;
  isSavingSettings: boolean;
  settingsSaved: boolean;
  actionSuccessNotice: string;

  // Question Management
  onOpenAddQuestionModal: () => void;
  onOpenAiImportModal: () => void;
  onOpenEditQuestionModal: (q: ServerQuestion) => void;
  onDeleteQuestion: (qId: number) => void;
  selectedQuestionIds: number[];
  onToggleSelectQuestion: (id: number) => void;
  onSelectAllQuestions: (ids: number[]) => void;
  onOpenBulkDeleteQuestionsModal: () => void;
}

export default function AdminExamManager({
  examPapers,
  loading,
  activeManagingExam,
  setActiveManagingExam,
  onSaveExamSettings,
  onDeleteExam,
  onOpenAddExamModal,
  onOpenVisibilityAlert,
  onDeleteExamPaperConfirm,
  examTitle,
  setExamTitle,
  examSubtitle,
  setExamSubtitle,
  examDescription,
  setExamDescription,
  examTimeMinutes,
  setExamTimeMinutes,
  marksPerCorrect,
  setMarksPerCorrect,
  negativeMarks,
  setNegativeMarks,
  passingPercentage,
  setPassingPercentage,
  maxAttempts,
  setMaxAttempts,
  examStatus,
  setExamStatus,
  scheduledDate,
  setScheduledDate,
  scheduledStartTime,
  setScheduledStartTime,
  scheduledEndTime,
  setScheduledEndTime,
  isSavingSettings,
  settingsSaved,
  actionSuccessNotice,
  onOpenAddQuestionModal,
  onOpenAiImportModal,
  onOpenEditQuestionModal,
  onDeleteQuestion,
  selectedQuestionIds,
  onToggleSelectQuestion,
  onSelectAllQuestions,
  onOpenBulkDeleteQuestionsModal,
}: AdminExamManagerProps) {
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [questionsCurrentPage, setQuestionsCurrentPage] = useState(1);
  const questionsPageSize = 10;

  // Calculate active window duration in minutes if a start and end time are set
  const windowDurationMinutes = useMemo(() => {
    if (!scheduledStartTime || !scheduledEndTime) return null;
    const [sh, sm] = scheduledStartTime.split(":").map(Number);
    const [eh, em] = scheduledEndTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    let sMins = sh * 60 + sm;
    let eMins = eh * 60 + em;
    if (eMins <= sMins) eMins += 1440;
    const diff = eMins - sMins;
    return diff > 0 ? diff : null;
  }, [scheduledStartTime, scheduledEndTime]);

  // Window limit enforcement
  useEffect(() => {
    if (windowDurationMinutes !== null && examTimeMinutes > windowDurationMinutes) {
      setExamTimeMinutes(windowDurationMinutes);
    }
  }, [windowDurationMinutes, examTimeMinutes, setExamTimeMinutes]);

  const handleSetExamTimeMinutes = (mins: number) => {
    const validMins = Math.max(1, mins);
    if (windowDurationMinutes !== null && validMins > windowDurationMinutes) {
      setExamTimeMinutes(windowDurationMinutes);
    } else {
      setExamTimeMinutes(validMins);
    }
  };

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

  const handleSaveClick = async () => {
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
    await onSaveExamSettings(updated);
  };

  // Filter Questions for active exam
  const paperQuestions = activeManagingExam ? activeManagingExam.questions || [] : [];
  const subjects = useMemo(() => {
    return ["All", ...Array.from(new Set(paperQuestions.map((q) => q.subject).filter(Boolean))) as string[]];
  }, [paperQuestions]);

  const filteredQuestions = useMemo(() => {
    return paperQuestions.filter((q) => {
      const matchesSubject = selectedSubject === "All" || q.subject === selectedSubject;
      const matchesSearch =
        q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.options.some((opt) => opt.toLowerCase().includes(questionSearch.toLowerCase()));
      return matchesSubject && matchesSearch;
    });
  }, [paperQuestions, selectedSubject, questionSearch]);

  const totalQuestionsPages = Math.ceil(filteredQuestions.length / questionsPageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (questionsCurrentPage - 1) * questionsPageSize;
    return filteredQuestions.slice(start, start + questionsPageSize);
  }, [filteredQuestions, questionsCurrentPage, questionsPageSize]);

  const handleSelectAllQuestionsOnPage = () => {
    const currentPageQIds = paginatedQuestions.map((q) => q.id);
    if (selectedQuestionIds.length === currentPageQIds.length) {
      onSelectAllQuestions([]);
    } else {
      onSelectAllQuestions(currentPageQIds);
    }
  };

  if (!activeManagingExam) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Examinations & Test Papers</h2>
            <p className="text-xs text-foreground/40 mt-1">Manage test papers, add new exams, and configure timers.</p>
          </div>
          <Button onClick={onOpenAddExamModal}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Examination
          </Button>
        </div>

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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${paper.isPrivate
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
                    <p className="text-base font-bold text-gold-400">{(paper.questions || []).length}</p>
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
                  <Button className="flex-1 min-w-[120px]" onClick={() => setActiveManagingExam(paper)}>
                    ⚙️ Control Exam
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={paper.isPrivate ? "text-success border-success/30 bg-success/10 hover:bg-success/20 font-bold" : "text-purple-300 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 font-bold"}
                    onClick={() => onOpenVisibilityAlert(paper)}
                  >
                    {paper.isPrivate ? "🌐 Make Public" : "🔒 Make Private"}
                  </Button>
                  <Button variant="secondary" size="sm" className="text-danger border-danger/20 hover:bg-danger/10" onClick={() => onDeleteExamPaperConfirm(paper)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Active Managing Exam Dedicated View
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Header */}
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
          onClick={() => setExamStatus(examStatus === "active" ? "paused" : "active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
            examStatus === "active"
              ? "bg-success/20 text-success border border-success/30"
              : "bg-warning/20 text-warning border border-warning/30"
          }`}
        >
          {examStatus === "active" ? "🟢 LIVE & ACTIVE" : "🟡 PAUSED FOR MAINTENANCE"}
        </button>
      </div>

      {actionSuccessNotice && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>✓ {actionSuccessNotice}</span>
        </div>
      )}

      {/* Examination Controls Card */}
      <div className="rounded-2xl border border-white/10 bg-navy-950/40 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-sm">⚙️</div>
            <div>
              <h3 className="text-sm font-bold text-white">Examination Controls</h3>
              <p className="text-[11px] text-foreground/40">Configure exam parameters, scoring scheme, and active window schedule</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Exam Title</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Subtitle / Category</label>
              <input
                type="text"
                value={examSubtitle}
                onChange={(e) => setExamSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Description</label>
              <input
                type="text"
                value={examDescription}
                onChange={(e) => setExamDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          {/* Timing & Scoring Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
              <NumericInput
                value={examTimeMinutes}
                onChange={handleSetExamTimeMinutes}
                min={1}
                step={1}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Marks / Correct</label>
              <NumericInput
                value={marksPerCorrect}
                onChange={setMarksPerCorrect}
                min={0}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Negative Deduction</label>
              <NumericInput
                value={negativeMarks}
                onChange={setNegativeMarks}
                min={0}
                step={0.05}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Pass Percentage (%)</label>
              <NumericInput
                value={passingPercentage}
                onChange={setPassingPercentage}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Max Attempts (0=∞)</label>
              <NumericInput
                value={maxAttempts}
                onChange={setMaxAttempts}
                min={0}
                max={10}
                step={1}
              />
            </div>
          </div>

          {/* Schedule Window Section */}
          <div className="pt-2 border-t border-white/8">
            <ExamScheduler
              date={scheduledDate}
              startTime={scheduledStartTime}
              endTime={scheduledEndTime}
              onDateChange={setScheduledDate}
              onStartTimeChange={setScheduledStartTime}
              onEndTimeChange={setScheduledEndTime}
            />
          </div>

          {/* Save Settings Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/8">
            {settingsSaved ? (
              <span className="text-xs font-bold text-success flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/30">
                ✓ Settings saved successfully!
              </span>
            ) : (
              <span className="text-xs font-semibold text-foreground/50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/8">
                {hasUnsavedChanges ? "⚠️ Unsaved changes pending" : "✓ All settings saved & up to date"}
              </span>
            )}

            <Button
              onClick={handleSaveClick}
              disabled={isSavingSettings}
              className={cn("px-8 transition-all flex items-center justify-center gap-2", hasUnsavedChanges && "!bg-gold-500 !text-navy-950 font-bold shadow-lg shadow-gold-500/25 ring-2 ring-gold-400")}
            >
              {isSavingSettings ? (
                <>
                  <Spinner size="sm" />
                  <span>Saving Settings...</span>
                </>
              ) : hasUnsavedChanges ? (
                "Save Changes (Unsaved)"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Question Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Questions Bank ({paperQuestions.length})</h3>
            <p className="text-xs text-foreground/40 mt-0.5">Add, search, edit, or import questions with AI for this exam paper.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenAiImportModal}>
              🤖 Extract with AI
            </Button>
            <Button size="sm" onClick={onOpenAddQuestionModal}>
              + Add Question
            </Button>
          </div>
        </div>

        {/* Question Search & Filters Bar */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search questions in this paper..."
                value={questionSearch}
                onChange={(e) => {
                  setQuestionSearch(e.target.value);
                  setQuestionsCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            {subjects.length > 1 && (
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setQuestionsCurrentPage(1);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm focus:outline-none cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>
        </Card>

        {/* Bulk Action Bar for Questions */}
        {selectedQuestionIds.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-danger/10 border border-danger/25 rounded-xl animate-scale-in">
            <span className="text-sm font-semibold text-red-300">
              ⚡ {selectedQuestionIds.length} question(s) selected
            </span>
            <Button variant="danger" size="sm" onClick={onOpenBulkDeleteQuestionsModal}>
              Delete Selected ({selectedQuestionIds.length})
            </Button>
          </div>
        )}

        {/* Paginated Questions List */}
        {filteredQuestions.length === 0 ? (
          <Card className="text-center py-12 text-foreground/45">No questions match your filter criteria.</Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 text-xs text-foreground/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paginatedQuestions.length > 0 && paginatedQuestions.every((q) => selectedQuestionIds.includes(q.id))}
                  onChange={handleSelectAllQuestionsOnPage}
                  className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer"
                />
                <span>Select All on Page ({paginatedQuestions.length})</span>
              </label>
              <span>Showing {paginatedQuestions.length} of {filteredQuestions.length} questions</span>
            </div>

            {paginatedQuestions.map((q) => (
              <Card key={q.id} className="p-5 space-y-4 border-navy-700/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(q.id)}
                      onChange={() => onToggleSelectQuestion(q.id)}
                      className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer mt-1"
                    />
                    <div>
                      <span className="px-2.5 py-0.5 rounded bg-gold-500/20 text-gold-400 font-bold text-xs border border-gold-500/30">
                        Q#{q.id}
                      </span>
                      {q.subject && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-navy-800 text-foreground/50 text-xs">
                          {q.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEditQuestionModal(q)}
                      className="p-1.5 rounded-lg hover:bg-navy-700 text-foreground/50 hover:text-gold-400 transition"
                      title="Edit Question"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/20 text-foreground/50 hover:text-danger transition"
                      title="Delete Question"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed pl-7">{q.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={cn(
                        "p-3 rounded-lg border text-xs flex items-center gap-2.5",
                        optIdx === q.correctAnswer
                          ? "bg-success/15 border-success/40 text-success font-semibold"
                          : "bg-navy-900/60 border-navy-800 text-foreground/60"
                      )}
                    >
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]",
                        optIdx === q.correctAnswer ? "bg-success text-navy-950" : "bg-navy-800 text-foreground/40"
                      )}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {optIdx === q.correctAnswer && (
                        <span className="text-[10px] bg-success/20 text-success font-bold px-1.5 py-0.5 rounded">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <Pagination
              currentPage={questionsCurrentPage}
              totalPages={totalQuestionsPages}
              onPageChange={setQuestionsCurrentPage}
              totalItems={filteredQuestions.length}
              pageSize={questionsPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}

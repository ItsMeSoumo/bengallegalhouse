"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import AiQuestionExtractorModal from "@/components/ui/AiQuestionExtractorModal";
import { ResultDocument, ExamPaper, ServerQuestion } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { downloadExamScorecardPDF } from "@/lib/generatePdfReport";
import { serverQuestions as defaultQuestions } from "@/lib/serverQuestions";
import { StudentUserRecord } from "@/lib/firebase";

interface AdminModalsProps {
  // Candidate Inspection
  selectedResult: ResultDocument | null;
  onCloseResultModal: () => void;
  ranksMap: Map<string, number>;
  examPapers: ExamPaper[];

  // Delete Candidate
  deletingCandidate: ResultDocument | null;
  onCloseDeleteCandidateModal: () => void;
  onConfirmDeleteCandidate: (doc: ResultDocument) => Promise<void>;
  isDeletingCandidate: boolean;

  // Bulk Delete Candidates
  showBulkDeleteModal: boolean;
  onCloseBulkDeleteModal: () => void;
  onConfirmBulkDeleteCandidates: () => Promise<void>;
  selectedResultsCount: number;
  isBulkDeletingCandidates: boolean;

  // Delete Student User Account
  deletingStudentUser: StudentUserRecord | null;
  onCloseDeleteStudentUserModal: () => void;
  onConfirmDeleteStudentUser: (user: StudentUserRecord) => Promise<void>;
  isDeletingStudentUser: boolean;

  // Delete Exam Paper
  deletingExamPaper: ExamPaper | null;
  onCloseDeleteExamPaperModal: () => void;
  onConfirmDeleteExamPaper: (paperId: string) => Promise<void>;

  // Visibility Alert
  visibilityAlertPaper: ExamPaper | null;
  onCloseVisibilityAlertModal: () => void;
  onConfirmToggleVisibility: (paper: ExamPaper) => Promise<void>;

  // Add Exam Paper Modal
  showAddExamModal: boolean;
  onCloseAddExamModal: () => void;
  onCreateExam: (title: string, subtitle: string, desc: string, mins: number) => Promise<void>;

  // Question Modals inside active exam
  showAddQuestionModal: boolean;
  onCloseAddQuestionModal: () => void;
  onCreateQuestion: (qText: string, opts: string[], correct: number, subject: string) => void;

  editingQuestion: ServerQuestion | null;
  onCloseEditQuestionModal: () => void;
  onSaveQuestionEdit: (qId: number, qText: string, opts: string[], correct: number, subject: string, expl: string) => Promise<void>;

  showBulkDeleteQuestionsModal: boolean;
  onCloseBulkDeleteQuestionsModal: () => void;
  onConfirmBulkDeleteQuestions: () => Promise<void>;
  selectedQuestionIds: number[];
  isBulkDeletingQuestions: boolean;
  activeManagingExamTitle?: string;

  // AI Import Modal
  showAiModal: boolean;
  onCloseAiModal: () => void;
  onImportQuestions: (qs: ServerQuestion[], mode: "append" | "overwrite") => Promise<void>;
}

export default function AdminModals({
  selectedResult,
  onCloseResultModal,
  ranksMap,
  examPapers,
  deletingCandidate,
  onCloseDeleteCandidateModal,
  onConfirmDeleteCandidate,
  isDeletingCandidate,
  showBulkDeleteModal,
  onCloseBulkDeleteModal,
  onConfirmBulkDeleteCandidates,
  selectedResultsCount,
  isBulkDeletingCandidates,
  deletingStudentUser,
  onCloseDeleteStudentUserModal,
  onConfirmDeleteStudentUser,
  isDeletingStudentUser,
  deletingExamPaper,
  onCloseDeleteExamPaperModal,
  onConfirmDeleteExamPaper,
  visibilityAlertPaper,
  onCloseVisibilityAlertModal,
  onConfirmToggleVisibility,
  showAddExamModal,
  onCloseAddExamModal,
  onCreateExam,
  showAddQuestionModal,
  onCloseAddQuestionModal,
  onCreateQuestion,
  editingQuestion,
  onCloseEditQuestionModal,
  onSaveQuestionEdit,
  showBulkDeleteQuestionsModal,
  onCloseBulkDeleteQuestionsModal,
  onConfirmBulkDeleteQuestions,
  selectedQuestionIds,
  isBulkDeletingQuestions,
  activeManagingExamTitle,
  showAiModal,
  onCloseAiModal,
  onImportQuestions,
}: AdminModalsProps) {
  // Modal Local Forms State
  const [resultTab, setResultTab] = useState<"summary" | "review">("summary");

  // Create Exam Form
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubtitle, setNewExamSubtitle] = useState("");
  const [newExamDescription, setNewExamDescription] = useState("");
  const [newExamTimeMinutes, setNewExamTimeMinutes] = useState(60);

  // Add Question Form
  const [newQText, setNewQText] = useState("");
  const [newOpt0, setNewOpt0] = useState("");
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");
  const [newOpt3, setNewOpt3] = useState("");
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQSubject, setNewQSubject] = useState("");

  // Edit Question Form
  const [editQText, setEditQText] = useState(editingQuestion?.question || "");
  const [editOpt0, setEditOpt0] = useState(editingQuestion?.options[0] || "");
  const [editOpt1, setEditOpt1] = useState(editingQuestion?.options[1] || "");
  const [editOpt2, setEditOpt2] = useState(editingQuestion?.options[2] || "");
  const [editOpt3, setEditOpt3] = useState(editingQuestion?.options[3] || "");
  const [editCorrect, setEditCorrect] = useState(editingQuestion?.correctAnswer || 0);
  const [editSubject, setEditSubject] = useState(editingQuestion?.subject || "");
  const [editExplanation, setEditExplanation] = useState(editingQuestion?.explanation || "");

  // Update edit form state when editingQuestion changes
  React.useEffect(() => {
    if (editingQuestion) {
      setEditQText(editingQuestion.question || "");
      setEditOpt0(editingQuestion.options[0] || "");
      setEditOpt1(editingQuestion.options[1] || "");
      setEditOpt2(editingQuestion.options[2] || "");
      setEditOpt3(editingQuestion.options[3] || "");
      setEditCorrect(editingQuestion.correctAnswer || 0);
      setEditSubject(editingQuestion.subject || "");
      setEditExplanation(editingQuestion.explanation || "");
    }
  }, [editingQuestion]);

  const handleFormCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;
    await onCreateExam(newExamTitle, newExamSubtitle, newExamDescription, newExamTimeMinutes);
    setNewExamTitle("");
    setNewExamSubtitle("");
    setNewExamDescription("");
    setNewExamTimeMinutes(60);
  };

  const handleFormCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newOpt0.trim() || !newOpt1.trim()) return;
    onCreateQuestion(
      newQText.trim(),
      [newOpt0.trim(), newOpt1.trim(), newOpt2.trim() || "N/A", newOpt3.trim() || "N/A"],
      newQCorrect,
      newQSubject.trim()
    );
    setNewQText("");
    setNewOpt0("");
    setNewOpt1("");
    setNewOpt2("");
    setNewOpt3("");
    setNewQSubject("");
  };

  const handleFormSaveQuestionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    await onSaveQuestionEdit(
      editingQuestion.id,
      editQText.trim(),
      [editOpt0.trim(), editOpt1.trim(), editOpt2.trim() || "N/A", editOpt3.trim() || "N/A"],
      editCorrect,
      editSubject.trim(),
      editExplanation.trim()
    );
  };

  return (
    <>
      {/* 1. Candidate Detail Inspection Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseResultModal} />
          <div className="relative glass-card p-6 md:p-8 max-w-5xl w-full animate-scale-in max-h-[90vh] flex flex-col overflow-hidden text-left border-gold-500/30">
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
              <button onClick={onCloseResultModal} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer text-foreground/50 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 border-b border-navy-600/20 pb-2">
              <button
                onClick={() => setResultTab("summary")}
                className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "summary" ? "bg-gold-500 text-navy-950 font-bold" : "text-foreground/60 hover:text-white hover:bg-navy-800")}
              >
                Summary
              </button>
              <button
                onClick={() => setResultTab("review")}
                className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer", resultTab === "review" ? "bg-gold-500 text-navy-950 font-bold" : "text-foreground/60 hover:text-white hover:bg-navy-800")}
              >
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
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Exam Merit Rank</p>
                      <p className="text-sm font-bold text-gold-400">
                        {selectedResult.id && ranksMap.has(selectedResult.id) ? `Rank #${ranksMap.get(selectedResult.id)}` : "N/A"}
                      </p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Total Score</p>
                      <p className="text-sm font-semibold text-white">{selectedResult.totalMarks} / {selectedResult.maxMarks}</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Percentage</p>
                      <p className="text-sm font-semibold text-white">{selectedResult.percentage}%</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Correct Answers</p>
                      <p className="text-sm font-semibold text-success">{selectedResult.correctCount}</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Wrong Answers</p>
                      <p className="text-sm font-semibold text-danger">{selectedResult.wrongCount}</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Unanswered</p>
                      <p className="text-sm font-semibold text-white">{selectedResult.unansweredCount}</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Time Taken</p>
                      <p className="text-sm font-semibold text-white">{formatTime(selectedResult.timeTaken)}</p>
                    </div>
                    <div className="glass-card-light p-3 rounded-xl">
                      <p className="text-xs text-foreground/40 mb-0.5">Submitted</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(selectedResult.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
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
                        <div key={question.id || idx} className="glass-card-light p-4 md:p-5 rounded-xl space-y-3 border border-navy-700/50">
                          <div className="flex items-center justify-between border-b border-navy-600/30 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-navy-800 text-gold-400 font-bold text-xs">
                                Q{idx + 1}
                              </span>
                              {question.subject && <span className="text-xs text-foreground/40 font-medium">{question.subject}</span>}
                            </div>

                            <span className={cn("px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider", isUnanswered ? "bg-navy-800 text-foreground/40 border border-navy-700" : isCorrect ? "bg-success/15 text-success border border-success/30" : "bg-danger/15 text-danger border border-danger/30")}>
                              {isUnanswered ? "Unanswered (0)" : isCorrect ? "Correct (+1)" : "Wrong (-0.25)"}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-white leading-relaxed">{question.question}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {question.options.map((optText, optIdx) => {
                              const isOptionCorrect = !isUnanswered && optIdx === question.correctAnswer;
                              const isSelectedByUser = selectedOpt === optIdx;

                              let optClass = "bg-navy-900/60 border-navy-800 text-foreground/60";
                              let badge = null;

                              if (isOptionCorrect) {
                                optClass = "bg-success/10 border-success/40 text-success font-medium";
                                badge = <span className="text-[10px] bg-success/20 text-success font-bold px-1.5 py-0.5 rounded ml-auto">✓ Correct Key</span>;
                              }

                              if (!isUnanswered) {
                                if (isSelectedByUser && !isOptionCorrect) {
                                  optClass = "bg-danger/15 border-danger/50 text-white font-medium shadow-sm shadow-danger/10";
                                  badge = <span className="text-[10px] bg-danger/20 text-danger font-bold px-1.5 py-0.5 rounded ml-auto">✗ Selected</span>;
                                }
                                if (isSelectedByUser && isOptionCorrect) {
                                  badge = <span className="text-[10px] bg-success/30 text-success font-bold px-1.5 py-0.5 rounded ml-auto">✓ Selected & Correct</span>;
                                }
                              }

                              return (
                                <div key={optIdx} className={cn("p-3 rounded-lg border text-xs flex items-center gap-2.5 transition-all", optClass)}>
                                  <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]", !isUnanswered && isOptionCorrect ? "bg-success text-navy-950" : !isUnanswered && isSelectedByUser ? "bg-danger text-white" : "bg-navy-800 text-foreground/40")}>
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

      {/* 2. Delete Candidate Confirmation Modal */}
      {deletingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseDeleteCandidateModal} />
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
              <Button variant="secondary" className="flex-1" onClick={onCloseDeleteCandidateModal}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1 flex items-center justify-center gap-2" disabled={isDeletingCandidate} onClick={() => onConfirmDeleteCandidate(deletingCandidate)}>
                {isDeletingCandidate ? (
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

      {/* 3. Bulk Delete Candidates Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseBulkDeleteModal} />
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
            <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Delete Selected Attempts?</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Are you sure you want to permanently delete the <span className="font-bold text-white">{selectedResultsCount}</span> selected candidate examination attempt and score records?
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onCloseBulkDeleteModal}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1 flex items-center justify-center gap-2" disabled={isBulkDeletingCandidates} onClick={onConfirmBulkDeleteCandidates}>
                {isBulkDeletingCandidates ? (
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

      {/* 4. Delete Student User Account Modal */}
      {deletingStudentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseDeleteStudentUserModal} />
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
            <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Delete {deletingStudentUser.name}?</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Are you sure you want to delete the student account for <span className="font-bold text-white">&quot;{deletingStudentUser.name}&quot;</span> ({deletingStudentUser.email})?
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onCloseDeleteStudentUserModal}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1 flex items-center justify-center gap-2" disabled={isDeletingStudentUser} onClick={() => onConfirmDeleteStudentUser(deletingStudentUser)}>
                {isDeletingStudentUser ? (
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

      {/* 5. Delete Exam Paper Modal */}
      {deletingExamPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseDeleteExamPaperModal} />
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30">
            <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Delete {deletingExamPaper.title}?</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">&quot;{deletingExamPaper.title}&quot;</span>? All associated questions will be permanently removed.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onCloseDeleteExamPaperModal}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => onConfirmDeleteExamPaper(deletingExamPaper.id)}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Visibility Alert Modal */}
      {visibilityAlertPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in space-y-5 border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0", visibilityAlertPaper.isPrivate ? "bg-success/20 text-success border border-success/30" : "bg-purple-500/20 text-purple-300 border border-purple-500/30")}>
                {visibilityAlertPaper.isPrivate ? "🌐" : "🔒"}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {visibilityAlertPaper.isPrivate ? "Make Examination Public?" : "Make Examination Private (Hide)?"}
                </h3>
                <p className="text-xs text-foreground/50 line-clamp-1">{visibilityAlertPaper.title}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/10 text-xs text-foreground/70 leading-relaxed">
              {visibilityAlertPaper.isPrivate ? (
                <p><strong className="text-success">Public Mode:</strong> Students will immediately see and attempt this exam on their dashboard.</p>
              ) : (
                <p><strong className="text-purple-300">Private Mode:</strong> Exam will be hidden from student dashboards.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onCloseVisibilityAlertModal}>
                Cancel
              </Button>
              <Button className={cn("flex-1 font-bold", visibilityAlertPaper.isPrivate ? "!bg-success !text-navy-950" : "!bg-purple-500 !text-white")} onClick={() => onConfirmToggleVisibility(visibilityAlertPaper)}>
                {visibilityAlertPaper.isPrivate ? "Yes, Make Public" : "Yes, Make Private"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseAddExamModal} />
          <div className="relative glass-card p-6 md:p-8 max-w-lg w-full animate-scale-in space-y-6">
            <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Examination</h3>
              <button onClick={onCloseAddExamModal} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer text-foreground/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="e.g. CULET-2026 Mock Test 3"
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Category / Subtitle</label>
                <input
                  type="text"
                  value={newExamSubtitle}
                  onChange={(e) => setNewExamSubtitle(e.target.value)}
                  placeholder="e.g. Law Entrance Practice Test"
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Description</label>
                <textarea
                  value={newExamDescription}
                  onChange={(e) => setNewExamDescription(e.target.value)}
                  placeholder="Enter exam description..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExamTimeMinutes}
                  onChange={(e) => setNewExamTimeMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCloseAddExamModal}>
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

      {/* 8. Add Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseAddQuestionModal} />
          <div className="relative glass-card p-6 md:p-8 max-w-xl w-full animate-scale-in space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Question</h3>
              <button onClick={onCloseAddQuestionModal} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer text-foreground/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Subject / Topic (Optional)</label>
                <input
                  type="text"
                  value={newQSubject}
                  onChange={(e) => setNewQSubject(e.target.value)}
                  placeholder="e.g. Legal Reasoning"
                  className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Question Statement</label>
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
                <Button type="button" variant="secondary" className="flex-1" onClick={onCloseAddQuestionModal}>
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

      {/* 9. Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCloseEditQuestionModal} />
          <div className="relative glass-card p-6 md:p-8 max-w-xl w-full animate-scale-in space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-600/30 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Question #{editingQuestion.id}</h3>
              <button onClick={onCloseEditQuestionModal} className="p-1 rounded hover:bg-navy-700 transition cursor-pointer text-foreground/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSaveQuestionEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Subject (Optional)</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Optional, e.g. Legal Reasoning"
                  className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Question Statement</label>
                <textarea
                  required
                  value={editQText}
                  onChange={(e) => setEditQText(e.target.value)}
                  placeholder="Enter question statement..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground/60 uppercase">Option Choices</label>
                <input type="text" required placeholder="Option A" value={editOpt0} onChange={(e) => setEditOpt0(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                <input type="text" required placeholder="Option B" value={editOpt1} onChange={(e) => setEditOpt1(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                <input type="text" placeholder="Option C" value={editOpt2} onChange={(e) => setEditOpt2(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
                <input type="text" placeholder="Option D" value={editOpt3} onChange={(e) => setEditOpt3(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Select Correct Answer</label>
                <select
                  value={editCorrect}
                  onChange={(e) => setEditCorrect(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 font-bold text-sm focus:outline-none cursor-pointer"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="Brief explanation for candidates..."
                  className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCloseEditQuestionModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Bulk Delete Questions Modal */}
      {showBulkDeleteQuestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-navy-950/85 backdrop-blur-md" onClick={onCloseBulkDeleteQuestionsModal} />
          <div className="relative glass-card p-6 max-w-md w-full animate-scale-in text-center space-y-4 border-danger/30 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-danger/15 text-danger border border-danger/30 flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete {selectedQuestionIds.length} Selected Question(s)?</h3>
              <p className="text-xs text-foreground/70 leading-relaxed mt-1">
                Are you sure you want to permanently remove <span className="font-bold text-danger">{selectedQuestionIds.length} question(s)</span> from <span className="font-bold text-white">&quot;{activeManagingExamTitle}&quot;</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onCloseBulkDeleteQuestionsModal}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1 flex items-center justify-center gap-2 font-bold"
                disabled={isBulkDeletingQuestions}
                onClick={onConfirmBulkDeleteQuestions}
              >
                {isBulkDeletingQuestions ? (
                  <>
                    <Spinner size="sm" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  `Confirm Delete (${selectedQuestionIds.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 11. AI Question Extractor Modal */}
      {showAiModal && activeManagingExamTitle && (
        <AiQuestionExtractorModal
          examTitle={activeManagingExamTitle}
          onClose={onCloseAiModal}
          onImport={onImportQuestions}
        />
      )}
    </>
  );
}

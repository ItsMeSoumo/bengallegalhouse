"use client";

import React, { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { ServerQuestion } from "@/lib/types";

interface AiQuestionExtractorModalProps {
  examTitle: string;
  onClose: () => void;
  onImport: (questions: ServerQuestion[], mode: "append" | "overwrite") => void;
}

export default function AiQuestionExtractorModal({
  examTitle,
  onClose,
  onImport,
}: AiQuestionExtractorModalProps) {
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extractedQuestions, setExtractedQuestions] = useState<ServerQuestion[]>([]);
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [previewImageSrc, setPreviewImageSrc] = useState<string>("");

  // Edit Question State
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editOpt0, setEditOpt0] = useState("");
  const [editOpt1, setEditOpt1] = useState("");
  const [editOpt2, setEditOpt2] = useState("");
  const [editOpt3, setEditOpt3] = useState("");
  const [editCorrect, setEditCorrect] = useState(0);
  const [editSubject, setEditSubject] = useState("");
  const [editExplanation, setEditExplanation] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.name.endsWith(".pdf")) {
      setErrorMessage("Please upload an image file (PNG, JPG, WEBP) or document scan.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage("");
    setPreviewImageSrc("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        setPreviewImageSrc(base64Url);

        const base64Data = base64Url.split(",")[1];

        const res = await fetch("/api/admin/ai-extract-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "image",
            mimeType: file.type || "image/png",
            base64Data,
          }),
        });

        const data = await res.json();
        setIsExtracting(false);

        if (data.success && Array.isArray(data.questions)) {
          setExtractedQuestions(data.questions);
        } else {
          setErrorMessage(data.error || "Failed to extract questions with Gemini Vision AI.");
        }
      };

      reader.onerror = () => {
        setIsExtracting(false);
        setErrorMessage("Failed to read image file.");
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsExtracting(false);
      setErrorMessage(err?.message || "An error occurred during AI extraction.");
    }
  };

  const processTextExtraction = async () => {
    if (!rawText.trim()) {
      setErrorMessage("Please paste or type raw question text first.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/ai-extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          rawText,
        }),
      });

      const data = await res.json();
      setIsExtracting(false);

      if (data.success && Array.isArray(data.questions)) {
        setExtractedQuestions(data.questions);
      } else {
        setErrorMessage(data.error || "Failed to extract questions from text with Gemini AI.");
      }
    } catch (err: any) {
      setIsExtracting(false);
      setErrorMessage(err?.message || "An error occurred during AI extraction.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (extractedQuestions.length === 0) return;
    onImport(extractedQuestions, importMode);
    onClose();
  };

  const handleStartEdit = (q: ServerQuestion, idx: number) => {
    setEditingIdx(idx);
    setEditQText(q.question);
    setEditOpt0(q.options[0] || "");
    setEditOpt1(q.options[1] || "");
    setEditOpt2(q.options[2] || "");
    setEditOpt3(q.options[3] || "");
    setEditCorrect(q.correctAnswer);
    setEditSubject(q.subject || "");
    setEditExplanation(q.explanation || "");
  };

  const handleSaveEdit = (idx: number) => {
    const updated = [...extractedQuestions];
    updated[idx] = {
      ...updated[idx],
      question: editQText.trim(),
      options: [editOpt0.trim(), editOpt1.trim(), editOpt2.trim() || "N/A", editOpt3.trim() || "N/A"],
      correctAnswer: editCorrect,
      subject: editSubject.trim() || undefined,
      explanation: editExplanation.trim() || undefined,
    };
    setExtractedQuestions(updated);
    setEditingIdx(null);
  };

  const handleDeleteRow = (idx: number) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx));
    setEditingIdx((current) => {
      if (current === null || current === idx) return null;
      return current > idx ? current - 1 : current;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="modal-overlay absolute inset-0 bg-navy-950/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative glass-card p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in border border-gold-500/30 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-navy-600/40 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ✨ Gemini 2.5 Flash Vision AI
              </span>
              <h2 className="text-xl font-bold text-white">AI Question Extractor</h2>
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              Target Exam: <span className="text-white font-semibold">{examTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground/40 hover:text-white hover:bg-navy-800 transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 pt-4 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("image");
              setErrorMessage("");
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${activeTab === "image"
                ? "border-gold-400 text-gold-400"
                : "border-transparent text-foreground/40 hover:text-white"
              }`}
          >
            <span>🖼️ Image / Document Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("text");
              setErrorMessage("");
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${activeTab === "text"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-foreground/40 hover:text-white"
              }`}
          >
            <span>📝 Paste Raw Text</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
          {/* Tab 1: Image / Scan Upload */}
          {activeTab === "image" && !extractedQuestions.length && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, .pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processImageFile(e.target.files[0]);
                  }
                }}
              />

              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-2xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${isDragging
                    ? "border-purple-400 bg-purple-500/10 scale-[1.01]"
                    : "border-white/15 bg-navy-950/60 hover:border-purple-500/40 hover:bg-navy-900/40"
                  }`}
              >
                {isExtracting ? (
                  <div className="py-6 space-y-3">
                    <Spinner size="lg" label="🤖 Gemini Vision is scanning booklet pages & extracting question cards..." />
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/10">
                      📸
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        Drag &amp; Drop Question Booklet Screenshot or Scan Page
                      </p>
                      <p className="text-xs text-foreground/40 mt-1">
                        Supports <span className="text-purple-300 font-semibold">PNG</span>,{" "}
                        <span className="text-gold-400 font-semibold">JPG</span>, and{" "}
                        <span className="text-emerald-400 font-semibold">WEBP</span> document scans
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" type="button" className="mt-2">
                      Browse Screenshot from Device
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raw Text Paste */}
          {activeTab === "text" && !extractedQuestions.length && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/50">
                  Paste Raw Questions Text (from Word, PDF, or Websites):
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste question text here... e.g.&#10;Q1. What is Article 21A?&#10;A) Right to Equality&#10;B) Right to Education&#10;C) DPSP&#10;D) Fundamental Duty&#10;Answer: B"
                  className="w-full p-4 rounded-2xl bg-navy-950 border border-white/10 text-white text-xs placeholder:text-foreground/25 focus:outline-none focus:border-purple-500 transition resize-none font-mono"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={isExtracting || !rawText.trim()}
                  onClick={processTextExtraction}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {isExtracting ? (
                    <Spinner size="sm" label="Extracting with Gemini..." />
                  ) : (
                    "🤖 Extract Questions with Gemini AI"
                  )}
                </Button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Extracted Questions Preview Table */}
          {extractedQuestions.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Image Preview & Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
                <div className="flex items-center gap-3">
                  {previewImageSrc ? (
                    <img
                      src={previewImageSrc}
                      alt="Uploaded Scan Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-purple-500/30"
                    />
                  ) : (
                    <span className="text-2xl">✨</span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">Gemini AI Extraction Complete</p>
                    <p className="text-xs text-foreground/40">
                      Successfully parsed {extractedQuestions.length} multiple-choice questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    🤖 {extractedQuestions.length} Questions Extracted
                  </span>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="p-3.5 rounded-xl bg-navy-900/40 border border-white/8 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
                  Import Action Mode:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${importMode === "append"
                        ? "bg-gold-500 text-navy-950 border-gold-400 font-bold shadow-md shadow-gold-500/20"
                        : "bg-navy-950 text-foreground/50 border-white/10 hover:text-white"
                      }`}
                  >
                    ➕ Append to Question Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("overwrite")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${importMode === "overwrite"
                        ? "bg-danger text-white border-danger shadow-md shadow-danger/20"
                        : "bg-navy-950 text-foreground/50 border-white/10 hover:text-white"
                      }`}
                  >
                    🔄 Replace Question Bank
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-navy-700/80 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-navy-900 border-b border-navy-700 text-foreground/45 uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">Extracted Question</th>
                        <th className="p-3">Options &amp; Key</th>
                        <th className="p-3 w-28">Subject</th>
                        <th className="p-3 w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/40 bg-navy-950/40">
                      {extractedQuestions.map((q, idx) => {
                        const isEditingThis = editingIdx === idx;

                        if (isEditingThis) {
                          return (
                            <tr key={idx} className="bg-purple-500/10">
                              <td className="p-3 text-center font-mono text-gold-400 font-bold">
                                Q{idx + 1}
                              </td>
                              <td colSpan={4} className="p-4 space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-foreground/50 uppercase">Question Text</label>
                                  <textarea
                                    rows={2}
                                    value={editQText}
                                    onChange={(e) => setEditQText(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-navy-900 border border-purple-500/40 text-white text-xs focus:outline-none"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Option A</label>
                                    <input
                                      type="text"
                                      value={editOpt0}
                                      onChange={(e) => setEditOpt0(e.target.value)}
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Option B</label>
                                    <input
                                      type="text"
                                      value={editOpt1}
                                      onChange={(e) => setEditOpt1(e.target.value)}
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Option C</label>
                                    <input
                                      type="text"
                                      value={editOpt2}
                                      onChange={(e) => setEditOpt2(e.target.value)}
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Option D</label>
                                    <input
                                      type="text"
                                      value={editOpt3}
                                      onChange={(e) => setEditOpt3(e.target.value)}
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Correct Answer Key</label>
                                    <select
                                      value={editCorrect}
                                      onChange={(e) => setEditCorrect(Number(e.target.value))}
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-gold-500/40 text-gold-400 font-bold text-sm focus:outline-none cursor-pointer"
                                    >
                                      <option value={0}>Option A</option>
                                      <option value={1}>Option B</option>
                                      <option value={2}>Option C</option>
                                      <option value={3}>Option D</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-foreground/40 uppercase">Subject (Optional)</label>
                                    <input
                                      type="text"
                                      value={editSubject}
                                      onChange={(e) => setEditSubject(e.target.value)}
                                      placeholder="e.g. Legal Reasoning"
                                      className="w-full p-2 rounded-lg bg-navy-900 border border-white/10 text-white text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => setEditingIdx(null)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-foreground/40 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(idx)}
                                    className="px-4 py-1 rounded-lg text-xs font-bold bg-success text-navy-950"
                                  >
                                    ✓ Save Edit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={idx} className="hover:bg-navy-900/40">
                            <td className="p-3 text-center font-mono text-foreground/40 font-bold">
                              Q{idx + 1}
                            </td>
                            <td className="p-3 font-semibold text-white max-w-xs leading-relaxed">
                              {q.question}
                            </td>
                            <td className="p-3 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = q.correctAnswer === oIdx;
                                  return (
                                    <span
                                      key={oIdx}
                                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${isCorrect
                                          ? "bg-success/20 text-success border-success/40 font-bold"
                                          : "bg-navy-900 text-foreground/50 border-white/5"
                                        }`}
                                    >
                                      {["A", "B", "C", "D"][oIdx]}: {opt}
                                    </span>
                                  );
                                })}
                              </div>
                              {q.explanation && (
                                <p className="text-[10px] text-foreground/40 italic">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-foreground/60">
                              {q.subject ? (
                                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                  {q.subject}
                                </span>
                              ) : (
                                <span className="text-[10px] text-foreground/30 italic">None</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(q, idx)}
                                  className="p-1 rounded-lg text-gold-400 hover:bg-gold-500/10 transition cursor-pointer text-xs"
                                  title="Edit Question"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx)}
                                  className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition cursor-pointer text-xs"
                                  title="Delete Question"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-navy-600/40 pt-4 shrink-0">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>

          {extractedQuestions.length > 0 && (
            <Button
              size="md"
              type="button"
              onClick={handleConfirmImport}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 shadow-lg shadow-purple-500/20"
            >
              🤖 Confirm &amp; Import {extractedQuestions.length} Questions (
              {importMode === "append" ? "Append" : "Replace"})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

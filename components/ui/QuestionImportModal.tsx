"use client";

import React, { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { ServerQuestion } from "@/lib/types";
import {
  parseUploadedQuestionFile,
  ParseFileResult,
  downloadSampleCSV,
  downloadSampleXLSX,
} from "@/lib/excelQuestionParser";

interface QuestionImportModalProps {
  examTitle: string;
  onClose: () => void;
  onImport: (questions: ServerQuestion[], mode: "append" | "overwrite") => void;
}

export default function QuestionImportModal({
  examTitle,
  onClose,
  onImport,
}: QuestionImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseFileResult | null>(null);
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [parseError, setParseError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setParseError("");

    try {
      const result = await parseUploadedQuestionFile(file);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err?.message || "Failed to parse spreadsheet file.");
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validQuestions.length === 0) return;
    onImport(parseResult.validQuestions, importMode);
    onClose();
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gold-500/20 text-gold-400 border border-gold-500/30">
                Bulk Importer
              </span>
              <h2 className="text-xl font-bold text-white">Import Questions via CSV / Excel</h2>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* Template Download Bar */}
          <div className="p-4 rounded-2xl bg-navy-900/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Download Standardized Template</p>
              <p className="text-[11px] text-foreground/40">
                Fill your question bank offline in Excel or Google Sheets, then drop the file below.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-navy-800 text-gold-400 border border-gold-500/30 hover:bg-gold-500/15 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📄</span>
                <span>Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={downloadSampleXLSX}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📊</span>
                <span>Sample Excel</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          {/* Drag & Drop Dropzone */}
          {!parseResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 rounded-2xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-gold-400 bg-gold-500/10 scale-[1.01]"
                  : "border-white/15 bg-navy-950/60 hover:border-gold-500/40 hover:bg-navy-900/40"
              }`}
            >
              {isParsing ? (
                <div className="py-6 space-y-3">
                  <Spinner size="lg" label="Parsing spreadsheet rows & checking answer keys..." />
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center text-2xl shadow-lg shadow-gold-500/10">
                    📂
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      Drag & Drop your Excel or CSV file here
                    </p>
                    <p className="text-xs text-foreground/40 mt-1">
                      Supports <span className="text-gold-400 font-semibold">.CSV</span>,{" "}
                      <span className="text-emerald-400 font-semibold">.XLSX</span>, and{" "}
                      <span className="text-purple-400 font-semibold">.XLS</span> spreadsheet files
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" type="button" className="mt-2">
                    Browse Files from Computer
                  </Button>
                </>
              )}
            </div>
          )}

          {parseError && (
            <div className="p-4 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{parseError}</span>
            </div>
          )}

          {/* Interactive Live Preview & Validation Table */}
          {parseResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="text-sm font-bold text-white">{parseResult.fileName}</p>
                    <p className="text-xs text-foreground/40">
                      Total Rows Parsed: {parseResult.totalRows}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
                    ✓ {parseResult.validQuestions.length} Valid Questions
                  </span>
                  {parseResult.invalidCount > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30">
                      ⚠️ {parseResult.invalidCount} Invalid Rows
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setParseResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold text-foreground/50 hover:text-white hover:bg-navy-800 transition cursor-pointer border border-white/10"
                  >
                    Change File
                  </button>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      importMode === "append"
                        ? "bg-gold-500 text-navy-950 border-gold-400 font-bold shadow-md shadow-gold-500/20"
                        : "bg-navy-950 text-foreground/50 border-white/10 hover:text-white"
                    }`}
                  >
                    ➕ Append to Question Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("overwrite")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      importMode === "overwrite"
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
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-navy-900 border-b border-navy-700 text-foreground/45 uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="p-3 w-12 text-center">Row</th>
                        <th className="p-3">Question</th>
                        <th className="p-3">Options & Correct Answer</th>
                        <th className="p-3 w-28">Subject</th>
                        <th className="p-3 w-28 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/40 bg-navy-950/40">
                      {parseResult.parsedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={row.isValid ? "hover:bg-navy-900/40" : "bg-danger/5"}
                        >
                          <td className="p-3 text-center font-mono text-foreground/40 font-bold">
                            #{row.rowIndex}
                          </td>
                          <td className="p-3 font-semibold text-white max-w-xs truncate">
                            {row.question}
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {row.options.map((opt, oIdx) => {
                                const isCorrect = row.correctAnswer === oIdx;
                                return (
                                  <span
                                    key={oIdx}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                      isCorrect
                                        ? "bg-success/20 text-success border-success/40 font-bold"
                                        : "bg-navy-900 text-foreground/50 border-white/5"
                                    }`}
                                  >
                                    {["A", "B", "C", "D"][oIdx]}: {opt}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-foreground/60">
                            <span className="px-2 py-0.5 rounded bg-navy-800 text-gold-400 text-[10px] font-bold border border-gold-500/20">
                              {row.subject}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {row.isValid ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                                ✓ Valid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-danger/20 text-danger border border-danger/30">
                                ⚠️ {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
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

          {parseResult && (
            <Button
              size="md"
              type="button"
              disabled={parseResult.validQuestions.length === 0}
              onClick={handleConfirmImport}
              className="px-6 font-bold shadow-lg shadow-gold-500/20"
            >
              📥 Confirm &amp; Import {parseResult.validQuestions.length} Questions (
              {importMode === "append" ? "Append" : "Replace"})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

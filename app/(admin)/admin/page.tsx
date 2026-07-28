"use client";

import { useEffect, useState } from "react";
import { getAllExamResults } from "@/lib/firebase";
import { ResultDocument } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { EXAM_CONFIG, EXAM_INFO } from "@/lib/constants";
import { questions } from "@/lib/questions";


export default function AdminPage() {
  const [results, setResults] = useState<ResultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedResult, setSelectedResult] = useState<ResultDocument | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"summary" | "review">("summary");

  const handleSelectResult = (res: ResultDocument | null) => {
    setSelectedResult(res);
    setActiveTab("summary");
  };


  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllExamResults();
      setResults(data);
    } catch (err) {
      setError(
        "Failed to fetch results. Make sure Firebase is configured correctly."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Filter & Sort
  const filtered = results
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
  const totalExams = results.length;
  const totalCandidates = new Set(results.map((r) => r.candidateName.trim().toLowerCase())).size;


  // Get wrong and unanswered question numbers for the selected candidate
  const wrongQuestionNumbers: number[] = [];
  const unansweredQuestionNumbers: number[] = [];
  if (selectedResult) {
    selectedResult.answers.forEach((ans, idx) => {
      if (ans === null) {
        unansweredQuestionNumbers.push(idx + 1);
      } else if (ans !== questions[idx].correctAnswer) {
        wrongQuestionNumbers.push(idx + 1);
      }
    });
  }


  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin Header */}
      <header className="glass-card !rounded-none border-x-0 border-t-0 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <svg
                className="w-5 h-5 text-navy-950"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gradient-gold">
                {EXAM_INFO.title}
              </h1>
              <p className="text-xs text-foreground/40">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={fetchResults}>
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>
            <a href="/">
              <Button variant="ghost" size="sm">
                ← Home
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
            label="Total Candidates"
            value={totalCandidates}
            color="text-gold-400"
          />
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            label="Total Submissions"
            value={totalExams}
            color="text-info"
          />
        </div>

        {/* Filters */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by candidate name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "score" | "name")
                }
                className="px-3 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm focus:outline-none focus:border-gold-500/50 cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="p-2.5 rounded-xl bg-navy-800 border border-navy-600/50 hover:bg-navy-700 transition cursor-pointer"
              >
                <svg
                  className={cn(
                    "w-4 h-4 transition-transform",
                    sortOrder === "asc" && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        {loading ? (
          <Card className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-foreground/40">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading results from Firebase...
            </div>
          </Card>
        ) : error ? (
          <Card variant="error" className="text-center py-12">
            <svg
              className="w-12 h-12 text-danger/50 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-danger/80 mb-4">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchResults}>
              Retry
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <svg
              className="w-12 h-12 text-foreground/20 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            <p className="text-foreground/40">
              {searchTerm
                ? "No results match your search"
                : "No exam results yet"}
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-600/30">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider hidden sm:table-cell">
                      Correct
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider hidden sm:table-cell">
                      Wrong
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider hidden md:table-cell">
                      Time
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((result, index) => (
                    <tr
                      key={result.id || index}
                      className="border-b border-navy-700/20 hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground/40">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">
                            {result.candidateName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gold-400">
                          {result.totalMarks}
                        </span>
                        <span className="text-foreground/30">
                          {" "}
                          / {result.maxMarks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-success hidden sm:table-cell">
                        {result.correctCount}
                      </td>
                      <td className="px-6 py-4 text-center text-danger hidden sm:table-cell">
                        {result.wrongCount}
                      </td>
                      <td className="px-6 py-4 text-center text-foreground/50 hidden md:table-cell">
                        {formatTime(result.timeTaken)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                            result.passed
                              ? "bg-success/15 text-success"
                              : "bg-danger/15 text-danger"
                          )}
                        >
                          {result.passed ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-foreground/40 text-xs hidden lg:table-cell">
                        {new Date(result.submittedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSelectResult(result)}
                          className="p-2 rounded-lg hover:bg-navy-700 transition cursor-pointer text-foreground/40 hover:text-gold-400"
                          title="View details"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Result Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="modal-overlay absolute inset-0"
              onClick={() => handleSelectResult(null)}
            />
            <div className="relative glass-card p-6 md:p-8 max-w-5xl w-full animate-scale-in max-h-[90vh] flex flex-col overflow-hidden text-left">
              <div className="flex items-center justify-between mb-4 border-b border-navy-600/30 pb-3">
                <h3 className="text-lg font-bold text-white">
                  Result Details
                </h3>
                <button
                  onClick={() => handleSelectResult(null)}
                  className="p-1 rounded hover:bg-navy-700 transition cursor-pointer"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-navy-600/20 pb-2">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer",
                    activeTab === "summary"
                      ? "bg-gold-500 text-navy-950"
                      : "text-foreground/60 hover:text-white hover:bg-navy-800"
                  )}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab("review")}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer",
                    activeTab === "review"
                      ? "bg-gold-500 text-navy-950"
                      : "text-foreground/60 hover:text-white hover:bg-navy-800"
                  )}
                >
                  Question Review
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {activeTab === "summary" ? (
                  <div className="space-y-4">
                    {/* Candidate Info */}
                    <div className="text-center pb-4 border-b border-navy-600/30">
                      <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">
                        Candidate
                      </p>
                      <h4 className="text-xl font-bold text-white">
                        {selectedResult.candidateName}
                      </h4>
                      <span
                        className={cn(
                          "inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold",
                          selectedResult.passed
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        )}
                      >
                        {selectedResult.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow
                        label="Total Score"
                        value={`${selectedResult.totalMarks} / ${selectedResult.maxMarks}`}
                      />
                      <DetailRow
                        label="Percentage"
                        value={`${selectedResult.percentage}%`}
                      />
                      <DetailRow
                        label="Correct Answers"
                        value={`${selectedResult.correctCount} (+${selectedResult.correctCount * EXAM_CONFIG.marksPerCorrect})`}
                        valueColor="text-success"
                      />
                      <DetailRow
                        label="Wrong Answers"
                        value={`${selectedResult.wrongCount} (-${selectedResult.wrongCount * EXAM_CONFIG.negativeMarks})`}
                        valueColor="text-danger"
                      />
                      <DetailRow
                        label="Unanswered"
                        value={`${selectedResult.unansweredCount}`}
                      />
                      <DetailRow
                        label="Time Taken"
                        value={formatTime(selectedResult.timeTaken)}
                      />
                      <DetailRow
                        label="Submitted"
                        value={new Date(
                          selectedResult.submittedAt
                        ).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        className="col-span-2"
                      />

                      {/* Wrong Questions List */}
                      {wrongQuestionNumbers.length > 0 && (
                        <div className="col-span-2 glass-card-light p-3 rounded-xl border border-danger/25">
                          <p className="text-xs text-danger/80 font-semibold uppercase tracking-wider mb-2">
                            Incorrect Questions ({wrongQuestionNumbers.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {wrongQuestionNumbers.map((num) => (
                              <span
                                key={num}
                                className="px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 text-xs font-bold font-mono"
                              >
                                Q{num}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unanswered Questions List */}
                      {unansweredQuestionNumbers.length > 0 && (
                        <div className="col-span-2 glass-card-light p-3 rounded-xl border border-navy-600/30">
                          <p className="text-xs text-foreground/45 font-semibold uppercase tracking-wider mb-2">
                            Unanswered Questions ({unansweredQuestionNumbers.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {unansweredQuestionNumbers.map((num) => (
                              <span
                                key={num}
                                className="px-2 py-0.5 rounded bg-navy-800 text-foreground/45 border border-navy-700/60 text-xs font-bold font-mono"
                              >
                                Q{num}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, idx) => {
                      const selectedOpt = selectedResult.answers[idx];
                      const isCorrect = selectedOpt === question.correctAnswer;
                      const isUnanswered = selectedOpt === null;

                      return (
                        <div
                          key={question.id}
                          className="glass-card-light p-4 rounded-xl space-y-3 border border-navy-700/50"
                        >
                          {/* Question header */}
                          <div className="flex items-center justify-between border-b border-navy-600/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-navy-800 text-gold-400 font-semibold text-xs border border-gold-500/20">
                                Q{idx + 1}
                              </span>
                              <span className="text-xs text-foreground/40 font-medium">
                                {question.subject}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded",
                                isUnanswered
                                  ? "bg-navy-700 text-foreground/50"
                                  : isCorrect
                                  ? "bg-success/10 text-success"
                                  : "bg-danger/10 text-danger"
                              )}
                            >
                              {isUnanswered
                                ? "UNANSWERED (0)"
                                : isCorrect
                                ? "CORRECT (+4)"
                                : "WRONG (-1)"}
                            </span>
                          </div>

                          {/* Question text */}
                          <p className="text-sm font-medium text-white leading-relaxed">
                            {question.question}
                          </p>

                          {/* Options */}
                          <div className="space-y-2">
                            {question.options.map((option, optIdx) => {
                              const isSelected = selectedOpt === optIdx;
                              const isCorrectOpt = optIdx === question.correctAnswer;
                              const isWrongOpt = isSelected && !isCorrectOpt;

                              return (
                                <div
                                  key={optIdx}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all",
                                    isCorrectOpt
                                      ? "border-success/30 bg-success/5 text-success"
                                      : isWrongOpt
                                      ? "border-danger/30 bg-danger/5 text-danger"
                                      : "border-navy-600/30 bg-navy-800/40 text-foreground/70"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                      isCorrectOpt
                                        ? "bg-success text-white"
                                        : isWrongOpt
                                        ? "bg-danger text-white"
                                        : "bg-navy-700 text-foreground/50"
                                    )}
                                  >
                                    {["A", "B", "C", "D"][optIdx]}
                                  </span>
                                  <span>{option}</span>
                                  {isCorrectOpt && (
                                    <span className="ml-auto text-success font-semibold text-xs flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Correct
                                    </span>
                                  )}
                                  {isWrongOpt && (
                                    <span className="ml-auto text-danger font-semibold text-xs flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Selected
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>


                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-foreground/20 border-t border-navy-700/30">
        © {new Date().getFullYear()} Bengal Legal House — Admin Dashboard
      </footer>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="!p-5 flex items-center gap-4">
      <div className={cn("p-2.5 rounded-xl bg-glass-light", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-foreground/40">{label}</p>
        <p className={cn("text-xl font-bold", color)}>{value}</p>
      </div>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  valueColor = "text-white",
  className,
}: {
  label: string;
  value: string;
  valueColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-card-light p-3 rounded-xl", className)}>
      <p className="text-xs text-foreground/40 mb-0.5">{label}</p>
      <p className={cn("text-sm font-semibold", valueColor)}>{value}</p>
    </div>
  );
}

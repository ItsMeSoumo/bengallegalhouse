"use client";

import React, { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/admin/Pagination";
import { ResultDocument, ExamPaper } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { downloadExamScorecardPDF } from "@/lib/generatePdfReport";

interface AdminCandidateResultsProps {
  results: ResultDocument[];
  examPapers: ExamPaper[];
  loading: boolean;
  onSelectResult: (res: ResultDocument) => void;
  onDeleteCandidate: (res: ResultDocument) => void;
  selectedResults: string[];
  onToggleSelectResult: (id: string) => void;
  onSelectAllResults: (ids: string[]) => void;
  onOpenBulkDeleteModal: () => void;
}

export default function AdminCandidateResults({
  results,
  examPapers,
  loading,
  onSelectResult,
  onDeleteCandidate,
  selectedResults,
  onToggleSelectResult,
  onSelectAllResults,
  onOpenBulkDeleteModal,
}: AdminCandidateResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rank" | "date" | "name">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Map of result ID -> rank number (1-based) computed per exam paper
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

  // Top 3 Leaderboard Rankers for current filter view
  const topRankers = useMemo(() => {
    const baseList = selectedExamFilter === "all"
      ? results
      : results.filter((r) => r.examId === selectedExamFilter);

    const sorted = [...baseList].sort((a, b) => {
      const rankA = a.id ? ranksMap.get(a.id) ?? 999999 : 999999;
      const rankB = b.id ? ranksMap.get(b.id) ?? 999999 : 999999;
      return rankA - rankB;
    });

    return sorted.slice(0, 3);
  }, [results, selectedExamFilter, ranksMap]);

  // Filter & Sort Candidate Results
  const filteredResults = useMemo(() => {
    return results
      .filter((r) => {
        const matchesName = r.candidateName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesExam = selectedExamFilter === "all" || r.examId === selectedExamFilter;
        return matchesName && matchesExam;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "rank": {
            const rankA = a.id ? ranksMap.get(a.id) ?? 999999 : 999999;
            const rankB = b.id ? ranksMap.get(b.id) ?? 999999 : 999999;
            comparison = rankA - rankB;
            return sortOrder === "asc" ? -comparison : comparison;
          }
          case "date":
            comparison = new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
            return sortOrder === "desc" ? -comparison : comparison;
          case "name":
            comparison = a.candidateName.localeCompare(b.candidateName);
            return sortOrder === "desc" ? -comparison : comparison;
        }
        return comparison;
      });
  }, [results, searchTerm, selectedExamFilter, sortBy, sortOrder, ranksMap]);

  // Reset to page 1 on filter/search change
  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  const handleSelectAllOnPage = () => {
    const allFilteredIds = filteredResults.map((r) => r.id || "").filter(Boolean);
    if (selectedResults.length === allFilteredIds.length) {
      onSelectAllResults([]);
    } else {
      onSelectAllResults(allFilteredIds);
    }
  };

  const totalCandidatesCount = useMemo(() => {
    return new Set(results.map((r) => r.candidateName.trim().toLowerCase())).size;
  }, [results]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="!p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-glass-light text-gold-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-foreground/40">Total Candidates</p>
            <p className="text-xl font-bold text-gold-400">{totalCandidatesCount}</p>
          </div>
        </Card>

        <Card className="!p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-glass-light text-info">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-foreground/40">Total Submissions</p>
            <p className="text-xl font-bold text-info">{results.length}</p>
          </div>
        </Card>
      </div>

      {/* Top 3 Merit Rankers Leaderboard */}
      {topRankers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🏆 Top Merit Rankers</span>
              {selectedExamFilter !== "all" && (
                <span className="text-xs font-normal text-gold-400">
                  — {examPapers.find((p) => p.id === selectedExamFilter)?.title || "Filtered Exam"}
                </span>
              )}
            </h3>
            <span className="text-xs text-foreground/40 font-medium">Ranked by Marks & Accuracy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topRankers.map((ranker, i) => {
              const actualRank = ranker.id ? ranksMap.get(ranker.id) || i + 1 : i + 1;
              const medals = ["🥇", "🥈", "🥉"];
              const badges = [
                "border-gold-500/40 bg-gradient-to-br from-gold-500/15 via-gold-500/5 to-transparent text-gold-400",
                "border-slate-400/40 bg-gradient-to-br from-slate-400/15 via-slate-400/5 to-transparent text-slate-300",
                "border-amber-600/40 bg-gradient-to-br from-amber-600/15 via-amber-600/5 to-transparent text-amber-400",
              ];

              return (
                <Card key={ranker.id || i} className={cn("p-4 border relative overflow-hidden flex flex-col justify-between space-y-3", badges[i] || "border-navy-700")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl">{medals[i] || "🏅"}</span>
                      <h4 className="text-base font-bold text-white mt-1 line-clamp-1">{ranker.candidateName}</h4>
                      <p className="text-[11px] text-foreground/40 line-clamp-1">{ranker.examTitle || "Exam Paper"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-navy-950/80 border border-white/15 text-white shadow-sm">
                      Rank #{actualRank}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-foreground/40 block text-[10px] uppercase">Score</span>
                      <span className="font-bold text-gold-400">{ranker.totalMarks} / {ranker.maxMarks} ({ranker.percentage}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-foreground/40 block text-[10px] uppercase">Time</span>
                      <span className="font-medium text-white">{formatTime(ranker.timeTaken)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedExamFilter}
              onChange={(e) => {
                setSelectedExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-navy-800 border border-gold-500/30 text-gold-400 font-semibold text-sm focus:outline-none cursor-pointer"
            >
              <option value="all">🏆 All Examinations</option>
              {examPapers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  📄 {paper.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rank" | "date" | "name")}
              className="px-3 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="rank">🏆 Rank (Highest Marks)</option>
              <option value="date">📅 Date Submitted</option>
              <option value="name">👤 Candidate Name</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="p-2.5 rounded-xl bg-navy-800 border border-navy-600/50 hover:bg-navy-700 transition cursor-pointer"
              title={sortOrder === "asc" ? "Ascending Order" : "Descending Order"}
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
          <Button variant="danger" size="sm" onClick={onOpenBulkDeleteModal}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Results Data Table */}
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
                      onChange={handleSelectAllOnPage}
                      className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer"
                    />
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-bold text-gold-400 uppercase tracking-wider">
                    {sortBy === "rank" ? "Rank" : "#"}
                  </th>
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
                {paginatedResults.map((result, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
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
                  const rankNum = result.id ? ranksMap.get(result.id) : undefined;

                  return (
                    <tr key={result.id || index} className="border-b border-navy-700/20 hover:bg-navy-800/50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result.id || "")}
                          onChange={() => onToggleSelectResult(result.id || "")}
                          className="rounded border-navy-600 text-gold-500 focus:ring-gold-500 bg-navy-800 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {sortBy === "rank" ? (
                          rankNum === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 via-gold-400 to-amber-600 text-navy-950 shadow-md shadow-gold-500/20 border border-gold-400/60">
                              🥇 Rank 1
                            </span>
                          ) : rankNum === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 text-navy-950 shadow-sm border border-slate-300/60">
                              🥈 Rank 2
                            </span>
                          ) : rankNum === 3 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white shadow-sm border border-amber-500/40">
                              🥉 Rank 3
                            </span>
                          ) : rankNum ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-navy-800 text-foreground/75 border border-navy-700">
                              #{rankNum}
                            </span>
                          ) : (
                            <span className="text-foreground/30 text-xs">-</span>
                          )
                        ) : (
                          <span className="text-foreground/60 text-xs font-semibold">#{globalIndex}</span>
                        )}
                      </td>
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
                          <button onClick={() => onSelectResult(result)} title="Inspect Details" className="p-2 rounded-lg hover:bg-navy-700 transition cursor-pointer text-foreground/40 hover:text-gold-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {result.id && (
                            <button onClick={() => onDeleteCandidate(result)} title="Delete Record" className="p-2 rounded-lg hover:bg-danger/20 transition cursor-pointer text-foreground/40 hover:text-danger">
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredResults.length}
            pageSize={pageSize}
          />
        </Card>
      )}
    </div>
  );
}

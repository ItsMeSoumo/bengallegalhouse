"use client";

import React, { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/admin/Pagination";
import { StudentUserRecord } from "@/lib/firebase";

interface AdminStudentUsersProps {
  studentUsers: StudentUserRecord[];
  loadingStudents: boolean;
  onDeleteStudentUser: (user: StudentUserRecord) => void;
}

export default function AdminStudentUsers({
  studentUsers,
  loadingStudents,
  onDeleteStudentUser,
}: AdminStudentUsersProps) {
  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredStudentUsers = useMemo(() => {
    return studentUsers.filter((u) => {
      const query = studentSearch.toLowerCase().trim();
      if (!query) return true;
      const nameStr = (u.name || "").toLowerCase();
      const emailStr = (u.email || "").toLowerCase();
      return nameStr.includes(query) || emailStr.includes(query);
    });
  }, [studentUsers, studentSearch]);

  const totalPages = Math.ceil(filteredStudentUsers.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudentUsers.slice(start, start + pageSize);
  }, [filteredStudentUsers, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Registered Student Users</h2>
          <p className="text-xs text-foreground/40 mt-1">
            Directory of registered student accounts with email credentials.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <Card className="!p-4">
        <div className="relative w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800 border border-navy-600/50 text-white text-sm placeholder-foreground/30 focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </Card>

      {/* Table */}
      {loadingStudents ? (
        <Card className="text-center py-16 text-foreground/45 flex flex-col items-center justify-center gap-3">
          <Spinner className="w-8 h-8 text-gold-500" />
          <span>Loading registered student accounts...</span>
        </Card>
      ) : filteredStudentUsers.length === 0 ? (
        <Card className="text-center py-12 text-foreground/45">No registered student users found.</Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">#</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Student Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Email Address</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Joined Date</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-foreground/40 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((user, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={user.id || idx} className="border-b border-navy-700/20 hover:bg-navy-800/50 transition-colors">
                      <td className="px-6 py-4 text-foreground/40">{globalIdx}</td>
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 text-gold-400 font-mono text-xs whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 text-center text-foreground/40 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onDeleteStudentUser(user)}
                          title="Delete Student Account"
                          className="p-2 rounded-lg hover:bg-danger/20 transition cursor-pointer text-foreground/40 hover:text-danger"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
            totalItems={filteredStudentUsers.length}
            pageSize={pageSize}
          />
        </Card>
      )}
    </div>
  );
}

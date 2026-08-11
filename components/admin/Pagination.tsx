"use client";

import React from "react";
import Button from "@/components/ui/Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-navy-900/50 border-t border-navy-700/40 text-xs text-foreground/60">
      <div>
        Showing <span className="font-semibold text-white">{startItem}</span> to{" "}
        <span className="font-semibold text-white">{endItem}</span> of{" "}
        <span className="font-semibold text-gold-400">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="!px-3 !py-1 text-xs"
        >
          ← Prev
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev && page - prev > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-1 text-foreground/30">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentPage === page
                      ? "bg-gold-500 text-navy-950 font-bold shadow-md shadow-gold-500/20"
                      : "bg-navy-800 text-foreground/70 hover:text-white hover:bg-navy-700"
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="!px-3 !py-1 text-xs"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

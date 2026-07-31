import * as XLSX from "xlsx";
import { ServerQuestion } from "./types";

export interface ParsedQuestionRow {
  rowIndex: number;
  question: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  explanation?: string;
  isValid: boolean;
  error?: string;
}

export interface ParseFileResult {
  fileName: string;
  totalRows: number;
  validQuestions: ServerQuestion[];
  parsedRows: ParsedQuestionRow[];
  invalidCount: number;
}

/**
 * Downloads a standardized CSV sample template for coaching owners.
 */
export function downloadSampleCSV() {
  const headers = [
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer",
    "Subject",
    "Explanation",
  ];

  const sampleRows = [
    [
      "Choose the word that is closest in meaning to Esoteric.",
      "Obvious",
      "Intended for a select few",
      "Universal",
      "Elementary",
      "B",
      "English",
      "Esoteric means understood by only a small number of people with specialized knowledge.",
    ],
    [
      "Which Schedule of the Indian Constitution deals with the allocation of seats in the Council of States (Rajya Sabha)?",
      "Third Schedule",
      "Fourth Schedule",
      "Fifth Schedule",
      "Sixth Schedule",
      "Fourth Schedule",
      "Constitution",
      "The Fourth Schedule deals with the allocation of seats in Rajya Sabha.",
    ],
    [
      "If x + 1/x = 4, find the value of x^2 + 1/x^2.",
      "14",
      "16",
      "18",
      "20",
      "A",
      "Quantitative Aptitude",
      "(x + 1/x)^2 = x^2 + 1/x^2 + 2 => 16 - 2 = 14.",
    ],
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...sampleRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "sohamcbt_question_bank_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a standardized Excel (.xlsx) sample template.
 */
export function downloadSampleXLSX() {
  const data = [
    {
      "Question": "Choose the word that is closest in meaning to Esoteric.",
      "Option A": "Obvious",
      "Option B": "Intended for a select few",
      "Option C": "Universal",
      "Option D": "Elementary",
      "Correct Answer": "B",
      "Subject": "English",
      "Explanation": "Esoteric means understood by a select few.",
    },
    {
      "Question": "Which Article of the Indian Constitution guarantees the Right to Equality?",
      "Option A": "Article 12",
      "Option B": "Article 14",
      "Option C": "Article 19",
      "Option D": "Article 21",
      "Correct Answer": "B",
      "Subject": "Constitution",
      "Explanation": "Article 14 guarantees equality before law.",
    },
    {
      "Question": "Legal Aptitude: An agreement made without consideration is generally—",
      "Option A": "Valid",
      "Option B": "Voidable",
      "Option C": "Void",
      "Option D": "Illegal",
      "Correct Answer": "C",
      "Subject": "Legal Aptitude",
      "Explanation": "Section 25 of Indian Contract Act states an agreement without consideration is void.",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Question Bank");
  XLSX.writeFile(workbook, "sohamcbt_question_bank_template.xlsx");
}

/**
 * Normalizes raw string key references across different CSV/Excel header variations.
 */
function findValueByHeaders(row: Record<string, unknown>, candidateKeys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const candidate of candidateKeys) {
    const matchedKey = rowKeys.find(
      (rk) => rk.trim().toLowerCase() === candidate.trim().toLowerCase()
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return String(row[matchedKey]).trim();
    }
  }
  return "";
}

/**
 * Parses correct answer string (e.g. 'A', '1', 'Option B', or option text) into a 0-indexed integer (0..3).
 */
function parseCorrectAnswerIndex(
  ansRaw: string,
  options: string[]
): { index: number; valid: boolean } {
  if (!ansRaw) return { index: -1, valid: false };

  const clean = ansRaw.trim().toUpperCase();

  // Single Letter
  if (clean === "A" || clean === "OPTION A" || clean === "OPT A" || clean === "1") return { index: 0, valid: true };
  if (clean === "B" || clean === "OPTION B" || clean === "OPT B" || clean === "2") return { index: 1, valid: true };
  if (clean === "C" || clean === "OPTION C" || clean === "OPT C" || clean === "3") return { index: 2, valid: true };
  if (clean === "D" || clean === "OPTION D" || clean === "OPT D" || clean === "4") return { index: 3, valid: true };

  // Check if answer string matches option text directly
  const textIndex = options.findIndex((opt) => opt.trim().toLowerCase() === ansRaw.trim().toLowerCase());
  if (textIndex !== -1) {
    return { index: textIndex, valid: true };
  }

  return { index: -1, valid: false };
}

/**
 * Parses uploaded spreadsheet file (.csv, .xlsx, .xls) and validates question rows.
 */
export async function parseUploadedQuestionFile(file: File): Promise<ParseFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const parsedRows: ParsedQuestionRow[] = [];
        const validQuestions: ServerQuestion[] = [];

        rawRows.forEach((row, idx) => {
          const rowIndex = idx + 2; // 1-indexed line number + 1 for header row

          const questionText = findValueByHeaders(row, ["Question", "Question Text", "Prompt", "QText", "Q"]);
          const optA = findValueByHeaders(row, ["Option A", "Option 1", "Opt A", "A"]);
          const optB = findValueByHeaders(row, ["Option B", "Option 2", "Opt B", "B"]);
          const optC = findValueByHeaders(row, ["Option C", "Option 3", "Opt C", "C"]);
          const optD = findValueByHeaders(row, ["Option D", "Option 4", "Opt D", "D"]);
          const ansRaw = findValueByHeaders(row, ["Correct Answer", "Correct", "Answer Key", "Answer", "Key"]);
          const subject = findValueByHeaders(row, ["Subject", "Category", "Topic"]) || "General";
          const explanation = findValueByHeaders(row, ["Explanation", "Solution", "Details"]);

          const options = [optA, optB, optC, optD].filter(Boolean);

          let isValid = true;
          let error = "";

          if (!questionText) {
            isValid = false;
            error = "Missing question text";
          } else if (!optA || !optB) {
            isValid = false;
            error = "At least Option A and Option B are required";
          } else {
            const { index: correctIdx, valid: ansValid } = parseCorrectAnswerIndex(ansRaw, [optA, optB, optC, optD]);
            if (!ansValid) {
              isValid = false;
              error = `Invalid Correct Answer ('${ansRaw}'). Must be A, B, C, D or 1, 2, 3, 4`;
            } else {
              const fullOptions = [optA, optB, optC || "N/A", optD || "N/A"];
              const serverQ: ServerQuestion = {
                id: parsedRows.length + 1,
                question: questionText,
                options: fullOptions,
                correctAnswer: correctIdx,
                subject,
                explanation: explanation || undefined,
              };

              validQuestions.push(serverQ);

              parsedRows.push({
                rowIndex,
                question: questionText,
                options: fullOptions,
                correctAnswer: correctIdx,
                subject,
                explanation: explanation || undefined,
                isValid: true,
              });
              return;
            }
          }

          parsedRows.push({
            rowIndex,
            question: questionText || "(Empty Row)",
            options: [optA, optB, optC, optD],
            correctAnswer: -1,
            subject: subject || "General",
            explanation: explanation || undefined,
            isValid: false,
            error,
          });
        });

        resolve({
          fileName: file.name,
          totalRows: rawRows.length,
          validQuestions,
          parsedRows,
          invalidCount: parsedRows.filter((r) => !r.isValid).length,
        });
      } catch (err) {
        console.error("Error parsing question spreadsheet file:", err);
        reject(new Error("Failed to parse file. Please verify it is a valid CSV or Excel spreadsheet."));
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

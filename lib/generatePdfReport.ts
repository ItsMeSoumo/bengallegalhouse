import { ResultDocument, ServerQuestion } from "./types";
import { getExamPaperById } from "./examRegistry";
import { serverQuestions as defaultQuestions } from "./serverQuestions";
import { formatTime } from "./utils";

export function downloadExamScorecardPDF(result: ResultDocument): void {
  // Locate question list for this exam
  const examPaper = result.examId ? getExamPaperById(result.examId) : undefined;
  const questionList: ServerQuestion[] =
    examPaper && examPaper.questions && examPaper.questions.length > 0
      ? examPaper.questions
      : defaultQuestions;

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("Please allow popups to download the PDF Scorecard.");
    return;
  }

  const submittedDateStr = result.submittedAt
    ? new Date(result.submittedAt).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    : "N/A";

  const questionRowsHTML = questionList
    .map((q, idx) => {
      const selectedOpt = result.answers ? result.answers[idx] : null;
      const isUnanswered = selectedOpt === null || selectedOpt === undefined;
      const isCorrect = !isUnanswered && selectedOpt === q.correctAnswer;

      const userChoiceText = !isUnanswered
        ? `${String.fromCharCode(65 + (selectedOpt as number))}: ${q.options[selectedOpt as number]}`
        : "Not Attempted";

      const correctChoiceText = `${String.fromCharCode(65 + q.correctAnswer)}: ${q.options[q.correctAnswer]}`;

      let badgeClass = "badge-unanswered";
      let badgeText = "UNANSWERED (0)";
      if (!isUnanswered) {
        if (isCorrect) {
          badgeClass = "badge-correct";
          badgeText = "CORRECT (+1)";
        } else {
          badgeClass = "badge-wrong";
          badgeText = "WRONG (-0.25)";
        }
      }

      return `
        <tr class="q-row">
          <td class="col-num">Q${idx + 1}</td>
          <td class="col-details">
            <div class="q-subject">${q.subject || "General"}</div>
            <div class="q-text">${escapeHtml(q.question)}</div>
            <div class="answers-grid">
              <div class="ans-box ${isUnanswered ? "ans-muted" : isCorrect ? "ans-green" : "ans-red"}">
                <span class="ans-label">Candidate Choice:</span> ${escapeHtml(userChoiceText)}
              </div>
              <div class="ans-box ans-correct-key">
                <span class="ans-label">Official Answer:</span> ${escapeHtml(correctChoiceText)}
              </div>
            </div>
          </td>
          <td class="col-status">
            <span class="status-badge ${badgeClass}">${badgeText}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scorecard_${sanitizeFilename(result.candidateName)}_${result.examId || "exam"}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 13px;
      line-height: 1.4;
    }
    .header-card {
      background: linear-gradient(135deg, #0a0f1d 0%, #1e293b 100%);
      color: #ffffff;
      padding: 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border: 1px solid #334155;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #f59e0b;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
      font-weight: 500;
    }
    .score-banner {
      text-align: right;
      background: rgba(255, 255, 255, 0.05);
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .score-num {
      font-size: 26px;
      font-weight: 900;
      color: #f59e0b;
      margin: 0;
    }
    .score-sub {
      font-size: 11px;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Candidate Profile Details Table */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 16px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .grid-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .val-green { color: #16a34a; }
    .val-red { color: #dc2626; }
    .val-gold { color: #d97706; }

    /* Student Info Box */
    .info-box {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      border: 1px solid #cbd5e1;
    }
    .info-item {
      font-size: 12px;
    }
    .info-item strong {
      color: #334155;
    }

    /* Questions Table */
    .questions-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .questions-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
    }
    .q-row {
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .q-row:nth-child(even) {
      background: #f8fafc;
    }
    .col-num {
      width: 48px;
      font-weight: 800;
      color: #475569;
      vertical-align: top;
      padding: 12px 8px;
      font-size: 12px;
    }
    .col-details {
      padding: 12px;
      vertical-align: top;
    }
    .q-subject {
      font-size: 10px;
      font-weight: 700;
      color: #d97706;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .q-text {
      font-weight: 600;
      color: #1e293b;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .answers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 11px;
    }
    .ans-box {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .ans-label {
      font-weight: 700;
      color: #64748b;
    }
    .ans-green {
      background: #f0fdf4;
      border-color: #86efac;
      color: #15803d;
      font-weight: 600;
    }
    .ans-red {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #b91c1c;
      font-weight: 600;
    }
    .ans-muted {
      background: #f8fafc;
      color: #94a3b8;
    }
    .ans-correct-key {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #1d4ed8;
      font-weight: 600;
    }
    .col-status {
      width: 130px;
      vertical-align: top;
      padding: 12px 8px;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .badge-correct {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-wrong {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .badge-unanswered {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }

    .footer-stamp {
      margin-top: 30px;
      text-align: center;
      padding-top: 16px;
      border-t: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 11px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Controls Bar -->
  <div class="no-print" style="background:#0a0f1d; padding:12px 20px; border-radius:8px; margin-bottom:16px; display:flex; justify-between; align-items:center;">
    <span style="color:#ffffff; font-weight:700; font-size:14px;">📄 Official Examination PDF Report</span>
    <button onclick="window.print()" style="background:#f59e0b; color:#0a0f1d; border:none; padding:8px 18px; border-radius:6px; font-weight:800; cursor:pointer; font-size:13px;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Header Card -->
  <div class="header-card">
    <div>
      <h1 class="brand-title">Law Practice CBT</h1>
      <p class="brand-subtitle">${escapeHtml(result.examTitle || "Law Entrance Examination")}</p>
    </div>
    <div class="score-banner">
      <div class="score-num">${result.totalMarks} / ${result.maxMarks}</div>
      <div class="score-sub">Total Score (${result.percentage}%)</div>
    </div>
  </div>

  <!-- Student Info Box -->
  <div class="info-box">
    <div class="info-item">
      <strong>Student Candidate:</strong> ${escapeHtml(result.candidateName)}
    </div>
    ${
      result.candidateEmail
        ? `<div class="info-item"><strong>Email:</strong> ${escapeHtml(result.candidateEmail)}</div>`
        : ""
    }
    <div class="info-item">
      <strong>Submitted Date:</strong> ${submittedDateStr}
    </div>
  </div>

  <!-- Metric Summary -->
  <div class="grid-summary">
    <div class="metric-card">
      <div class="metric-label">Correct Answers (+1)</div>
      <div class="metric-val val-green">${result.correctCount} Qs</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Wrong Answers (-0.25)</div>
      <div class="metric-val val-red">${result.wrongCount} Qs</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Unanswered</div>
      <div class="metric-val">${result.unansweredCount} Qs</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Time Taken</div>
      <div class="metric-val val-gold">${formatTime(result.timeTaken)}</div>
    </div>
  </div>

  <!-- Detailed Review Section -->
  <div class="section-title">Question-by-Question Evaluation & Response Sheet</div>

  <table class="questions-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Question & Option Analysis</th>
        <th style="text-align:right;">Status & Mark</th>
      </tr>
    </thead>
    <tbody>
      ${questionRowsHTML}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer-stamp">
    Official Computer Based Test (CBT) Assessment Scorecard • Confidential Evaluation Document • © ${new Date().getFullYear()} Law Practice CBT
  </div>

  <script>
    // Auto trigger print dialog after page loads
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeFilename(name: string): string {
  return (name || "student").replace(/[^a-zA-Z0-9_-]/g, "_");
}

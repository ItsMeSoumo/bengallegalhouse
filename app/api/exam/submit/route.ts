import { NextResponse } from "next/server";
import { ExamResult } from "@/lib/types";
import {
  saveExamResult,
  getCandidateExamResults,
  getExamSessionById,
  completeExamSession,
} from "@/lib/firebase";
import { resolveExamPaper } from "@/lib/paperResolver";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json();
    const {
      candidateName,
      candidateEmail,
      answers,
      timeTaken,
      examId,
      tabSwitchCount,
      autoSubmitted,
      sessionId,
    } = body;
    const cleanEmail = candidateEmail?.trim().toLowerCase() || "";
    const cleanName = candidateName?.trim() || "";

    const safeLogName = String(cleanName).replace(/[\r\n]/g, "");
    const safeLogEmail = String(cleanEmail).replace(/[\r\n]/g, "");
    const safeExamId = String(examId || "").replace(/[\r\n]/g, "");
    const safeSessionId = String(sessionId || "none").replace(/[\r\n]/g, "");

    console.log(`\n📝 [API POST: /api/exam/submit] Test submission received!
        - Candidate Name: ${safeLogName}
        - Candidate Email: ${safeLogEmail}
        - Exam ID: ${safeExamId}
        - Session ID: ${safeSessionId}
        - Auth Token Attached: ${authHeader ? "Yes" : "No"}
        - Time Taken: ${timeTaken} seconds
        - Total Answers Submitted: ${Array.isArray(answers) ? answers.length : 0}`);

    if (!cleanName || !cleanEmail || !Array.isArray(answers) || !examId) {
      console.warn("⚠️ [API POST: /api/exam/submit] Missing candidate identity or invalid submission payload!");
      return NextResponse.json(
        { success: false, error: "Candidate name, email, and valid answer set are required for submission." },
        { status: 400 }
      );
    }

    // ── Server Session Lifecycle Validation ──
    if (sessionId) {
      const activeSession = await getExamSessionById(sessionId);
      if (activeSession) {
        if (activeSession.status === "completed") {
          console.warn(`⛔ [API POST: /api/exam/submit] Re-submission attempt on completed session '${sessionId}'`);
          return NextResponse.json(
            { success: false, error: "This exam session has already been submitted and completed." },
            { status: 400 }
          );
        }
        // 45 seconds network latency buffer
        const now = Date.now();
        if (activeSession.expiresAt && now > activeSession.expiresAt + 45000) {
          console.warn(`⛔ [API POST: /api/exam/submit] Session '${sessionId}' expired beyond network grace period.`);
          return NextResponse.json(
            { success: false, error: "Exam submission rejected: Time window has expired." },
            { status: 408 }
          );
        }
      }
    }

    // Resolve paper securely with canonical validation & shared paper definition
    console.log(`🔍 [DB READ: submit] Loading master exam sheet for ID: '${examId}'`);
    const examPaper = examId ? await resolveExamPaper(examId) : null;

    if (!examPaper || !examPaper.questions || examPaper.questions.length === 0) {
      console.warn(`⚠️ [API POST: /api/exam/submit] Exam paper '${examId}' not found or has no questions configured!`);
      return NextResponse.json(
        { success: false, error: "Exam paper not found or has no questions" },
        { status: 404 }
      );
    }

    console.log(`🔍 [DB READ: submit] Loaded exam '${examPaper.title}' with ${examPaper.questions.length} total questions.`);

    // ── Server-Side Attempt Limit Enforcement (Dynamic from Firestore) ──
    if (examPaper.maxAttempts && examPaper.maxAttempts > 0) {
      try {
        console.log(`🔍 [DB READ: submit check] Verifying attempt limits for candidate. Max allowed: ${examPaper.maxAttempts}`);
        const candidateResults = await getCandidateExamResults(candidateName, candidateEmail);
        const existingAttempts = candidateResults.filter(
          (r) => r.examId === examPaper.id
        ).length;

        if (existingAttempts >= examPaper.maxAttempts) {
          console.warn(`⛔ [API POST: /api/exam/submit] Rejecting submission! Attempt limit (${examPaper.maxAttempts}) reached.`);
          return NextResponse.json(
            { success: false, error: `Maximum allowed attempts (${examPaper.maxAttempts}) reached for this examination.` },
            { status: 403 }
          );
        }
      } catch (checkErr) {
        console.warn("Attempt limit pre-check warning:", checkErr);
      }
    }

    const examQuestions = examPaper.questions;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    answers.forEach((answer: number | null, index: number) => {
      if (index >= examQuestions.length) return;

      if (answer === null || answer === undefined) {
        unansweredCount++;
      } else if (answer === examQuestions[index].correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const rawMarks = correctCount * examPaper.marksPerCorrect - wrongCount * examPaper.negativeMarks;
    const totalMarks = Math.round(rawMarks * 100) / 100;
    const maxMarks = examQuestions.length * examPaper.marksPerCorrect;
    const percentage = Math.round((totalMarks / maxMarks) * 100 * 100) / 100;
    const passed = percentage >= examPaper.passingPercentage;

    console.log(`📐 [EVALUATION] Grading completed:
        - Correct Answers: ${correctCount}
        - Wrong Answers: ${wrongCount}
        - Unanswered: ${unansweredCount}
        - Total Marks: ${totalMarks} / ${maxMarks}
        - Percentage: ${percentage}% (Passing: ${examPaper.passingPercentage}%)
        - Status: ${passed ? "PASSED" : "FAILED"}`);

    const result: ExamResult = {
      examId: examPaper.id,
      examTitle: examPaper.title,
      candidateName,
      candidateEmail: candidateEmail || "",
      totalQuestions: examQuestions.length,
      correctCount,
      wrongCount,
      unansweredCount,
      totalMarks,
      maxMarks,
      percentage,
      passed,
      timeTaken: timeTaken || examPaper.totalTimeMinutes * 60,
      submittedAt: new Date().toISOString(),
      answers,
      tabSwitchCount: typeof tabSwitchCount === "number" ? tabSwitchCount : 0,
      autoSubmitted: !!autoSubmitted,
    };

    // Save to Firebase
    let submissionId = "";
    try {
      console.log(`💾 [DB WRITE: submit] Saving graded scorecard to Firestore database...`);
      submissionId = await saveExamResult(result);
      if (sessionId) {
        await completeExamSession(sessionId);
      }
    } catch (firebaseErr) {
      console.error("Firebase save error in server API:", firebaseErr);
    }

    console.log(`📝 [API POST: /api/exam/submit] Submission processed successfully. Result Doc ID: '${submissionId}'`);
    return NextResponse.json({
      success: true,
      submissionId,
      result,
    });
  } catch (error) {
    console.error("Error evaluating exam:", error);
    return NextResponse.json(
      { success: false, error: "Server evaluation error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { PublicQuestion } from "@/lib/types";
import { resolveExamPaper } from "@/lib/paperResolver";
import {
  createOrGetExamSession,
  getCandidateExamResults,
} from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json();
    const { examId, candidateEmail, candidateName } = body;

    const cleanEmail = candidateEmail?.trim().toLowerCase() || "";
    const cleanName = candidateName?.trim() || "";
    const cleanExamId = examId?.trim() || "";

    console.log(`\n🚀 [API POST: /api/exam/start] Exam start requested:
        - Student: "${cleanName}" (${cleanEmail})
        - Exam ID: '${cleanExamId}'
        - Auth Token Attached: ${authHeader ? "Yes" : "No"}`);

    if (!cleanName || !cleanEmail || !cleanExamId) {
      return NextResponse.json(
        { success: false, error: "Candidate name, email, and exam ID are required to start the exam." },
        { status: 400 }
      );
    }

    // 1. Resolve exam paper from master database
    const paper = await resolveExamPaper(cleanExamId);
    if (!paper || !paper.questions || paper.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Exam paper not found or has no active questions configured." },
        { status: 404 }
      );
    }

    // 2. Enforce Attempt Limits
    if (paper.maxAttempts && paper.maxAttempts > 0) {
      const pastResults = await getCandidateExamResults(cleanName, cleanEmail);
      const attemptCount = pastResults.filter((r) => r.examId === paper.id).length;
      if (attemptCount >= paper.maxAttempts) {
        console.warn(`⛔ [API POST: /api/exam/start] Candidate ${cleanEmail} has already used all ${paper.maxAttempts} attempts for '${paper.id}'.`);
        return NextResponse.json(
          { success: false, error: `You have already used all allowed attempts (${paper.maxAttempts}) for this examination.` },
          { status: 403 }
        );
      }
    }

    // 3. Create or resume server-authoritative session
    const { session, isNew } = await createOrGetExamSession({
      examId: paper.id,
      examTitle: paper.title,
      candidateName: cleanName,
      candidateEmail: cleanEmail,
      totalTimeMinutes: paper.totalTimeMinutes,
      scheduledDate: paper.scheduledDate,
      scheduledEndTime: paper.scheduledEndTime,
    });

    const now = Date.now();
    const remainingTimeSec = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

    if (remainingTimeSec <= 0) {
      return NextResponse.json(
        { success: false, error: "The allocated time window for this examination has expired." },
        { status: 410 }
      );
    }

    // 4. Strip correctAnswer and explanation for student payload
    const publicQuestions: PublicQuestion[] = paper.questions.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ correctAnswer, explanation, ...publicFields }) => publicFields
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      isNewSession: isNew,
      serverStartTime: session.serverStartTime,
      expiresAt: session.expiresAt,
      totalTimeSeconds: session.totalTimeSeconds,
      remainingTimeSec,
      examPaper: {
        id: paper.id,
        title: paper.title,
        subtitle: paper.subtitle,
        marksPerCorrect: paper.marksPerCorrect,
        negativeMarks: paper.negativeMarks,
        passingPercentage: paper.passingPercentage,
        scheduledDate: paper.scheduledDate,
        scheduledStartTime: paper.scheduledStartTime,
        scheduledEndTime: paper.scheduledEndTime,
      },
      questions: publicQuestions,
    });
  } catch (err) {
    console.error("Error in /api/exam/start:", err);
    return NextResponse.json(
      { success: false, error: "Failed to initialize examination session on server." },
      { status: 500 }
    );
  }
}

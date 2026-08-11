import { NextResponse } from "next/server";
import { PublicQuestion } from "@/lib/types";
import { resolveExamPaper } from "@/lib/paperResolver";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  console.log(`\n📖 [API GET: /api/exam/questions] Questions requested for Exam ID: '${examId}'`);

  try {
    if (!examId) {
      console.warn("⚠️ [API GET: /api/exam/questions] Missing examId parameter");
      return NextResponse.json({ success: false, error: "examId parameter is required" }, { status: 400 });
    }

    const cleanExamId = examId.trim();

    // 1. Resolve paper securely from single unified paperResolver cache
    const paperData = await resolveExamPaper(cleanExamId);

    if (!paperData || !paperData.questions || paperData.questions.length === 0) {
      console.warn(`⛔ [API GET: /api/exam/questions] Rejecting unknown/unseeded Exam ID: '${cleanExamId}'`);
      return NextResponse.json({ success: false, error: "Exam paper not found in DB" }, { status: 404 });
    }

    // 2. Strip correctAnswer and explanation before returning to student client
    const publicQuestions: PublicQuestion[] = paperData.questions.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ correctAnswer, explanation, ...publicFields }) => publicFields
    );

    const responsePayload = {
      success: true,
      examId: paperData.id || cleanExamId,
      title: paperData.title,
      totalTimeMinutes: paperData.totalTimeMinutes,
      marksPerCorrect: paperData.marksPerCorrect,
      negativeMarks: paperData.negativeMarks,
      passingPercentage: paperData.passingPercentage,
      maxAttempts: paperData.maxAttempts || 0,
      scheduledDate: paperData.scheduledDate,
      scheduledStartTime: paperData.scheduledStartTime,
      scheduledEndTime: paperData.scheduledEndTime,
      questions: publicQuestions,
    };

    console.log(`📖 [API GET: /api/exam/questions] Returning ${publicQuestions.length} public questions for '${paperData.title}'`);
    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error in /api/exam/questions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch exam questions" }, { status: 500 });
  }
}

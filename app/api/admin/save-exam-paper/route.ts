import { NextResponse } from "next/server";
import { ExamPaper } from "@/lib/types";
import { invalidatePaperCache } from "@/lib/paperResolver";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, paper, paperId } = body;

    if (action === "delete" && paperId) {
      invalidatePaperCache(paperId);
      console.log(`\n==================================================`);
      console.log(`🗑️ [SERVER TERMINAL LOG] Admin Deleted Exam Paper:`);
      console.log(`📌 Paper ID: ${paperId}`);
      console.log(`==================================================\n`);

      return NextResponse.json({ success: true, message: `Logged deletion of ${paperId}` });
    }

    if (!paper || !paper.id) {
      return NextResponse.json({ success: false, error: "Missing paper payload" }, { status: 400 });
    }

    const typedPaper = paper as ExamPaper;
    invalidatePaperCache(typedPaper.id);

    console.log(`\n==================================================`);
    console.log(`💾 [SERVER TERMINAL LOG] Admin Saved Exam Paper Settings:`);
    console.log(`📌 Exam ID:             '${typedPaper.id}'`);
    console.log(`📌 Title:               '${typedPaper.title}'`);
    console.log(`📅 Scheduled Date:     ${typedPaper.scheduledDate ? `'${typedPaper.scheduledDate}'` : "None (Always Open 24/7)"}`);
    console.log(`⏰ Scheduled Start:    ${typedPaper.scheduledStartTime ? `'${typedPaper.scheduledStartTime}'` : "None"}`);
    console.log(`⏰ Scheduled End:      ${typedPaper.scheduledEndTime ? `'${typedPaper.scheduledEndTime}'` : "None"}`);
    console.log(`⏱️ Nominal Duration:   ${typedPaper.totalTimeMinutes} minutes`);
    console.log(`❓ Total Questions:    ${typedPaper.questions?.length || 0}`);
    console.log(`🔒 Status / Visibility: Status='${typedPaper.status}' | Private=${typedPaper.isPrivate ? "True" : "False"}`);
    console.log(`==================================================\n`);

    return NextResponse.json({
      success: true,
      examId: typedPaper.id,
      scheduledDate: typedPaper.scheduledDate || null,
      scheduledStartTime: typedPaper.scheduledStartTime || null,
      scheduledEndTime: typedPaper.scheduledEndTime || null,
    });
  } catch (error: any) {
    console.error("❌ [SERVER TERMINAL LOG ERROR] Failed in /api/admin/save-exam-paper:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to log paper changes" }, { status: 500 });
  }
}

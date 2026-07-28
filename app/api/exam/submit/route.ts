import { NextResponse } from "next/server";
import { getExamPaperById, initialExamPapers } from "@/lib/examRegistry";
import { ExamResult } from "@/lib/types";
import { saveExamResult } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateName, candidateEmail, answers, timeTaken, examId } = body;

    if (!candidateName || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "Invalid submission data" },
        { status: 400 }
      );
    }

    // Find the specific exam configuration or fallback to default
    const examPaper = (examId && getExamPaperById(examId)) || initialExamPapers[0];
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
    };

    // Save to Firebase
    let submissionId = "";
    try {
      submissionId = await saveExamResult(result);
    } catch (firebaseErr) {
      console.error("Firebase save error in server API:", firebaseErr);
    }

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

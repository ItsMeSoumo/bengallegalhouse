import { NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection } from "firebase/firestore";
import { ExamResult, ExamPaper } from "@/lib/types";
import { saveExamResult, getCandidateExamResults } from "@/lib/firebase";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Fetch exam paper with full questions (including correctAnswer) — server-side only
async function getExamPaperFromDB(examId: string): Promise<ExamPaper | null> {
  try {
    const docSnap = await getDoc(doc(db, "exam_papers", examId));
    if (docSnap.exists()) {
      return docSnap.data() as ExamPaper;
    }
    // Fallback: scan collection
    const allSnap = await getDocs(collection(db, "exam_papers"));
    const found = allSnap.docs.find((d) => d.id === examId || d.data().id === examId);
    return found ? (found.data() as ExamPaper) : null;
  } catch (err) {
    console.error("Error fetching exam paper from DB:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateName, candidateEmail, answers, timeTaken, examId, tabSwitchCount, autoSubmitted } = body;
    const cleanEmail = candidateEmail?.trim().toLowerCase() || "N/A";

    console.log(`\n📝 [API POST: /api/exam/submit] Test submission received!
        - Candidate Name: ${candidateName}
        - Candidate Email: ${cleanEmail}
        - Exam ID: ${examId}
        - Time Taken: ${timeTaken} seconds
        - Total Answers Submitted: ${answers.length}`);

    if (!candidateName || !Array.isArray(answers)) {
      console.warn("⚠️ [API POST: /api/exam/submit] Invalid submission payload data!");
      return NextResponse.json(
        { success: false, error: "Invalid submission data" },
        { status: 400 }
      );
    }

    // Fetch exam paper from Firestore DB
    console.log(`🔍 [DB READ: submit] Loading master exam sheet for ID: '${examId}'`);
    const examPaper = examId ? await getExamPaperFromDB(examId) : null;

    if (!examPaper || !examPaper.questions || examPaper.questions.length === 0) {
      console.warn(`⚠️ [API POST: /api/exam/submit] Exam paper '${examId}' not found or has no questions configured!`);
      return NextResponse.json(
        { success: false, error: "Exam paper not found or has no questions" },
        { status: 404 }
      );
    }

    console.log(`🔍 [DB READ: submit] Loaded exam '${examPaper.title}' with ${examPaper.questions.length} total questions.`);

    // ── Server-Side Attempt Limit Enforcement ──
    if (examPaper.maxAttempts && examPaper.maxAttempts > 0) {
      try {
        console.log(`🔍 [DB READ: submit check] Verifying attempt limits for candidate. Max allowed: ${examPaper.maxAttempts}`);
        const candidateResults = await getCandidateExamResults(candidateName, candidateEmail);
        const existingAttempts = candidateResults.filter(
          (r) => r.examId === examPaper.id
        ).length;

        console.log(`🔍 [DB READ: submit check] Student has already attempted this exam ${existingAttempts} times.`);
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

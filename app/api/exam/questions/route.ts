import { NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection } from "firebase/firestore";
import { PublicQuestion } from "@/lib/types";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId parameter is required" }, { status: 400 });
    }

    // 1. Fetch exam paper document from Firestore DB
    let paperData: any = null;
    const docSnap = await getDoc(doc(db, "exam_papers", examId));

    if (docSnap.exists()) {
      paperData = docSnap.data();
    } else {
      // Fallback: search collection for matching ID
      const allSnap = await getDocs(collection(db, "exam_papers"));
      const found = allSnap.docs.find((d) => d.id === examId || d.data().id === examId);
      if (found) {
        paperData = found.data();
      }
    }

    if (!paperData) {
      return NextResponse.json({ success: false, error: "Exam paper not found in DB" }, { status: 404 });
    }

    // 2. Strip correctAnswer and explanation before returning to the student client
    const publicQuestions: PublicQuestion[] = (paperData.questions || []).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ correctAnswer, explanation, ...publicFields }: { correctAnswer?: number; explanation?: string; [key: string]: any }) => publicFields
    );

    return NextResponse.json({
      success: true,
      examId: paperData.id || examId,
      title: paperData.title,
      totalTimeMinutes: paperData.totalTimeMinutes,
      marksPerCorrect: paperData.marksPerCorrect,
      negativeMarks: paperData.negativeMarks,
      passingPercentage: paperData.passingPercentage,
      maxAttempts: paperData.maxAttempts || 0,
      questions: publicQuestions,
    });
  } catch (error) {
    console.error("Error in /api/exam/questions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch exam questions" }, { status: 500 });
  }
}

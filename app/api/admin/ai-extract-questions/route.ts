import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { ServerQuestion } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Authentication Cookie
    const token = req.cookies.get("admin_token")?.value;
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { type, mimeType, base64Data, rawText } = body;

    const parts: any[] = [];

    const systemPrompt = `You are an expert examination parser and OCR scanner. Extract all multiple-choice questions from the provided input into a JSON array of question objects.

Each question object MUST strictly follow this JSON schema:
[
  {
    "question": "Full question text string",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0, // 0-indexed integer (0 for A, 1 for B, 2 for C, 3 for D)
    "subject": "Category name (e.g. English, Constitution, Legal Reasoning, Quantitative Aptitude, General Knowledge)",
    "explanation": "Brief explanation or solution text if present"
  }
]

Rules:
1. Ensure 'options' is an array of exactly 4 non-empty strings.
2. Ensure 'correctAnswer' is an integer between 0 and 3. If correct answer is not explicitly stated in the document, deduce the most logically correct answer among the 4 options.
3. Cleanly remove headers like 'Page 1 of 31' or booklet page numbers.
4. Output strictly valid JSON matching the array format.`;

    parts.push({ text: systemPrompt });

    if (type === "image" && base64Data) {
      parts.push({
        inline_data: {
          mime_type: mimeType || "image/png",
          data: base64Data,
        },
      });
      parts.push({ text: "Extract all multiple-choice questions from this booklet image scan." });
    } else if (type === "text" && rawText) {
      parts.push({ text: `Extract all multiple-choice questions from this text:\n\n${rawText}` });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. Must provide image base64Data or rawText." },
        { status: 400 }
      );
    }

    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash-lite-preview",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash-lite-preview",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
    ];
    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (const modelName of modelsToTry) {
      console.log(`🤖 Calling Gemini Vision API (Model: ${modelName}, Type: ${type})...`);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`Gemini model ${modelName} returned status ${res.status}: ${lastErrorText}`);
        }
      } catch (e: any) {
        lastErrorText = e?.message || "Fetch failed";
        console.warn(`Error fetching ${modelName}:`, e);
      }
    }

    if (!geminiRes) {
      return NextResponse.json(
        { success: false, error: `Gemini API call failed across all models. Details: ${lastErrorText}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const jsonOutputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonOutputText) {
      return NextResponse.json(
        { success: false, error: "Gemini Vision AI returned an empty output." },
        { status: 500 }
      );
    }

    let parsedQuestionsRaw: any[] = [];
    try {
      parsedQuestionsRaw = JSON.parse(jsonOutputText);
      if (!Array.isArray(parsedQuestionsRaw)) {
        if (typeof parsedQuestionsRaw === "object" && Array.isArray((parsedQuestionsRaw as any).questions)) {
          parsedQuestionsRaw = (parsedQuestionsRaw as any).questions;
        } else {
          parsedQuestionsRaw = [parsedQuestionsRaw];
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON output:", jsonOutputText);
      return NextResponse.json(
        { success: false, error: "Failed to parse Gemini AI JSON response." },
        { status: 500 }
      );
    }

    // 2. Normalize and validate extracted questions
    const validQuestions: ServerQuestion[] = [];

    parsedQuestionsRaw.forEach((item: any, idx: number) => {
      if (!item || !item.question) return;

      let opts = Array.isArray(item.options) ? item.options.map(String) : [];
      while (opts.length < 4) {
        opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
      }
      if (opts.length > 4) {
        opts = opts.slice(0, 4);
      }

      let cAns = typeof item.correctAnswer === "number" ? Math.floor(item.correctAnswer) : 0;
      if (cAns < 0 || cAns > 3) cAns = 0;

      validQuestions.push({
        id: idx + 1,
        question: String(item.question).trim(),
        options: opts,
        correctAnswer: cAns,
        subject: item.subject ? String(item.subject).trim() : undefined,
        explanation: item.explanation ? String(item.explanation).trim() : undefined,
      });
    });

    console.log(`✅ [Gemini AI Extractor] Successfully extracted ${validQuestions.length} questions.`);

    return NextResponse.json({
      success: true,
      questions: validQuestions,
    });
  } catch (err: any) {
    console.error("Error in /api/admin/ai-extract-questions:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during AI extraction" },
      { status: 500 }
    );
  }
}

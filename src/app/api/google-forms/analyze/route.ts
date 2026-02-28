
import { NextResponse } from 'next/server';
const { analyzeDiagnosticResults } = require('@/lib/prompts/analyze-results');

/**
 * API Route for Google Forms Add-on
 * This endpoint receives raw form data and responses, then runs the Quinfer Analysis.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assessmentTitle, questions, responses } = body;

    // Use environment variable for the API key in web deployment
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-latest';

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: "Gemini API Key is missing on the server. Please set GEMINI_API_KEY in your deployment environment." 
      }, { status: 500 });
    }

    if (!questions || !responses || responses.length === 0) {
      return NextResponse.json({ success: false, message: "No response data received from Google Form." }, { status: 400 });
    }

    // Adapt Google Form structure to Quinfer's internal analysis format
    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      question: q.title,
      type: 'mcq', // Google Forms standard
      options: q.choices || [],
      correctOptionIndex: 0, // Placeholder as Forms don't always expose answer keys via API easily
      marks: 1,
      topic: 'General',
      skill: 'General'
    }));

    const formattedResponses = responses.map((r: any) => ({
      studentName: r.studentName || 'Anonymous',
      submittedAt: new Date(),
      timeTaken: 0,
      awayCount: 0,
      answers: r.answers.map((a: any) => ({
        questionId: a.questionId,
        answer: a.answer
      }))
    }));

    const analysisResult = await analyzeDiagnosticResults({
      apiKey,
      modelName,
      assessmentTitle: assessmentTitle || "Google Form Assessment",
      questions: formattedQuestions,
      studentResponses: formattedResponses,
    });

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error("Add-on Analysis API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

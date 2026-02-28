
import { NextResponse } from 'next/server';
const { analyzeDiagnosticResults } = require('@/lib/prompts/analyze-results');

/**
 * API Route for Google Forms Add-on
 * This endpoint receives raw form data and responses, then runs the Quinfer Analysis.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, modelName, assessmentTitle, questions, responses } = body;

    if (!apiKey || !questions || !responses) {
      return NextResponse.json({ success: false, message: "Missing required data." }, { status: 400 });
    }

    // Adapt Google Form structure to Quinfer's internal analysis format
    // Google Forms questions -> Quinfer Questions
    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      question: q.title,
      type: 'mcq', // Google Forms MCQs
      options: q.choices,
      correctOptionIndex: q.correctAnswerIndex, // Optional if provided
      modelAnswer: q.correctAnswer,
      marks: 1,
      topic: q.topic || 'General',
      skill: q.skill || 'General'
    }));

    // Google Forms responses -> Quinfer Responses
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
      modelName: modelName || 'gemini-1.5-flash-latest',
      assessmentTitle,
      questions: formattedQuestions,
      studentResponses: formattedResponses,
    });

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error("Add-on Analysis API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
const { analyzeDiagnosticResults } = require('@/lib/prompts/analyze-results');
import https from 'https';

/**
 * Validates a license key, including checking subscription status.
 */
async function verifyLicense(licenseKey: string): Promise<{ success: boolean; message?: string }> {
  const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
  if (!GUMROAD_PRODUCT_ID) return { success: true }; 

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      product_id: GUMROAD_PRODUCT_ID,
      license_key: licenseKey.trim(),
      increment_uses_count: false,
    });

    const options = {
      hostname: 'api.gumroad.com',
      path: '/v2/licenses/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            const purchase = parsed.purchase;
            
            // 1. Basic check: Refunded?
            if (purchase.refunded) {
                return resolve({ success: false, message: 'This license has been refunded.' });
            }

            // 2. Subscription Checks
            if (purchase.subscription_id) {
                // Payment failed?
                if (purchase.subscription_failed_at) {
                    return resolve({ success: false, message: 'Subscription payment failed. Please update your payment method.' });
                }
                // Subscription ended (cancelled and period over)?
                if (purchase.subscription_ended_at) {
                    const endDate = new Date(purchase.subscription_ended_at);
                    if (endDate < new Date()) {
                        return resolve({ success: false, message: 'Your subscription has ended.' });
                    }
                }
            }

            resolve({ success: true });
          } else {
            resolve({ success: false, message: parsed.message || 'Invalid or expired license.' });
          }
        } catch (e) {
          resolve({ success: false, message: 'License server error.' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, message: 'Connection error.' }));
    req.write(postData);
    req.end();
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assessmentTitle, questions, responses, licenseKey } = body;

    if (!licenseKey) {
        return NextResponse.json({ success: false, message: "License key missing." }, { status: 401 });
    }

    const licenseStatus = await verifyLicense(licenseKey);
    if (!licenseStatus.success) {
      return NextResponse.json({ 
        success: false, 
        message: licenseStatus.message 
      }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-latest';

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Server configuration error." }, { status: 500 });
    }

    if (!questions || !responses || responses.length === 0) {
      return NextResponse.json({ success: false, message: "No responses found in this form." }, { status: 400 });
    }

    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      question: q.title,
      type: 'mcq',
      options: q.choices || [],
      correctOptionIndex: 0,
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

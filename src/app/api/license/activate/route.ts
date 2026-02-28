
import { NextResponse } from 'next/server';
import https from 'https';

/**
 * Endpoint to "Activate" a license key for a specific user.
 * Now handles subscription validation during activation.
 */
export async function POST(request: Request) {
  try {
    const { licenseKey } = await request.json();
    const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;

    if (!GUMROAD_PRODUCT_ID) {
      return NextResponse.json({ success: false, message: "Server not configured for licensing." }, { status: 500 });
    }

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey.trim(),
        increment_uses_count: true,
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

              // Subscription specific logic
              if (purchase.subscription_id) {
                  if (purchase.subscription_failed_at) {
                      return resolve(NextResponse.json({ success: false, message: "Subscription payment failed. Access denied." }, { status: 403 }));
                  }
                  if (purchase.subscription_ended_at) {
                      const endDate = new Date(purchase.subscription_ended_at);
                      if (endDate < new Date()) {
                          return resolve(NextResponse.json({ success: false, message: "This subscription has expired." }, { status: 403 }));
                      }
                  }
              }

              if (purchase.refunded) {
                  return resolve(NextResponse.json({ success: false, message: "This license has been refunded." }, { status: 403 }));
              }

              resolve(NextResponse.json({ 
                success: true, 
                message: "License activated successfully!" 
              }));
            } else {
              resolve(NextResponse.json({ 
                success: false, 
                message: parsed.message || "Activation failed. This key might have reached its limit." 
              }, { status: 403 }));
            }
          } catch (e) {
            resolve(NextResponse.json({ success: false, message: "Invalid response from license server." }, { status: 500 }));
          }
        });
      });

      req.on('error', () => resolve(NextResponse.json({ success: false, message: "Connection error." }, { status: 500 })));
      req.write(postData);
      req.end();
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

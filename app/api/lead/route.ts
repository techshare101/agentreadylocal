import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, eventId, fbclid, utm_campaign, utm_content, scanOnly, scanned_domain, scan_score, stage, product } = body || {};

    const cleanEmail = (email || '').trim().toLowerCase();
    const leadProduct = (product || 'agentready').trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    const currentStage = stage || (scanOnly ? 'scanned' : 'checkout_started');
    let finalStage = currentStage;

    let leadCaptured = false;

    // 1. Capture lead in Supabase BEFORE Stripe checkout session creation
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const db = createClient(supabaseUrl, supabaseServiceKey);

        // Stage Non-Regression: Preserve checkout_started if lead scans again later
        const { data: existing, error: selectError } = await db
          .from('leads')
          .select('stage')
          .eq('email', cleanEmail)
          .eq('product', leadProduct)
          .maybeSingle();

        if (selectError) {
          console.error('[CRITICAL] LEAD_STAGE_CHECK_FAILED:', selectError.message, selectError);
        }

        if (existing?.stage === 'checkout_started' && currentStage === 'scanned') {
          finalStage = 'checkout_started';
        }

        const { error: upsertError } = await db.from('leads').upsert(
          {
            email: cleanEmail,
            product: leadProduct,
            stage: finalStage,
            scanned_domain: scanned_domain || null,
            scan_score: typeof scan_score === 'number' ? scan_score : null,
            fbclid: fbclid || null,
            utm_campaign: utm_campaign || null,
            utm_content: utm_content || null,
            source: scanOnly ? 'meta_ad_scan' : 'meta_ad_checkout',
          },
          { onConflict: 'email,product' }
        );

        if (upsertError) {
          console.error('[CRITICAL] LEAD_CAPTURE_FAILED:', { email: cleanEmail, error: upsertError.message, details: upsertError });
        } else {
          leadCaptured = true;
        }
      } catch (dbErr: any) {
        console.error('[CRITICAL] LEAD_CAPTURE_EXCEPTION:', { email: cleanEmail, error: dbErr?.message || dbErr });
      }
    } else {
      console.error('[CRITICAL] LEAD_CAPTURE_SKIPPED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    if (scanOnly) {
      return NextResponse.json({ success: leadCaptured, leadCaptured });
    }

    // 2. Create Stripe Checkout Session
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = (process.env.SITE_URL || 'https://agentreadylocal-pi.vercel.app').replace(/\/$/, '');

    if (!stripeSecretKey) {
      // If Stripe secret key is missing, return fallback checkout URL or error
      const fallbackUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/7sY7sL9gL6gQ3Ft6qt3840n';
      return NextResponse.json({ checkoutUrl: fallbackUrl });
    }

    const stripe = new Stripe(stripeSecretKey);
    const priceId = process.env.STRIPE_PRICE_ID;

    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'AgentReady MedSpa — 100-Point Verified Audit',
                description: 'Complete 100-point AI-readiness verification report with screenshots and fix plan.',
              },
              unit_amount: 29700, // $297.00 USD
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: cleanEmail,
      success_url: `${siteUrl}/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?left=1`,
      metadata: {
        fbclid: fbclid || '',
        utm_campaign: utm_campaign || '',
        utm_content: utm_content || '',
        eventId: eventId || '',
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour session expiration for abandoned checkout triggers
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: any) {
    console.error('[API Lead Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Unable to open checkout session.' },
      { status: 500 }
    );
  }
}

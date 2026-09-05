import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      // Data may be empty or plain text
    }

    const { path, ms, depth, product } = data || {};
    const timingProduct = (product || 'agentready').trim().toLowerCase();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const db = createClient(supabaseUrl, supabaseServiceKey);
      const { error: insertError } = await db.from('page_timing').insert({
        path: path || '/',
        ms: typeof ms === 'number' ? ms : 0,
        depth: typeof depth === 'number' ? depth : 0,
        product: timingProduct,
      });

      if (insertError) {
        console.error('[CRITICAL] TIMING_CAPTURE_FAILED:', { error: insertError.message, details: insertError });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[API Timing Error]:', err);
    return NextResponse.json({ received: false, error: err.message }, { status: 500 });
  }
}

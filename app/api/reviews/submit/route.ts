import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic validation
  const { training_level, specialty, deanery, trust, year_of_review, months_completed } = body;
  if (!training_level || !specialty || !deanery || !trust) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find or create rotation
  let rotationId: string;
  const { data: existing } = await supabase
    .from('rotations')
    .select('id')
    .eq('specialty', specialty)
    .eq('deanery', deanery)
    .eq('trust', trust)
    .eq('training_level', training_level)
    .maybeSingle();

  if (existing) {
    rotationId = existing.id;
  } else {
    const { data: newRotation, error } = await supabase
      .from('rotations')
      .insert({
        specialty,
        deanery,
        trust,
        training_level,
        department: body.department || null,
        rotation_year: year_of_review ? parseInt(year_of_review) : null,
      })
      .select('id')
      .single();

    if (error || !newRotation) {
      return NextResponse.json({ error: 'Failed to save rotation' }, { status: 500 });
    }
    rotationId = newRotation.id;
  }

  const anon_token = randomUUID();
  const referral_code = generateReferralCode();

  // Insert review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      rotation_id: rotationId,
      anon_token,
      referral_code: body.referral_code || null,
      rating_overall: body.rating_overall || null,
      rating_teaching: body.rating_teaching || null,
      rating_consultant_support: body.rating_consultant_support || null,
      rating_operative_exposure: body.rating_operative_exposure || null,
      rating_workload: body.rating_workload || null,
      rating_rota_quality: body.rating_rota_quality || null,
      rating_wellbeing: body.rating_wellbeing || null,
      rating_career_value: body.rating_career_value || null,
      text_day_in_life: body.text_day_in_life || null,
      text_highlight: body.text_highlight || null,
      text_lowlight: body.text_lowlight || null,
      text_advice: body.text_advice || null,
      text_interview_tips: body.text_interview_tips || null,
      text_would_recommend: body.text_would_recommend || null,
      months_completed: body.months_completed ? parseInt(body.months_completed) : null,
      year_of_review: body.year_of_review ? parseInt(body.year_of_review) : null,
    })
    .select('id')
    .single();

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }

  // Handle referral
  if (body.referral_code) {
    await supabase.from('referrals').insert({
      referrer_code: body.referral_code,
      referee_review_id: review.id,
      payout_amount_pence: 300,
      payout_status: 'pending',
    });
  }

  return NextResponse.json({ success: true, referral_code });
}

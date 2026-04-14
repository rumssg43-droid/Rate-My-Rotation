export interface Rotation {
  id: string;
  specialty: string;
  training_level: string;
  deanery: string;
  trust: string;
  department?: string;
  rotation_year?: number;
  created_at: string;
}

export interface Review {
  id: string;
  rotation_id: string;
  anon_token: string;
  referral_code?: string;
  rating_overall?: number;
  rating_teaching?: number;
  rating_consultant_support?: number;
  rating_operative_exposure?: number;
  rating_workload?: number;
  rating_rota_quality?: number;
  rating_wellbeing?: number;
  rating_career_value?: number;
  text_day_in_life?: string;
  text_highlight?: string;
  text_lowlight?: string;
  text_advice?: string;
  text_interview_tips?: string;
  text_would_recommend?: string;
  months_completed?: number;
  year_of_review?: number;
  is_flagged: boolean;
  is_approved: boolean;
  created_at: string;
  rotation?: Rotation;
}

export interface AccessToken {
  id: string;
  token: string;
  stripe_payment_id?: string;
  deanery: string;
  specialty: string;
  amount_paid_pence?: number;
  expires_at?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_code: string;
  referee_review_id?: string;
  payout_amount_pence: number;
  payout_status: 'pending' | 'paid' | 'rejected';
  created_at: string;
}

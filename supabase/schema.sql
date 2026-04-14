-- Rotation catalogue (pre-seeded)
CREATE TABLE rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty TEXT NOT NULL,
  training_level TEXT NOT NULL,
  deanery TEXT NOT NULL,
  trust TEXT NOT NULL,
  department TEXT,
  rotation_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anonymous reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID REFERENCES rotations(id),
  anon_token TEXT NOT NULL,
  referral_code TEXT,
  rating_overall INT CHECK (rating_overall BETWEEN 1 AND 5),
  rating_teaching INT CHECK (rating_teaching BETWEEN 1 AND 5),
  rating_consultant_support INT CHECK (rating_consultant_support BETWEEN 1 AND 5),
  rating_operative_exposure INT CHECK (rating_operative_exposure BETWEEN 1 AND 5),
  rating_workload INT CHECK (rating_workload BETWEEN 1 AND 5),
  rating_rota_quality INT CHECK (rating_rota_quality BETWEEN 1 AND 5),
  rating_wellbeing INT CHECK (rating_wellbeing BETWEEN 1 AND 5),
  rating_career_value INT CHECK (rating_career_value BETWEEN 1 AND 5),
  text_day_in_life TEXT,
  text_highlight TEXT,
  text_lowlight TEXT,
  text_advice TEXT,
  text_interview_tips TEXT,
  text_would_recommend TEXT,
  months_completed INT,
  year_of_review INT,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment access tokens
CREATE TABLE access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  stripe_payment_id TEXT,
  deanery TEXT NOT NULL,
  specialty TEXT NOT NULL,
  amount_paid_pence INT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code TEXT NOT NULL,
  referee_review_id UUID REFERENCES reviews(id),
  payout_amount_pence INT DEFAULT 300,
  payout_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_rotation_id ON reviews(rotation_id);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX idx_access_tokens_token ON access_tokens(token);
CREATE INDEX idx_rotations_deanery_specialty ON rotations(deanery, specialty);

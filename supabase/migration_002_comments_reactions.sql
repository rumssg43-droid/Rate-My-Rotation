-- Comments left by paid users on reviews
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);

-- Agree / disagree reactions (one per user per review)
CREATE TABLE review_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction TEXT NOT NULL CHECK (reaction IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_reactions_review_id ON review_reactions(review_id);

-- Enable Row Level Security on all tables
ALTER TABLE rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;

-- rotations: anyone can read, only service role can write
CREATE POLICY "rotations_read" ON rotations FOR SELECT USING (true);

-- reviews: anyone can read approved reviews, only service role can insert/update/delete
CREATE POLICY "reviews_read_approved" ON reviews FOR SELECT USING (is_approved = true);

-- access_tokens: no direct access — all reads/writes go through service role in API routes
-- (no policies = blocked for anon/authenticated users)

-- referrals: no direct access
-- (no policies = blocked for anon/authenticated users)

-- review_comments: authenticated users can read unflagged comments, insert their own
CREATE POLICY "comments_read" ON review_comments FOR SELECT USING (is_flagged = false);
CREATE POLICY "comments_insert" ON review_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- review_reactions: authenticated users can read all, manage their own
CREATE POLICY "reactions_read" ON review_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON review_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_update" ON review_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON review_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

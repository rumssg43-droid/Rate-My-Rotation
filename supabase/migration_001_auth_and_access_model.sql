-- Add user accounts to access tokens
ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id ON access_tokens(user_id);

-- Replace specialty with training_level (access is per deanery + training pathway)
ALTER TABLE access_tokens RENAME COLUMN specialty TO training_level;

-- Add flag for full-deanery bundles (all training pathways, 2x price)
ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS is_deanery_bundle BOOLEAN DEFAULT FALSE;

-- Update index
DROP INDEX IF EXISTS idx_access_tokens_token;
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_tokens_token ON access_tokens(token);

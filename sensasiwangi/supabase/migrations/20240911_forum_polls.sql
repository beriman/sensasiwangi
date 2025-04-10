-- Create forum_polls table
CREATE TABLE IF NOT EXISTS forum_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id)
);

-- Create forum_poll_options table
CREATE TABLE IF NOT EXISTS forum_poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_poll_votes table
CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Add has_poll column to forum_threads
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS has_poll BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_forum_polls_thread_id ON forum_polls(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_poll_options_poll_id ON forum_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_forum_poll_votes_poll_id ON forum_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_forum_poll_votes_option_id ON forum_poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_forum_poll_votes_user_id ON forum_poll_votes(user_id);

-- Enable RLS on poll tables
ALTER TABLE forum_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for forum_polls
DROP POLICY IF EXISTS "Public read access for polls" ON forum_polls;
CREATE POLICY "Public read access for polls"
  ON forum_polls FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Thread authors can create polls" ON forum_polls;
CREATE POLICY "Thread authors can create polls"
  ON forum_polls FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM forum_threads WHERE id = thread_id
    )
  );

-- Create policies for forum_poll_options
DROP POLICY IF EXISTS "Public read access for poll options" ON forum_poll_options;
CREATE POLICY "Public read access for poll options"
  ON forum_poll_options FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Poll creators can add options" ON forum_poll_options;
CREATE POLICY "Poll creators can add options"
  ON forum_poll_options FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT t.user_id FROM forum_threads t
      JOIN forum_polls p ON t.id = p.thread_id
      WHERE p.id = poll_id
    )
  );

-- Create policies for forum_poll_votes
DROP POLICY IF EXISTS "Public read access for poll votes" ON forum_poll_votes;
CREATE POLICY "Public read access for poll votes"
  ON forum_poll_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON forum_poll_votes;
CREATE POLICY "Authenticated users can vote"
  ON forum_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON forum_poll_votes;
CREATE POLICY "Users can delete their own votes"
  ON forum_poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Add publication for realtime
alter publication supabase_realtime add table forum_polls;
alter publication supabase_realtime add table forum_poll_options;
alter publication supabase_realtime add table forum_poll_votes;
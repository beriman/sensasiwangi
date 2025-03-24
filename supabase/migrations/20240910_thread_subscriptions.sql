-- Create forum_follows table if it doesn't exist already
CREATE TABLE IF NOT EXISTS forum_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_notifications BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, thread_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS forum_follows_user_id_idx ON forum_follows(user_id);
CREATE INDEX IF NOT EXISTS forum_follows_thread_id_idx ON forum_follows(thread_id);

-- Enable row level security
ALTER TABLE forum_follows ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can manage their own follows" ON forum_follows;
CREATE POLICY "Users can manage their own follows"
  ON forum_follows
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read access to follows" ON forum_follows;
CREATE POLICY "Public read access to follows"
  ON forum_follows
  FOR SELECT
  USING (true);

-- Add to realtime publication
alter publication supabase_realtime add table forum_follows;

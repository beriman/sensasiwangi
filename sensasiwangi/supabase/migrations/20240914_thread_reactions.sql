-- Create the forum_reactions table
CREATE TABLE IF NOT EXISTS forum_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT thread_or_reply_required CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  ),
  CONSTRAINT unique_user_thread_reaction UNIQUE (user_id, thread_id, reaction),
  CONSTRAINT unique_user_reply_reaction UNIQUE (user_id, reply_id, reaction)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS forum_reactions_thread_id_idx ON forum_reactions(thread_id);
CREATE INDEX IF NOT EXISTS forum_reactions_reply_id_idx ON forum_reactions(reply_id);
CREATE INDEX IF NOT EXISTS forum_reactions_user_id_idx ON forum_reactions(user_id);

-- Enable RLS
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all reactions" ON forum_reactions;
CREATE POLICY "Users can view all reactions"
  ON forum_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add their own reactions" ON forum_reactions;
CREATE POLICY "Users can add their own reactions"
  ON forum_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON forum_reactions;
CREATE POLICY "Users can delete their own reactions"
  ON forum_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE forum_reactions;

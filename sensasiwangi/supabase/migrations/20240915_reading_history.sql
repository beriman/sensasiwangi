-- Create reading history table
CREATE TABLE IF NOT EXISTS forum_reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON forum_reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_thread_id ON forum_reading_history(thread_id);

-- Enable realtime for the reading history table
ALTER PUBLICATION supabase_realtime ADD TABLE forum_reading_history;

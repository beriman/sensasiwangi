-- Create forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum threads table
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('cendol', 'bata')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT thread_or_reply_check CHECK (
    (thread_id IS NULL AND reply_id IS NOT NULL) OR
    (thread_id IS NOT NULL AND reply_id IS NULL)
  ),
  CONSTRAINT unique_thread_vote UNIQUE (user_id, thread_id),
  CONSTRAINT unique_reply_vote UNIQUE (user_id, reply_id)
);

-- Add experience points column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;

-- Insert default categories
INSERT INTO forum_categories (name, description)
VALUES 
  ('Diskusi Perfumer', 'Diskusi umum tentang parfum dan pembuatan parfum'),
  ('Review Parfum', 'Ulasan dan penilaian parfum dari komunitas')
ON CONFLICT DO NOTHING;

-- Enable realtime for all tables
alter publication supabase_realtime add table forum_categories;
alter publication supabase_realtime add table forum_threads;
alter publication supabase_realtime add table forum_replies;
alter publication supabase_realtime add table forum_votes;
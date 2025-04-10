-- Add tables for forum enhancements

-- Table for thread tags
CREATE TABLE IF NOT EXISTS forum_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for thread tags
CREATE TABLE IF NOT EXISTS forum_thread_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, tag_id)
);

-- Table for thread bookmarks
CREATE TABLE IF NOT EXISTS forum_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Table for thread follows
CREATE TABLE IF NOT EXISTS forum_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Table for private messages
CREATE TABLE IF NOT EXISTS forum_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for notifications
CREATE TABLE IF NOT EXISTS forum_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'mention', 'vote', 'follow', 'message')),
  content TEXT NOT NULL,
  related_thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  related_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  related_message_id UUID REFERENCES forum_messages(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add fields to existing tables
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Add fields to forum_replies for mentions
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[];
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Add badges table
CREATE TABLE IF NOT EXISTS forum_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'purple',
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('threads', 'replies', 'votes', 'exp')),
  requirement_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for user badges
CREATE TABLE IF NOT EXISTS forum_user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES forum_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Table for thread reports
CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT thread_or_reply_report_check CHECK (
    (thread_id IS NULL AND reply_id IS NOT NULL) OR
    (thread_id IS NOT NULL AND reply_id IS NULL)
  )
);

-- Insert default tags
INSERT INTO forum_tags (name, color)
VALUES 
  ('Question', 'blue'),
  ('Discussion', 'purple'),
  ('Review', 'green'),
  ('Tutorial', 'amber'),
  ('News', 'red')
ON CONFLICT DO NOTHING;

-- Insert default badges
INSERT INTO forum_badges (name, description, icon, color, requirement_type, requirement_count)
VALUES
  ('Newbie Perfumer', 'Created your first thread', '🌱', 'green', 'threads', 1),
  ('Thread Starter', 'Created 5 threads', '📝', 'blue', 'threads', 5),
  ('Helpful Contributor', 'Received 10 cendol votes', '👍', 'purple', 'votes', 10),
  ('Perfumer of the Month', 'Most contributions in a month', '🏆', 'amber', 'exp', 100),
  ('Reviewer Expert', 'Posted 10 reviews with high votes', '⭐', 'yellow', 'votes', 20),
  ('Community Helper', 'Replied to 20 threads', '🤝', 'teal', 'replies', 20)
ON CONFLICT DO NOTHING;

-- Enable realtime for all new tables
alter publication supabase_realtime add table forum_tags;
alter publication supabase_realtime add table forum_thread_tags;
alter publication supabase_realtime add table forum_bookmarks;
alter publication supabase_realtime add table forum_follows;
alter publication supabase_realtime add table forum_messages;
alter publication supabase_realtime add table forum_notifications;
alter publication supabase_realtime add table forum_badges;
alter publication supabase_realtime add table forum_user_badges;
alter publication supabase_realtime add table forum_reports;

-- Create function to update last_activity_at on threads
CREATE OR REPLACE FUNCTION update_thread_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads
  SET last_activity_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity_at when a reply is added
DROP TRIGGER IF EXISTS update_thread_activity ON forum_replies;
CREATE TRIGGER update_thread_activity
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_activity();

-- Create function to create notifications for mentions
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mentioned_user_ids IS NOT NULL THEN
    FOREACH user_id IN ARRAY NEW.mentioned_user_ids
    LOOP
      INSERT INTO forum_notifications (user_id, type, content, related_thread_id, related_reply_id)
      VALUES (
        user_id,
        'mention',
        'You were mentioned in a reply',
        (SELECT thread_id FROM forum_replies WHERE id = NEW.id),
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mention notifications
DROP TRIGGER IF EXISTS create_mentions ON forum_replies;
CREATE TRIGGER create_mentions
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION create_mention_notifications();

-- Create function to create notifications for replies
CREATE OR REPLACE FUNCTION create_reply_notifications()
RETURNS TRIGGER AS $$
DECLARE
  thread_author_id UUID;
BEGIN
  -- Get thread author
  SELECT user_id INTO thread_author_id FROM forum_threads WHERE id = NEW.thread_id;
  
  -- Create notification for thread author (if not the same as reply author)
  IF thread_author_id != NEW.user_id THEN
    INSERT INTO forum_notifications (user_id, type, content, related_thread_id, related_reply_id)
    VALUES (
      thread_author_id,
      'reply',
      'Someone replied to your thread',
      NEW.thread_id,
      NEW.id
    );
  END IF;
  
  -- Create notifications for users following the thread
  INSERT INTO forum_notifications (user_id, type, content, related_thread_id, related_reply_id)
  SELECT 
    user_id,
    'follow',
    'New activity in a thread you follow',
    NEW.thread_id,
    NEW.id
  FROM forum_follows 
  WHERE thread_id = NEW.thread_id AND user_id != NEW.user_id AND user_id != thread_author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply notifications
DROP TRIGGER IF EXISTS create_replies ON forum_replies;
CREATE TRIGGER create_replies
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION create_reply_notifications();

-- Create function to create notifications for votes
CREATE OR REPLACE FUNCTION create_vote_notifications()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  thread_id_val UUID;
  content_type TEXT;
BEGIN
  -- Determine if vote is on thread or reply
  IF NEW.thread_id IS NOT NULL THEN
    SELECT user_id INTO content_author_id FROM forum_threads WHERE id = NEW.thread_id;
    thread_id_val := NEW.thread_id;
    content_type := 'thread';
  ELSE
    SELECT user_id INTO content_author_id FROM forum_replies WHERE id = NEW.reply_id;
    SELECT thread_id INTO thread_id_val FROM forum_replies WHERE id = NEW.reply_id;
    content_type := 'reply';
  END IF;
  
  -- Create notification for content author (if not the same as voter)
  IF content_author_id != NEW.user_id THEN
    INSERT INTO forum_notifications (user_id, type, content, related_thread_id, related_reply_id)
    VALUES (
      content_author_id,
      'vote',
      'Someone ' || CASE WHEN NEW.vote_type = 'cendol' THEN 'upvoted' ELSE 'downvoted' END || ' your ' || content_type,
      thread_id_val,
      NEW.reply_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote notifications
DROP TRIGGER IF EXISTS create_votes ON forum_votes;
CREATE TRIGGER create_votes
AFTER INSERT ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION create_vote_notifications();

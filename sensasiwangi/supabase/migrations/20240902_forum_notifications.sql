-- Create forum notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS forum_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'like', 'mention', 'level_up', 'badge')),
  content TEXT NOT NULL,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS forum_notifications_user_id_idx ON forum_notifications(user_id);
CREATE INDEX IF NOT EXISTS forum_notifications_is_read_idx ON forum_notifications(is_read);
CREATE INDEX IF NOT EXISTS forum_notifications_created_at_idx ON forum_notifications(created_at);

-- Enable row level security
ALTER TABLE forum_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own notifications";
CREATE POLICY "Users can view their own notifications"
ON forum_notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications";
CREATE POLICY "Users can update their own notifications"
ON forum_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table forum_notifications;

-- Create function to create notification when a reply is added
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get thread author
  DECLARE thread_author_id UUID;
  BEGIN
    SELECT user_id INTO thread_author_id FROM forum_threads WHERE id = NEW.thread_id;
    
    -- Only create notification if the reply author is not the thread author
    IF thread_author_id IS NOT NULL AND thread_author_id != NEW.user_id THEN
      INSERT INTO forum_notifications (
        user_id,
        type,
        content,
        thread_id,
        created_by
      ) VALUES (
        thread_author_id,
        'reply',
        'Seseorang membalas thread Anda',
        NEW.thread_id,
        NEW.user_id
      );
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply notifications
DROP TRIGGER IF EXISTS on_forum_reply_created ON forum_replies;
CREATE TRIGGER on_forum_reply_created
  AFTER INSERT ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION create_reply_notification();

-- Create function to create notification when a thread is liked
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get thread author
  DECLARE thread_author_id UUID;
  BEGIN
    SELECT user_id INTO thread_author_id FROM forum_threads WHERE id = NEW.thread_id;
    
    -- Only create notification if the like author is not the thread author
    IF thread_author_id IS NOT NULL AND thread_author_id != NEW.user_id THEN
      INSERT INTO forum_notifications (
        user_id,
        type,
        content,
        thread_id,
        created_by
      ) VALUES (
        thread_author_id,
        'like',
        'Seseorang menyukai thread Anda',
        NEW.thread_id,
        NEW.user_id
      );
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like notifications
DROP TRIGGER IF EXISTS on_forum_like_created ON forum_likes;
CREATE TRIGGER on_forum_like_created
  AFTER INSERT ON forum_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

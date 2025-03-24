-- Update forum_notifications table to include type and references
ALTER TABLE forum_notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'general';
ALTER TABLE forum_notifications ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE;
ALTER TABLE forum_notifications ADD COLUMN IF NOT EXISTS reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_forum_notifications_user_id ON forum_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_notifications_read ON forum_notifications(read);

-- Add username column to users table if it doesn't exist (for mentions)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE forum_notifications;

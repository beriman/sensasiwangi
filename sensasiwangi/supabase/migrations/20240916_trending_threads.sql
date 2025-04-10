-- Add last_activity_at column to forum_threads if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'forum_threads' AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE forum_threads ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index for faster trending calculations
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_activity ON forum_threads(last_activity_at);

-- Create function to update last_activity_at when a new reply is added
CREATE OR REPLACE FUNCTION update_thread_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forum_threads
    SET last_activity_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity_at when a new reply is added
DROP TRIGGER IF EXISTS update_thread_activity ON forum_replies;
CREATE TRIGGER update_thread_activity
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_activity();

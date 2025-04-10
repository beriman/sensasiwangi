-- Add new columns to users table for profile enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_custom_title BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- Add priority field to forum_reports table
ALTER TABLE forum_reports ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Add reputation_level field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_title TEXT;

-- Create a function to update user reputation title based on exp
CREATE OR REPLACE FUNCTION update_user_reputation_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reputation title based on exp points
  IF NEW.exp_points >= 2500 THEN
    NEW.reputation_title := 'Perfume Sage';
  ELSIF NEW.exp_points >= 1500 THEN
    NEW.reputation_title := 'Grandmaster';
  ELSIF NEW.exp_points >= 1000 THEN
    NEW.reputation_title := 'Master';
  ELSIF NEW.exp_points >= 600 THEN
    NEW.reputation_title := 'Expert';
  ELSIF NEW.exp_points >= 300 THEN
    NEW.reputation_title := 'Enthusiast';
  ELSIF NEW.exp_points >= 100 THEN
    NEW.reputation_title := 'Apprentice';
  ELSE
    NEW.reputation_title := 'Newbie';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update reputation title when exp changes
DROP TRIGGER IF EXISTS update_user_reputation_title_trigger ON users;
CREATE TRIGGER update_user_reputation_title_trigger
BEFORE INSERT OR UPDATE OF exp_points ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_reputation_title();

-- Update existing users' reputation titles
UPDATE users SET reputation_title = 
  CASE 
    WHEN exp_points >= 2500 THEN 'Perfume Sage'
    WHEN exp_points >= 1500 THEN 'Grandmaster'
    WHEN exp_points >= 1000 THEN 'Master'
    WHEN exp_points >= 600 THEN 'Expert'
    WHEN exp_points >= 300 THEN 'Enthusiast'
    WHEN exp_points >= 100 THEN 'Apprentice'
    ELSE 'Newbie'
  END;

-- Create table to track privilege usage
CREATE TABLE IF NOT EXISTS user_privilege_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  privilege TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB -- Additional context about how the privilege was used
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_privilege_usage_user_id ON user_privilege_usage(user_id);

-- Enable realtime for the new table
alter publication supabase_realtime add table user_privilege_usage;

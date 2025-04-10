-- Add exp_points, level, and title columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS exp_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Newbie';

-- Create function to calculate level based on exp_points
CREATE OR REPLACE FUNCTION calculate_level(exp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF exp_points < 100 THEN
    RETURN 1;
  ELSIF exp_points < 300 THEN
    RETURN 2;
  ELSIF exp_points < 600 THEN
    RETURN 3;
  ELSIF exp_points < 1000 THEN
    RETURN 4;
  ELSIF exp_points < 1500 THEN
    RETURN 5;
  ELSE
    RETURN 6;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to determine title based on level
CREATE OR REPLACE FUNCTION determine_title(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 'Newbie';
    WHEN 2 THEN RETURN 'Apprentice';
    WHEN 3 THEN RETURN 'Enthusiast';
    WHEN 4 THEN RETURN 'Expert';
    WHEN 5 THEN RETURN 'Master';
    WHEN 6 THEN RETURN 'Grandmaster';
    ELSE RETURN 'Unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level and title when exp_points changes
CREATE OR REPLACE FUNCTION update_level_and_title()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level(NEW.exp_points);
  NEW.title := determine_title(NEW.level);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_level_and_title ON users;
CREATE TRIGGER update_user_level_and_title
BEFORE UPDATE OF exp_points ON users
FOR EACH ROW
EXECUTE FUNCTION update_level_and_title();

-- Update existing users
UPDATE users SET level = calculate_level(exp_points), title = determine_title(calculate_level(exp_points));

-- Check if users table is already in the publication before adding it
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE users';
  END IF;
END
$$;
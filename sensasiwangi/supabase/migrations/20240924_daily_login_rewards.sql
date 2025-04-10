-- Create daily login rewards table
CREATE TABLE IF NOT EXISTS daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exp_awarded INTEGER NOT NULL DEFAULT 5,
  streak_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Create admin user notes table
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add profile approval column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add has_seen_tutorial column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN DEFAULT false;

-- Create function to handle daily login rewards
CREATE OR REPLACE FUNCTION handle_daily_login_reward()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  streak_count INTEGER := 1;
  bonus_exp INTEGER := 0;
  last_login_record RECORD;
BEGIN
  -- Check if user logged in yesterday to maintain streak
  SELECT * INTO last_login_record FROM daily_login_rewards 
  WHERE user_id = NEW.user_id 
  ORDER BY login_date DESC 
  LIMIT 1;
  
  IF FOUND AND last_login_record.login_date = yesterday THEN
    -- Continue streak
    streak_count := last_login_record.streak_count + 1;
    
    -- Award bonus EXP for streaks
    IF streak_count % 7 = 0 THEN -- Weekly bonus
      bonus_exp := 20;
    ELSIF streak_count % 30 = 0 THEN -- Monthly bonus
      bonus_exp := 100;
    ELSIF streak_count % 365 = 0 THEN -- Yearly bonus
      bonus_exp := 1000;
    END IF;
  END IF;
  
  -- Update the streak count and add bonus EXP
  NEW.streak_count := streak_count;
  NEW.exp_awarded := 5 + bonus_exp; -- Base 5 EXP + any bonus
  
  -- Update user's total EXP
  UPDATE users SET 
    exp_points = COALESCE(exp_points, 0) + NEW.exp_awarded,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily login rewards
CREATE TRIGGER daily_login_reward_trigger
BEFORE INSERT ON daily_login_rewards
FOR EACH ROW
EXECUTE FUNCTION handle_daily_login_reward();

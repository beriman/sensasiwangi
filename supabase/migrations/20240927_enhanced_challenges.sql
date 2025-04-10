-- Migration for enhanced challenges system

-- Add new fields to forum_challenges table
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'));
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'weekly' CHECK (category IN ('daily', 'weekly', 'monthly', 'seasonal', 'special'));
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0;
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS required_level INTEGER DEFAULT 1;
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS reward_badge_name VARCHAR(100);
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS reward_badge_icon VARCHAR(50);
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS reward_badge_color VARCHAR(50);
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE forum_challenges ADD COLUMN IF NOT EXISTS tags JSONB;

-- Add new fields to forum_user_challenges table
ALTER TABLE forum_user_challenges ADD COLUMN IF NOT EXISTS progress_data JSONB;
ALTER TABLE forum_user_challenges ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE forum_user_challenges ADD COLUMN IF NOT EXISTS reward_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_user_challenges ADD COLUMN IF NOT EXISTS reward_claimed_at TIMESTAMP WITH TIME ZONE;

-- Create challenge categories table
CREATE TABLE IF NOT EXISTS forum_challenge_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default challenge categories
INSERT INTO forum_challenge_categories (name, description, icon, color)
VALUES
  ('Daily', 'Challenges that reset every day', '📅', 'bg-blue-100 text-blue-800'),
  ('Weekly', 'Challenges that reset every week', '🗓️', 'bg-green-100 text-green-800'),
  ('Monthly', 'Challenges that reset every month', '📆', 'bg-purple-100 text-purple-800'),
  ('Seasonal', 'Special challenges for seasonal events', '🍂', 'bg-amber-100 text-amber-800'),
  ('Special', 'One-time special challenges', '✨', 'bg-pink-100 text-pink-800')
ON CONFLICT (name) DO NOTHING;

-- Create challenge templates table for recurring challenges
CREATE TABLE IF NOT EXISTS forum_challenge_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL CHECK (challenge_type IN ('thread', 'reply', 'vote', 'badge', 'exp', 'special')),
  target_count INTEGER NOT NULL,
  reward_exp INTEGER NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('daily', 'weekly', 'monthly', 'seasonal', 'special')),
  required_level INTEGER DEFAULT 1,
  reward_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  reward_badge_name VARCHAR(100),
  reward_badge_icon VARCHAR(50),
  reward_badge_color VARCHAR(50),
  image_url VARCHAR(255),
  tags JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample challenge templates
INSERT INTO forum_challenge_templates (
  title, 
  description, 
  challenge_type, 
  target_count, 
  reward_exp, 
  difficulty, 
  category, 
  required_level,
  reward_badge_name,
  reward_badge_icon,
  reward_badge_color,
  tags
)
VALUES
  -- Daily challenges
  (
    'Daily Poster', 
    'Create a new thread today', 
    'thread', 
    1, 
    25, 
    'easy', 
    'daily', 
    1,
    'Daily Contributor',
    '📝',
    'bg-blue-100 text-blue-800',
    '["daily", "content"]'
  ),
  (
    'Daily Helper', 
    'Reply to 3 threads today', 
    'reply', 
    3, 
    25, 
    'easy', 
    'daily', 
    1,
    'Daily Helper',
    '🤝',
    'bg-blue-100 text-blue-800',
    '["daily", "community"]'
  ),
  (
    'Daily Appreciator', 
    'Give 5 cendols to helpful posts today', 
    'cendol_given', 
    5, 
    25, 
    'easy', 
    'daily', 
    1,
    'Daily Appreciator',
    '👍',
    'bg-blue-100 text-blue-800',
    '["daily", "community"]'
  ),
  
  -- Weekly challenges
  (
    'Weekly Content Creator', 
    'Create 3 new threads this week', 
    'thread', 
    3, 
    75, 
    'medium', 
    'weekly', 
    5,
    'Weekly Creator',
    '📚',
    'bg-green-100 text-green-800',
    '["weekly", "content"]'
  ),
  (
    'Weekly Community Supporter', 
    'Reply to 10 threads this week', 
    'reply', 
    10, 
    75, 
    'medium', 
    'weekly', 
    5,
    'Weekly Supporter',
    '🛡️',
    'bg-green-100 text-green-800',
    '["weekly", "community"]'
  ),
  (
    'Weekly Perfume Reviewer', 
    'Write a detailed perfume review this week', 
    'special', 
    1, 
    100, 
    'medium', 
    'weekly', 
    10,
    'Perfume Reviewer',
    '👃',
    'bg-green-100 text-green-800',
    '["weekly", "content", "perfume"]'
  ),
  
  -- Monthly challenges
  (
    'Monthly Content Master', 
    'Create 10 new threads this month', 
    'thread', 
    10, 
    200, 
    'hard', 
    'monthly', 
    15,
    'Monthly Master',
    '📜',
    'bg-purple-100 text-purple-800',
    '["monthly", "content"]'
  ),
  (
    'Monthly Community Pillar', 
    'Reply to 30 threads this month', 
    'reply', 
    30, 
    200, 
    'hard', 
    'monthly', 
    15,
    'Community Pillar',
    '🏛️',
    'bg-purple-100 text-purple-800',
    '["monthly", "community"]'
  ),
  (
    'Monthly Recognition', 
    'Receive 20 cendols on your content this month', 
    'cendol_received', 
    20, 
    250, 
    'hard', 
    'monthly', 
    20,
    'Community Favorite',
    '🌟',
    'bg-purple-100 text-purple-800',
    '["monthly", "reputation"]'
  ),
  
  -- Special challenges
  (
    'Perfume Collection Showcase', 
    'Create a thread showcasing your perfume collection with photos', 
    'special', 
    1, 
    300, 
    'expert', 
    'special', 
    25,
    'Collection Curator',
    '🧪',
    'bg-pink-100 text-pink-800',
    '["special", "content", "perfume"]'
  ),
  (
    'Perfume Review Series', 
    'Create a series of 5 related perfume reviews', 
    'special', 
    5, 
    500, 
    'expert', 
    'special', 
    30,
    'Review Master',
    '📊',
    'bg-pink-100 text-pink-800',
    '["special", "content", "perfume"]'
  )
ON CONFLICT DO NOTHING;

-- Create function to generate challenges from templates
CREATE OR REPLACE FUNCTION generate_challenges_from_templates()
RETURNS void AS $$
DECLARE
  template RECORD;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
  challenge_exists BOOLEAN;
BEGIN
  -- Set dates based on current time
  start_date := NOW();
  
  -- Process each active template
  FOR template IN 
    SELECT * FROM forum_challenge_templates 
    WHERE is_active = TRUE
  LOOP
    -- Set end date based on category
    IF template.category = 'daily' THEN
      end_date := start_date + INTERVAL '1 day';
    ELSIF template.category = 'weekly' THEN
      end_date := start_date + INTERVAL '7 days';
    ELSIF template.category = 'monthly' THEN
      end_date := start_date + INTERVAL '30 days';
    ELSIF template.category = 'seasonal' THEN
      end_date := start_date + INTERVAL '90 days';
    ELSE -- special
      end_date := start_date + INTERVAL '30 days';
    END IF;
    
    -- Check if a similar challenge already exists and is active
    SELECT EXISTS (
      SELECT 1 
      FROM forum_challenges 
      WHERE title = template.title 
      AND end_date > NOW()
    ) INTO challenge_exists;
    
    -- Only create if no active challenge exists
    IF NOT challenge_exists THEN
      INSERT INTO forum_challenges (
        title,
        description,
        challenge_type,
        target_count,
        reward_exp,
        reward_badge_id,
        start_date,
        end_date,
        difficulty,
        category,
        required_level,
        reward_badge_name,
        reward_badge_icon,
        reward_badge_color,
        image_url,
        tags
      )
      VALUES (
        template.title,
        template.description,
        template.challenge_type,
        template.target_count,
        template.reward_exp,
        template.reward_badge_id,
        start_date,
        end_date,
        template.difficulty,
        template.category,
        template.required_level,
        template.reward_badge_name,
        template.reward_badge_icon,
        template.reward_badge_color,
        template.image_url,
        template.tags
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update challenge progress
CREATE OR REPLACE FUNCTION check_and_update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge RECORD;
  user_challenge RECORD;
  user_level INTEGER;
  thread_count INTEGER;
  reply_count INTEGER;
  cendol_received INTEGER;
  cendol_given INTEGER;
  current_count INTEGER;
  is_completed BOOLEAN;
BEGIN
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = NEW.user_id;
  
  -- Process each active challenge
  FOR challenge IN 
    SELECT * FROM forum_challenges 
    WHERE end_date > NOW() 
    AND required_level <= user_level
  LOOP
    -- Check if user is already participating in this challenge
    SELECT * INTO user_challenge 
    FROM forum_user_challenges 
    WHERE user_id = NEW.user_id AND challenge_id = challenge.id;
    
    -- If not participating, create a new entry
    IF user_challenge IS NULL THEN
      INSERT INTO forum_user_challenges (
        user_id,
        challenge_id,
        current_count,
        is_completed,
        progress_data,
        last_progress_update
      )
      VALUES (
        NEW.user_id,
        challenge.id,
        0,
        FALSE,
        '{}',
        NOW()
      )
      RETURNING * INTO user_challenge;
    END IF;
    
    -- Calculate current progress based on challenge type
    current_count := user_challenge.current_count;
    
    IF challenge.challenge_type = 'thread' AND TG_TABLE_NAME = 'forum_threads' THEN
      -- Count threads created since the challenge started
      SELECT COUNT(*) INTO thread_count 
      FROM forum_threads 
      WHERE user_id = NEW.user_id 
      AND created_at >= challenge.start_date;
      
      current_count := thread_count;
    ELSIF challenge.challenge_type = 'reply' AND TG_TABLE_NAME = 'forum_replies' THEN
      -- Count replies created since the challenge started
      SELECT COUNT(*) INTO reply_count 
      FROM forum_replies 
      WHERE user_id = NEW.user_id 
      AND created_at >= challenge.start_date;
      
      current_count := reply_count;
    ELSIF challenge.challenge_type = 'cendol_received' AND TG_TABLE_NAME = 'forum_votes' THEN
      -- Count cendols received since the challenge started
      SELECT COUNT(*) INTO cendol_received 
      FROM forum_votes 
      WHERE vote_type = 'cendol' 
      AND created_at >= challenge.start_date
      AND (
        thread_id IN (SELECT id FROM forum_threads WHERE user_id = NEW.user_id) OR
        reply_id IN (SELECT id FROM forum_replies WHERE user_id = NEW.user_id)
      );
      
      current_count := cendol_received;
    ELSIF challenge.challenge_type = 'cendol_given' AND TG_TABLE_NAME = 'forum_votes' THEN
      -- Count cendols given since the challenge started
      SELECT COUNT(*) INTO cendol_given 
      FROM forum_votes 
      WHERE user_id = NEW.user_id 
      AND vote_type = 'cendol' 
      AND created_at >= challenge.start_date;
      
      current_count := cendol_given;
    END IF;
    
    -- Check if challenge is completed
    is_completed := current_count >= challenge.target_count;
    
    -- Update user challenge progress
    UPDATE forum_user_challenges
    SET 
      current_count = current_count,
      is_completed = is_completed,
      completed_at = CASE WHEN is_completed AND user_challenge.completed_at IS NULL THEN NOW() ELSE user_challenge.completed_at END,
      last_progress_update = NOW()
    WHERE user_id = NEW.user_id AND challenge_id = challenge.id;
    
    -- If newly completed, update challenge participants count
    IF is_completed AND NOT user_challenge.is_completed THEN
      UPDATE forum_challenges
      SET participants_count = participants_count + 1
      WHERE id = challenge.id;
      
      -- Award XP to user
      UPDATE auth.users
      SET exp_points = exp_points + challenge.reward_exp
      WHERE id = NEW.user_id;
      
      -- If challenge has a badge reward, award it
      IF challenge.reward_badge_id IS NOT NULL THEN
        INSERT INTO forum_user_badges (user_id, badge_id)
        VALUES (NEW.user_id, challenge.reward_badge_id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to check challenge progress on relevant actions
CREATE TRIGGER check_challenge_progress_on_thread_create
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION check_and_update_challenge_progress();

CREATE TRIGGER check_challenge_progress_on_reply_create
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION check_and_update_challenge_progress();

CREATE TRIGGER check_challenge_progress_on_vote_create
AFTER INSERT ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION check_and_update_challenge_progress();

-- Create a scheduled job to generate challenges (this would be set up in Supabase)
-- This is just a placeholder - you would need to set up a cron job in Supabase
COMMENT ON FUNCTION generate_challenges_from_templates() IS 'Run this daily to generate new challenges from templates';

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_challenge_categories;
ALTER publication supabase_realtime ADD TABLE forum_challenge_templates;

-- Generate initial challenges
SELECT generate_challenges_from_templates();

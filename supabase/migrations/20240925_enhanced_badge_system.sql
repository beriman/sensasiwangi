-- Migration for enhanced badge system

-- Add new fields to forum_badges table
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS is_limited_time BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';
ALTER TABLE forum_badges ADD COLUMN IF NOT EXISTS prerequisites JSONB;

-- Create badge categories table
CREATE TABLE IF NOT EXISTS forum_badge_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default badge categories
INSERT INTO forum_badge_categories (name, description, icon, color)
VALUES
  ('Participation', 'Badges earned through general participation in the forum', '🏆', 'bg-blue-100 text-blue-800'),
  ('Content Creation', 'Badges earned by creating threads and content', '📝', 'bg-green-100 text-green-800'),
  ('Community Support', 'Badges earned by helping other members', '🤝', 'bg-purple-100 text-purple-800'),
  ('Recognition', 'Badges earned through receiving upvotes and recognition', '👍', 'bg-amber-100 text-amber-800'),
  ('Special Events', 'Limited-time badges from special events', '✨', 'bg-pink-100 text-pink-800'),
  ('Achievements', 'Badges earned by completing specific achievements', '🎯', 'bg-red-100 text-red-800')
ON CONFLICT (name) DO NOTHING;

-- Add more complex badges
INSERT INTO forum_badges (
  name, 
  description, 
  icon, 
  color, 
  requirement_type, 
  requirement_count, 
  tier, 
  category, 
  rarity, 
  is_secret
)
VALUES
  -- Tier 1 Content Creation Badges
  ('Thread Starter', 'Create your first thread', '📝', 'bg-green-100 text-green-800', 'threads', 1, 1, 'Content Creation', 'common', FALSE),
  ('Content Creator', 'Create 10 threads', '📚', 'bg-green-200 text-green-800', 'threads', 10, 2, 'Content Creation', 'uncommon', FALSE),
  ('Prolific Author', 'Create 25 threads', '📖', 'bg-green-300 text-green-900', 'threads', 25, 3, 'Content Creation', 'rare', FALSE),
  ('Master Writer', 'Create 50 threads', '✒️', 'bg-green-400 text-green-900', 'threads', 50, 4, 'Content Creation', 'epic', FALSE),
  ('Legendary Author', 'Create 100 threads', '📜', 'bg-green-500 text-white', 'threads', 100, 5, 'Content Creation', 'legendary', FALSE),
  
  -- Community Support Badges
  ('First Reply', 'Post your first reply', '💬', 'bg-purple-100 text-purple-800', 'replies', 1, 1, 'Community Support', 'common', FALSE),
  ('Helpful Member', 'Post 25 replies', '🙋', 'bg-purple-200 text-purple-800', 'replies', 25, 2, 'Community Support', 'uncommon', FALSE),
  ('Support Pillar', 'Post 100 replies', '🏛️', 'bg-purple-300 text-purple-900', 'replies', 100, 3, 'Community Support', 'rare', FALSE),
  ('Community Guardian', 'Post 250 replies', '🛡️', 'bg-purple-400 text-purple-900', 'replies', 250, 4, 'Community Support', 'epic', FALSE),
  ('Community Legend', 'Post 500 replies', '👑', 'bg-purple-500 text-white', 'replies', 500, 5, 'Community Support', 'legendary', FALSE),
  
  -- Recognition Badges
  ('First Upvote', 'Receive your first cendol', '👍', 'bg-amber-100 text-amber-800', 'cendol_received', 1, 1, 'Recognition', 'common', FALSE),
  ('Rising Star', 'Receive 10 cendols', '⭐', 'bg-amber-200 text-amber-800', 'cendol_received', 10, 2, 'Recognition', 'uncommon', FALSE),
  ('Popular Contributor', 'Receive 50 cendols', '🌟', 'bg-amber-300 text-amber-900', 'cendol_received', 50, 3, 'Recognition', 'rare', FALSE),
  ('Community Favorite', 'Receive 100 cendols', '💫', 'bg-amber-400 text-amber-900', 'cendol_received', 100, 4, 'Recognition', 'epic', FALSE),
  ('Community Idol', 'Receive 250 cendols', '🏆', 'bg-amber-500 text-white', 'cendol_received', 250, 5, 'Recognition', 'legendary', FALSE),
  
  -- Experience Badges
  ('Beginner', 'Reach level 5', '🌱', 'bg-blue-100 text-blue-800', 'level', 5, 1, 'Participation', 'common', FALSE),
  ('Intermediate', 'Reach level 10', '🌿', 'bg-blue-200 text-blue-800', 'level', 10, 2, 'Participation', 'uncommon', FALSE),
  ('Advanced', 'Reach level 20', '🌲', 'bg-blue-300 text-blue-900', 'level', 20, 3, 'Participation', 'rare', FALSE),
  ('Expert', 'Reach level 30', '🏔️', 'bg-blue-400 text-blue-900', 'level', 30, 4, 'Participation', 'epic', FALSE),
  ('Master', 'Reach level 50', '🌋', 'bg-blue-500 text-white', 'level', 50, 5, 'Participation', 'legendary', FALSE),
  
  -- Special Badges
  ('Early Adopter', 'Joined during the beta period', '🚀', 'bg-pink-100 text-pink-800', 'special', 1, 2, 'Special Events', 'rare', FALSE),
  ('Bug Hunter', 'Reported a significant bug', '🐛', 'bg-pink-200 text-pink-800', 'special', 1, 3, 'Special Events', 'rare', TRUE),
  ('Perfume Connoisseur', 'Created 10 high-quality perfume reviews', '🧪', 'bg-pink-300 text-pink-900', 'special', 10, 4, 'Special Events', 'epic', FALSE),
  ('Sensasiwangi Pioneer', 'One of the first 100 members', '🏁', 'bg-pink-400 text-pink-900', 'special', 1, 4, 'Special Events', 'epic', TRUE),
  ('Perfume Maestro', 'Recognized expert in perfumery', '👃', 'bg-pink-500 text-white', 'special', 1, 5, 'Special Events', 'legendary', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create achievements table
CREATE TABLE IF NOT EXISTS forum_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('content', 'community', 'reputation', 'special')),
  icon VARCHAR(50),
  color VARCHAR(50) DEFAULT 'bg-gray-100',
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_count INTEGER NOT NULL,
  reward_exp INTEGER NOT NULL DEFAULT 0,
  reward_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user achievements junction table
CREATE TABLE IF NOT EXISTS forum_user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES forum_achievements(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_badge_categories;
ALTER publication supabase_realtime ADD TABLE forum_achievements;
ALTER publication supabase_realtime ADD TABLE forum_user_achievements;

-- Update the check_and_award_badges function to handle more badge types
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
  user_stat RECORD;
  thread_count INTEGER;
  reply_count INTEGER;
  cendol_received INTEGER;
  cendol_given INTEGER;
  user_level INTEGER;
  user_exp INTEGER;
BEGIN
  -- Get user stats
  SELECT level, exp_points INTO user_level, user_exp FROM auth.users WHERE id = NEW.user_id;
  
  -- Count threads
  SELECT COUNT(*) INTO thread_count 
  FROM forum_threads 
  WHERE user_id = NEW.user_id;
  
  -- Count replies
  SELECT COUNT(*) INTO reply_count 
  FROM forum_replies 
  WHERE user_id = NEW.user_id;
  
  -- Count cendols received
  SELECT COUNT(*) INTO cendol_received 
  FROM forum_votes 
  WHERE vote_type = 'cendol' AND (
    thread_id IN (SELECT id FROM forum_threads WHERE user_id = NEW.user_id) OR
    reply_id IN (SELECT id FROM forum_replies WHERE user_id = NEW.user_id)
  );
  
  -- Count cendols given
  SELECT COUNT(*) INTO cendol_given 
  FROM forum_votes 
  WHERE user_id = NEW.user_id AND vote_type = 'cendol';
  
  -- Check level badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'level' AND requirement_count <= user_level
  LOOP
    -- Insert badge if not already awarded
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  -- Check exp badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'exp' AND requirement_count <= user_exp
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  -- Check thread badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'threads' AND requirement_count <= thread_count
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  -- Check reply badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'replies' AND requirement_count <= reply_count
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  -- Check cendol received badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'cendol_received' AND requirement_count <= cendol_received
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  -- Check cendol given badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE requirement_type = 'cendol_given' AND requirement_count <= cendol_given
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert sample achievements
INSERT INTO forum_achievements (
  title, 
  description, 
  category, 
  icon, 
  color, 
  tier, 
  requirement_type, 
  requirement_count, 
  reward_exp
)
VALUES
  -- Content achievements
  ('First Post', 'Create your first thread in the forum', 'content', '📝', 'bg-green-100', 1, 'threads', 1, 10),
  ('Content Creator', 'Create 10 threads in the forum', 'content', '📚', 'bg-green-200', 2, 'threads', 10, 50),
  ('Prolific Author', 'Create 25 threads in the forum', 'content', '📖', 'bg-green-300', 3, 'threads', 25, 100),
  ('Master Writer', 'Create 50 threads in the forum', 'content', '✒️', 'bg-green-400', 4, 'threads', 50, 200),
  ('Legendary Author', 'Create 100 threads in the forum', 'content', '📜', 'bg-green-500', 5, 'threads', 100, 500),
  
  -- Community achievements
  ('First Reply', 'Post your first reply to help someone', 'community', '💬', 'bg-purple-100', 1, 'replies', 1, 10),
  ('Helpful Member', 'Post 25 replies to help others', 'community', '🙋', 'bg-purple-200', 2, 'replies', 25, 50),
  ('Support Pillar', 'Post 100 replies to help others', 'community', '🏛️', 'bg-purple-300', 3, 'replies', 100, 100),
  ('Community Guardian', 'Post 250 replies to help others', 'community', '🛡️', 'bg-purple-400', 4, 'replies', 250, 200),
  ('Community Legend', 'Post 500 replies to help others', 'community', '👑', 'bg-purple-500', 5, 'replies', 500, 500),
  
  -- Reputation achievements
  ('First Recognition', 'Receive your first cendol from another member', 'reputation', '👍', 'bg-amber-100', 1, 'cendol_received', 1, 10),
  ('Rising Star', 'Receive 10 cendols from other members', 'reputation', '⭐', 'bg-amber-200', 2, 'cendol_received', 10, 50),
  ('Popular Contributor', 'Receive 50 cendols from other members', 'reputation', '🌟', 'bg-amber-300', 3, 'cendol_received', 50, 100),
  ('Community Favorite', 'Receive 100 cendols from other members', 'reputation', '💫', 'bg-amber-400', 4, 'cendol_received', 100, 200),
  ('Community Idol', 'Receive 250 cendols from other members', 'reputation', '🏆', 'bg-amber-500', 5, 'cendol_received', 250, 500)
ON CONFLICT DO NOTHING;

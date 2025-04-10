-- Migration for achievements system

-- Create achievements table if it doesn't exist yet
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

-- Create user achievements junction table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS forum_user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES forum_achievements(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Insert content creation achievements
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
  -- Thread creation achievements
  ('First Thread', 'Create your first thread in the forum', 'content', '📝', 'bg-green-100', 1, 'threads', 1, 10),
  ('Thread Enthusiast', 'Create 5 threads in the forum', 'content', '📚', 'bg-green-200', 1, 'threads', 5, 25),
  ('Thread Creator', 'Create 10 threads in the forum', 'content', '📚', 'bg-green-200', 2, 'threads', 10, 50),
  ('Thread Master', 'Create 25 threads in the forum', 'content', '📖', 'bg-green-300', 3, 'threads', 25, 100),
  ('Thread Expert', 'Create 50 threads in the forum', 'content', '✒️', 'bg-green-400', 4, 'threads', 50, 200),
  ('Thread Legend', 'Create 100 threads in the forum', 'content', '📜', 'bg-green-500', 5, 'threads', 100, 500),
  
  -- Perfume review achievements
  ('First Review', 'Create your first perfume review thread', 'content', '👃', 'bg-green-100', 1, 'special', 1, 15),
  ('Perfume Reviewer', 'Create 5 perfume review threads', 'content', '🧪', 'bg-green-200', 2, 'special', 5, 75),
  ('Perfume Critic', 'Create 10 perfume review threads', 'content', '🧪', 'bg-green-300', 3, 'special', 10, 150),
  ('Perfume Connoisseur', 'Create 25 perfume review threads', 'content', '🧪', 'bg-green-400', 4, 'special', 25, 300),
  ('Perfume Maestro', 'Create 50 perfume review threads', 'content', '🧪', 'bg-green-500', 5, 'special', 50, 600),
  
  -- Thread with images achievements
  ('Visual Contributor', 'Create a thread with images', 'content', '🖼️', 'bg-green-100', 1, 'special', 1, 15),
  ('Visual Storyteller', 'Create 5 threads with images', 'content', '🖼️', 'bg-green-200', 2, 'special', 5, 75),
  ('Visual Expert', 'Create 10 threads with images', 'content', '🖼️', 'bg-green-300', 3, 'special', 10, 150)
ON CONFLICT DO NOTHING;

-- Insert community support achievements
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
  -- Reply achievements
  ('First Reply', 'Post your first reply to help someone', 'community', '💬', 'bg-purple-100', 1, 'replies', 1, 10),
  ('Helpful Member', 'Post 10 replies to help others', 'community', '🙋', 'bg-purple-200', 1, 'replies', 10, 25),
  ('Active Responder', 'Post 25 replies to help others', 'community', '🙋', 'bg-purple-200', 2, 'replies', 25, 50),
  ('Support Pillar', 'Post 50 replies to help others', 'community', '🏛️', 'bg-purple-300', 3, 'replies', 50, 100),
  ('Community Guardian', 'Post 100 replies to help others', 'community', '🛡️', 'bg-purple-400', 4, 'replies', 100, 200),
  ('Community Legend', 'Post 250 replies to help others', 'community', '👑', 'bg-purple-500', 5, 'replies', 250, 500),
  
  -- Quick responder achievements
  ('Quick Responder', 'Reply to a thread within 5 minutes of creation', 'community', '⚡', 'bg-purple-100', 1, 'special', 1, 15),
  ('Lightning Fast', 'Reply to 5 threads within 5 minutes of creation', 'community', '⚡', 'bg-purple-200', 2, 'special', 5, 75),
  
  -- Thread starter and responder
  ('Full Participant', 'Create a thread and reply to 5 other threads', 'community', '🔄', 'bg-purple-200', 2, 'special', 1, 50),
  ('Community Builder', 'Create 5 threads and reply to 25 other threads', 'community', '🔄', 'bg-purple-300', 3, 'special', 1, 100)
ON CONFLICT DO NOTHING;

-- Insert reputation achievements
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
  -- Cendol received achievements
  ('First Recognition', 'Receive your first cendol from another member', 'reputation', '👍', 'bg-amber-100', 1, 'cendol_received', 1, 10),
  ('Appreciated', 'Receive 5 cendols from other members', 'reputation', '👍', 'bg-amber-100', 1, 'cendol_received', 5, 25),
  ('Rising Star', 'Receive 10 cendols from other members', 'reputation', '⭐', 'bg-amber-200', 2, 'cendol_received', 10, 50),
  ('Popular Contributor', 'Receive 25 cendols from other members', 'reputation', '🌟', 'bg-amber-300', 3, 'cendol_received', 25, 100),
  ('Community Favorite', 'Receive 50 cendols from other members', 'reputation', '💫', 'bg-amber-400', 4, 'cendol_received', 50, 200),
  ('Community Idol', 'Receive 100 cendols from other members', 'reputation', '🏆', 'bg-amber-500', 5, 'cendol_received', 100, 500),
  
  -- Cendol given achievements
  ('First Support', 'Give your first cendol to another member', 'reputation', '🤝', 'bg-amber-100', 1, 'cendol_given', 1, 10),
  ('Supporter', 'Give 5 cendols to other members', 'reputation', '🤝', 'bg-amber-100', 1, 'cendol_given', 5, 25),
  ('Generous', 'Give 10 cendols to other members', 'reputation', '🎁', 'bg-amber-200', 2, 'cendol_given', 10, 50),
  ('Very Generous', 'Give 25 cendols to other members', 'reputation', '🎁', 'bg-amber-300', 3, 'cendol_given', 25, 100),
  ('Extremely Generous', 'Give 50 cendols to other members', 'reputation', '🎁', 'bg-amber-400', 4, 'cendol_given', 50, 200),
  ('Philanthropist', 'Give 100 cendols to other members', 'reputation', '🎁', 'bg-amber-500', 5, 'cendol_given', 100, 500),
  
  -- Experience achievements
  ('Level 5', 'Reach level 5 in the forum', 'reputation', '🌱', 'bg-amber-100', 1, 'level', 5, 25),
  ('Level 10', 'Reach level 10 in the forum', 'reputation', '🌿', 'bg-amber-200', 2, 'level', 10, 50),
  ('Level 20', 'Reach level 20 in the forum', 'reputation', '🌲', 'bg-amber-300', 3, 'level', 20, 100),
  ('Level 30', 'Reach level 30 in the forum', 'reputation', '🏔️', 'bg-amber-400', 4, 'level', 30, 200),
  ('Level 50', 'Reach level 50 in the forum', 'reputation', '🌋', 'bg-amber-500', 5, 'level', 50, 500)
ON CONFLICT DO NOTHING;

-- Insert special achievements
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
  -- Special achievements
  ('Early Adopter', 'Join Sensasiwangi during the beta period', 'special', '🚀', 'bg-pink-100', 2, 'special', 1, 50),
  ('Bug Hunter', 'Report a significant bug that gets fixed', 'special', '🐛', 'bg-pink-200', 3, 'special', 1, 100),
  ('Feature Suggester', 'Suggest a feature that gets implemented', 'special', '💡', 'bg-pink-300', 3, 'special', 1, 100),
  ('Sensasiwangi Pioneer', 'One of the first 100 members to join', 'special', '🏁', 'bg-pink-400', 4, 'special', 1, 200),
  ('Challenge Champion', 'Complete 5 community challenges', 'special', '🏆', 'bg-pink-300', 3, 'special', 5, 150),
  ('Challenge Master', 'Complete 10 community challenges', 'special', '🏆', 'bg-pink-400', 4, 'special', 10, 300),
  ('Challenge Legend', 'Complete 25 community challenges', 'special', '🏆', 'bg-pink-500', 5, 'special', 25, 600),
  ('Badge Collector', 'Earn 10 different badges', 'special', '🎖️', 'bg-pink-300', 3, 'special', 10, 150),
  ('Badge Enthusiast', 'Earn 25 different badges', 'special', '🎖️', 'bg-pink-400', 4, 'special', 25, 300),
  ('Badge Master', 'Earn 50 different badges', 'special', '🎖️', 'bg-pink-500', 5, 'special', 50, 600)
ON CONFLICT DO NOTHING;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_stat RECORD;
  thread_count INTEGER;
  reply_count INTEGER;
  cendol_received INTEGER;
  cendol_given INTEGER;
  user_level INTEGER;
  user_exp INTEGER;
  badge_count INTEGER;
  challenge_count INTEGER;
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
  
  -- Count badges
  SELECT COUNT(*) INTO badge_count
  FROM forum_user_badges
  WHERE user_id = NEW.user_id;
  
  -- Count completed challenges
  SELECT COUNT(*) INTO challenge_count
  FROM forum_user_challenges
  WHERE user_id = NEW.user_id AND is_completed = TRUE;
  
  -- Check thread achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE requirement_type = 'threads' AND requirement_count <= thread_count
  LOOP
    -- Insert achievement if not already awarded
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check reply achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE requirement_type = 'replies' AND requirement_count <= reply_count
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check cendol received achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE requirement_type = 'cendol_received' AND requirement_count <= cendol_received
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check cendol given achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE requirement_type = 'cendol_given' AND requirement_count <= cendol_given
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check level achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE requirement_type = 'level' AND requirement_count <= user_level
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check badge count achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE category = 'special' AND title LIKE 'Badge %' AND requirement_count <= badge_count
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  -- Check challenge count achievements
  FOR achievement_record IN 
    SELECT * FROM forum_achievements 
    WHERE category = 'special' AND title LIKE 'Challenge %' AND requirement_count <= challenge_count
  LOOP
    INSERT INTO forum_user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, achievement_record.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Award XP for the achievement if newly inserted
    IF FOUND THEN
      UPDATE auth.users
      SET exp_points = exp_points + achievement_record.reward_exp
      WHERE id = NEW.user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to check achievements on relevant actions
CREATE TRIGGER check_achievements_on_exp_update
AFTER UPDATE OF exp_points, level ON auth.users
FOR EACH ROW
WHEN (NEW.exp_points <> OLD.exp_points OR NEW.level <> OLD.level)
EXECUTE FUNCTION check_and_award_achievements();

CREATE TRIGGER check_achievements_on_thread_create
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();

CREATE TRIGGER check_achievements_on_reply_create
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();

CREATE TRIGGER check_achievements_on_vote_create
AFTER INSERT ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();

CREATE TRIGGER check_achievements_on_badge_award
AFTER INSERT ON forum_user_badges
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();

CREATE TRIGGER check_achievements_on_challenge_complete
AFTER UPDATE OF is_completed ON forum_user_challenges
FOR EACH ROW
WHEN (NEW.is_completed = TRUE AND OLD.is_completed = FALSE)
EXECUTE FUNCTION check_and_award_achievements();

-- Enable realtime for achievements tables
ALTER publication supabase_realtime ADD TABLE forum_achievements;
ALTER publication supabase_realtime ADD TABLE forum_user_achievements;

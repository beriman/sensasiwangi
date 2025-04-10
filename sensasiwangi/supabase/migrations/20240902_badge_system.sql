-- Create forum_badges table
CREATE TABLE IF NOT EXISTS forum_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_user_badges table
CREATE TABLE IF NOT EXISTS forum_user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES forum_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO forum_badges (name, description, icon, color, requirement_type, requirement_count)
VALUES
  ('Newbie', 'Join the community', '🌱', 'bg-green-100 text-green-800', 'join', 1),
  ('Thread Starter', 'Create your first thread', '📝', 'bg-blue-100 text-blue-800', 'threads', 1),
  ('Conversation Starter', 'Create 5 threads', '💬', 'bg-blue-200 text-blue-800', 'threads', 5),
  ('Prolific Poster', 'Create 20 threads', '📚', 'bg-blue-300 text-blue-900', 'threads', 20),
  ('First Reply', 'Post your first reply', '📣', 'bg-purple-100 text-purple-800', 'replies', 1),
  ('Helpful', 'Post 10 replies', '👍', 'bg-purple-200 text-purple-800', 'replies', 10),
  ('Super Helper', 'Post 50 replies', '🌟', 'bg-purple-300 text-purple-900', 'replies', 50),
  ('Liked', 'Receive your first cendol', '❤️', 'bg-red-100 text-red-800', 'cendol_received', 1),
  ('Popular', 'Receive 10 cendols', '🔥', 'bg-red-200 text-red-800', 'cendol_received', 10),
  ('Superstar', 'Receive 50 cendols', '⭐', 'bg-red-300 text-red-900', 'cendol_received', 50),
  ('Generous', 'Give 10 cendols to others', '🎁', 'bg-amber-100 text-amber-800', 'cendol_given', 10),
  ('Level 5', 'Reach level 5', '🏆', 'bg-gradient-to-r from-amber-400 to-amber-600 text-white', 'level', 5),
  ('Level 10', 'Reach level 10', '👑', 'bg-gradient-to-r from-purple-400 to-purple-600 text-white', 'level', 10);

-- Enable realtime for badges tables
alter publication supabase_realtime add table forum_badges;
alter publication supabase_realtime add table forum_user_badges;

-- Create function to check and award badges
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
BEGIN
  -- Get user stats
  SELECT level INTO user_level FROM users WHERE id = NEW.user_id;
  
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
  
  -- For other badge types, we need to calculate counts
  SELECT COUNT(*) INTO thread_count FROM forum_threads WHERE user_id = NEW.user_id;
  SELECT COUNT(*) INTO reply_count FROM forum_replies WHERE user_id = NEW.user_id;
  
  -- Count cendols received
  SELECT COUNT(*) INTO cendol_received 
  FROM forum_votes 
  WHERE vote_type = 'cendol' AND 
        ((thread_id IS NOT NULL AND thread_id IN (SELECT id FROM forum_threads WHERE user_id = NEW.user_id)) OR
         (reply_id IS NOT NULL AND reply_id IN (SELECT id FROM forum_replies WHERE user_id = NEW.user_id)));
  
  -- Count cendols given
  SELECT COUNT(*) INTO cendol_given 
  FROM forum_votes 
  WHERE user_id = NEW.user_id AND vote_type = 'cendol';
  
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

-- Create triggers to check badges on relevant actions
CREATE TRIGGER check_badges_on_exp_update
AFTER UPDATE OF exp_points, level ON users
FOR EACH ROW
WHEN (NEW.exp_points <> OLD.exp_points OR NEW.level <> OLD.level)
EXECUTE FUNCTION check_and_award_badges();

CREATE TRIGGER check_badges_on_thread_create
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION check_and_award_badges();

CREATE TRIGGER check_badges_on_reply_create
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION check_and_award_badges();

CREATE TRIGGER check_badges_on_vote_create
AFTER INSERT ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION check_and_award_badges();

-- Award Newbie badge to all existing users
INSERT INTO forum_user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM users u, forum_badges b
WHERE b.requirement_type = 'join' AND b.requirement_count = 1
ON CONFLICT (user_id, badge_id) DO NOTHING;

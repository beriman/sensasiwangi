-- Migration for category-based reputation system

-- Create table for user category reputation
CREATE TABLE IF NOT EXISTS forum_user_category_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Create table for reputation history
CREATE TABLE IF NOT EXISTS forum_reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'thread', 'reply', 'vote', 'accepted_answer', 'badge', 'manual'
  source_id UUID, -- ID of the source (thread, reply, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for reputation levels
CREATE TABLE IF NOT EXISTS forum_reputation_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL,
  min_points INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(level)
);

-- Create table for reputation privileges
CREATE TABLE IF NOT EXISTS forum_reputation_privileges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  min_reputation INTEGER NOT NULL,
  is_global BOOLEAN DEFAULT FALSE, -- If true, applies to global reputation, otherwise category-specific
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Insert default reputation levels
INSERT INTO forum_reputation_levels (level, min_points, name, description, icon, color)
VALUES
  (1, 0, 'Newbie', 'Just starting out', 'user', 'gray'),
  (2, 100, 'Beginner', 'Learning the ropes', 'book', 'blue'),
  (3, 300, 'Intermediate', 'Getting comfortable', 'thumbs-up', 'green'),
  (4, 750, 'Advanced', 'Experienced contributor', 'award', 'purple'),
  (5, 1500, 'Expert', 'Highly knowledgeable', 'star', 'amber'),
  (6, 3000, 'Master', 'Mastered the subject', 'crown', 'orange'),
  (7, 5000, 'Guru', 'Exceptional knowledge and contribution', 'gem', 'red')
ON CONFLICT DO NOTHING;

-- Insert default reputation privileges
INSERT INTO forum_reputation_privileges (name, description, min_reputation, is_global)
VALUES
  ('Create Thread', 'Ability to create new threads', 0, true),
  ('Reply to Thread', 'Ability to reply to threads', 0, true),
  ('Vote', 'Ability to vote on threads and replies', 15, true),
  ('Flag Content', 'Ability to flag inappropriate content', 50, true),
  ('Create Poll', 'Ability to create polls in threads', 100, true),
  ('Edit Tags', 'Ability to edit tags on threads', 300, false),
  ('Close Thread', 'Ability to vote to close threads', 500, false),
  ('Reopen Thread', 'Ability to vote to reopen threads', 750, false),
  ('Moderate Comments', 'Ability to hide or unhide comments', 1000, false),
  ('Edit Others Posts', 'Ability to edit posts by other users', 2000, false),
  ('Pin Thread', 'Ability to pin threads in a category', 3000, false),
  ('Category Moderator', 'Full moderation privileges for a category', 5000, false)
ON CONFLICT DO NOTHING;

-- Create function to add reputation points
CREATE OR REPLACE FUNCTION add_reputation_points(
  user_id_param UUID,
  category_id_param UUID,
  points_param INTEGER,
  reason_param VARCHAR(255),
  source_type_param VARCHAR(50),
  source_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_score INTEGER;
  current_level INTEGER;
  new_level INTEGER;
  level_record RECORD;
BEGIN
  -- Insert reputation history
  INSERT INTO forum_reputation_history (
    user_id,
    category_id,
    points,
    reason,
    source_type,
    source_id
  )
  VALUES (
    user_id_param,
    category_id_param,
    points_param,
    reason_param,
    source_type_param,
    source_id_param
  );
  
  -- Update or insert user category reputation
  INSERT INTO forum_user_category_reputation (
    user_id,
    category_id,
    reputation_score,
    level
  )
  VALUES (
    user_id_param,
    category_id_param,
    GREATEST(0, points_param), -- Ensure reputation doesn't go below 0
    1
  )
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    reputation_score = GREATEST(0, forum_user_category_reputation.reputation_score + points_param),
    updated_at = NOW();
  
  -- Get current reputation score and level
  SELECT reputation_score, level INTO current_score, current_level
  FROM forum_user_category_reputation
  WHERE user_id = user_id_param AND category_id = category_id_param;
  
  -- Check if level should be updated
  SELECT level INTO new_level
  FROM forum_reputation_levels
  WHERE min_points <= current_score
  ORDER BY level DESC
  LIMIT 1;
  
  -- Update level if changed
  IF new_level != current_level THEN
    UPDATE forum_user_category_reputation
    SET level = new_level
    WHERE user_id = user_id_param AND category_id = category_id_param;
    
    -- If level increased, notify user
    IF new_level > current_level THEN
      -- Get level info
      SELECT * INTO level_record
      FROM forum_reputation_levels
      WHERE level = new_level;
      
      -- Create notification
      PERFORM create_notification(
        user_id_param,
        'level_up',
        'Level Up: ' || level_record.name,
        'You reached level ' || new_level || ' in a category: ' || level_record.description,
        '/profile'
      );
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's reputation in a category
CREATE OR REPLACE FUNCTION get_user_category_reputation(
  user_id_param UUID,
  category_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  reputation_data JSON;
BEGIN
  SELECT json_build_object(
    'user_id', ucr.user_id,
    'category_id', ucr.category_id,
    'reputation_score', ucr.reputation_score,
    'level', ucr.level,
    'level_name', rl.name,
    'level_description', rl.description,
    'level_icon', rl.icon,
    'level_color', rl.color,
    'next_level', CASE WHEN rl2.level IS NULL THEN NULL ELSE rl2.level END,
    'next_level_name', CASE WHEN rl2.name IS NULL THEN NULL ELSE rl2.name END,
    'points_to_next_level', CASE WHEN rl2.min_points IS NULL THEN NULL ELSE rl2.min_points - ucr.reputation_score END,
    'next_level_min_points', CASE WHEN rl2.min_points IS NULL THEN NULL ELSE rl2.min_points END
  ) INTO reputation_data
  FROM forum_user_category_reputation ucr
  JOIN forum_reputation_levels rl ON ucr.level = rl.level
  LEFT JOIN forum_reputation_levels rl2 ON rl2.level = rl.level + 1
  WHERE ucr.user_id = user_id_param AND ucr.category_id = category_id_param;
  
  -- If no reputation record exists, create a default one
  IF reputation_data IS NULL THEN
    SELECT json_build_object(
      'user_id', user_id_param,
      'category_id', category_id_param,
      'reputation_score', 0,
      'level', 1,
      'level_name', rl.name,
      'level_description', rl.description,
      'level_icon', rl.icon,
      'level_color', rl.color,
      'next_level', rl2.level,
      'next_level_name', rl2.name,
      'points_to_next_level', rl2.min_points,
      'next_level_min_points', rl2.min_points
    ) INTO reputation_data
    FROM forum_reputation_levels rl
    LEFT JOIN forum_reputation_levels rl2 ON rl2.level = rl.level + 1
    WHERE rl.level = 1;
  END IF;
  
  RETURN reputation_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's reputation history
CREATE OR REPLACE FUNCTION get_user_reputation_history(
  user_id_param UUID,
  category_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  category_name TEXT,
  points INTEGER,
  reason VARCHAR(255),
  source_type VARCHAR(50),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rh.id,
    rh.category_id,
    c.name AS category_name,
    rh.points,
    rh.reason,
    rh.source_type,
    rh.source_id,
    rh.created_at
  FROM forum_reputation_history rh
  JOIN forum_categories c ON rh.category_id = c.id
  WHERE rh.user_id = user_id_param
  AND (category_id_param IS NULL OR rh.category_id = category_id_param)
  ORDER BY rh.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has a privilege
CREATE OR REPLACE FUNCTION user_has_privilege(
  user_id_param UUID,
  privilege_name_param VARCHAR(100),
  category_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_privilege BOOLEAN;
  min_reputation INTEGER;
  is_global BOOLEAN;
  user_reputation INTEGER;
BEGIN
  -- Get privilege info
  SELECT min_reputation, is_global INTO min_reputation, is_global
  FROM forum_reputation_privileges
  WHERE name = privilege_name_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Privilege not found: %', privilege_name_param;
  END IF;
  
  -- If global privilege, check global reputation
  IF is_global THEN
    -- For now, use the highest category reputation as global reputation
    SELECT MAX(reputation_score) INTO user_reputation
    FROM forum_user_category_reputation
    WHERE user_id = user_id_param;
    
    -- If no reputation found, default to 0
    IF user_reputation IS NULL THEN
      user_reputation := 0;
    END IF;
  ELSE
    -- If category-specific privilege, check category reputation
    IF category_id_param IS NULL THEN
      RAISE EXCEPTION 'Category ID is required for category-specific privileges';
    END IF;
    
    SELECT reputation_score INTO user_reputation
    FROM forum_user_category_reputation
    WHERE user_id = user_id_param AND category_id = category_id_param;
    
    -- If no reputation found, default to 0
    IF user_reputation IS NULL THEN
      user_reputation := 0;
    END IF;
  END IF;
  
  -- Check if user has enough reputation
  RETURN user_reputation >= min_reputation;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's privileges
CREATE OR REPLACE FUNCTION get_user_privileges(
  user_id_param UUID,
  category_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  name VARCHAR(100),
  description TEXT,
  has_privilege BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name,
    p.description,
    CASE
      WHEN p.is_global THEN
        -- For global privileges, check against highest category reputation
        EXISTS (
          SELECT 1
          FROM forum_user_category_reputation ucr
          WHERE ucr.user_id = user_id_param
          AND ucr.reputation_score >= p.min_reputation
          LIMIT 1
        )
      ELSE
        -- For category-specific privileges, check against category reputation
        EXISTS (
          SELECT 1
          FROM forum_user_category_reputation ucr
          WHERE ucr.user_id = user_id_param
          AND ucr.category_id = category_id_param
          AND ucr.reputation_score >= p.min_reputation
        )
    END AS has_privilege
  FROM forum_reputation_privileges p
  WHERE category_id_param IS NULL OR NOT p.is_global
  ORDER BY p.min_reputation;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top users by category
CREATE OR REPLACE FUNCTION get_top_users_by_category(
  category_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  reputation_score INTEGER,
  level INTEGER,
  level_name VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.username,
    u.avatar_url,
    ucr.reputation_score,
    ucr.level,
    rl.name AS level_name
  FROM forum_user_category_reputation ucr
  JOIN users u ON ucr.user_id = u.id
  JOIN forum_reputation_levels rl ON ucr.level = rl.level
  WHERE ucr.category_id = category_id_param
  ORDER BY ucr.reputation_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's category rankings
CREATE OR REPLACE FUNCTION get_user_category_rankings(
  user_id_param UUID
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  reputation_score INTEGER,
  level INTEGER,
  level_name VARCHAR(100),
  rank INTEGER,
  total_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH category_ranks AS (
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      ucr.reputation_score,
      ucr.level,
      rl.name AS level_name,
      RANK() OVER (PARTITION BY ucr.category_id ORDER BY ucr.reputation_score DESC) AS rank,
      COUNT(*) OVER (PARTITION BY ucr.category_id) AS total_users
    FROM forum_categories c
    LEFT JOIN forum_user_category_reputation ucr ON c.id = ucr.category_id
    LEFT JOIN forum_reputation_levels rl ON ucr.level = rl.level
    WHERE ucr.reputation_score > 0
  )
  SELECT
    cr.category_id,
    cr.category_name,
    COALESCE(ucr.reputation_score, 0) AS reputation_score,
    COALESCE(ucr.level, 1) AS level,
    COALESCE(rl.name, 'Newbie') AS level_name,
    COALESCE(cr.rank, 0) AS rank,
    COALESCE(cr.total_users, 0) AS total_users
  FROM forum_categories c
  LEFT JOIN forum_user_category_reputation ucr ON c.id = ucr.category_id AND ucr.user_id = user_id_param
  LEFT JOIN forum_reputation_levels rl ON COALESCE(ucr.level, 1) = rl.level
  LEFT JOIN category_ranks cr ON c.id = cr.category_id AND cr.reputation_score = COALESCE(ucr.reputation_score, 0)
  ORDER BY COALESCE(ucr.reputation_score, 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to award reputation points

-- Trigger for thread creation
CREATE OR REPLACE FUNCTION award_thread_creation_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 points for creating a thread
  PERFORM add_reputation_points(
    NEW.user_id,
    NEW.category_id,
    5,
    'Created a new thread',
    'thread',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_thread_creation_reputation_trigger
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION award_thread_creation_reputation();

-- Trigger for reply creation
CREATE OR REPLACE FUNCTION award_reply_creation_reputation()
RETURNS TRIGGER AS $$
DECLARE
  thread_category_id UUID;
BEGIN
  -- Get thread category
  SELECT category_id INTO thread_category_id
  FROM forum_threads
  WHERE id = NEW.thread_id;
  
  -- Award 2 points for creating a reply
  PERFORM add_reputation_points(
    NEW.user_id,
    thread_category_id,
    2,
    'Posted a reply',
    'reply',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_reply_creation_reputation_trigger
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION award_reply_creation_reputation();

-- Trigger for thread upvote
CREATE OR REPLACE FUNCTION award_thread_vote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  thread_record RECORD;
BEGIN
  -- Get thread info
  SELECT t.user_id, t.category_id INTO thread_record
  FROM forum_threads t
  WHERE t.id = NEW.thread_id;
  
  -- Award 10 points to thread author for receiving an upvote
  PERFORM add_reputation_points(
    thread_record.user_id,
    thread_record.category_id,
    10,
    'Thread received an upvote',
    'vote',
    NEW.thread_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_thread_vote_reputation_trigger
AFTER INSERT ON forum_thread_votes
FOR EACH ROW
WHEN (NEW.vote_type = 'upvote')
EXECUTE FUNCTION award_thread_vote_reputation();

-- Trigger for reply upvote
CREATE OR REPLACE FUNCTION award_reply_vote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  reply_record RECORD;
  thread_category_id UUID;
BEGIN
  -- Get reply info
  SELECT r.user_id, r.thread_id INTO reply_record
  FROM forum_replies r
  WHERE r.id = NEW.reply_id;
  
  -- Get thread category
  SELECT category_id INTO thread_category_id
  FROM forum_threads
  WHERE id = reply_record.thread_id;
  
  -- Award 5 points to reply author for receiving an upvote
  PERFORM add_reputation_points(
    reply_record.user_id,
    thread_category_id,
    5,
    'Reply received an upvote',
    'vote',
    NEW.reply_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_reply_vote_reputation_trigger
AFTER INSERT ON forum_reply_votes
FOR EACH ROW
WHEN (NEW.vote_type = 'upvote')
EXECUTE FUNCTION award_reply_vote_reputation();

-- Trigger for accepted answer
CREATE OR REPLACE FUNCTION award_accepted_answer_reputation()
RETURNS TRIGGER AS $$
DECLARE
  reply_record RECORD;
  thread_category_id UUID;
BEGIN
  -- Only proceed if is_accepted changed from false to true
  IF OLD.is_accepted = FALSE AND NEW.is_accepted = TRUE THEN
    -- Get reply info
    SELECT user_id, thread_id INTO reply_record
    FROM forum_replies
    WHERE id = NEW.id;
    
    -- Get thread category
    SELECT category_id INTO thread_category_id
    FROM forum_threads
    WHERE id = reply_record.thread_id;
    
    -- Award 15 points to reply author for having their answer accepted
    PERFORM add_reputation_points(
      reply_record.user_id,
      thread_category_id,
      15,
      'Answer was accepted as solution',
      'accepted_answer',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_accepted_answer_reputation_trigger
AFTER UPDATE OF is_accepted ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION award_accepted_answer_reputation();

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_user_category_reputation;
ALTER publication supabase_realtime ADD TABLE forum_reputation_history;

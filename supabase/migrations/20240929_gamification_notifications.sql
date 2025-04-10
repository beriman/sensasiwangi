-- Migration for gamification notifications system

-- Create notifications table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('badge', 'achievement', 'challenge', 'leaderboard', 'level_up', 'system')),
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(50),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_created_at_idx ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS user_notifications_is_read_idx ON user_notifications(is_read);

-- Create function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  type_param VARCHAR(50),
  title_param VARCHAR(100),
  message_param TEXT,
  icon_param VARCHAR(50) DEFAULT NULL,
  color_param VARCHAR(50) DEFAULT NULL,
  link_param VARCHAR(255) DEFAULT NULL,
  data_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    icon,
    color,
    link,
    data
  ) VALUES (
    user_id_param,
    type_param,
    title_param,
    message_param,
    icon_param,
    color_param,
    link_param,
    data_param
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  user_id_param UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE user_notifications
    SET is_read = TRUE
    WHERE user_id = user_id_param
    AND is_read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE user_notifications
    SET is_read = TRUE
    WHERE user_id = user_id_param
    AND id = ANY(notification_ids)
    AND is_read = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete notifications
CREATE OR REPLACE FUNCTION delete_notifications(
  user_id_param UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF notification_ids IS NULL THEN
    -- Delete all notifications
    DELETE FROM user_notifications
    WHERE user_id = user_id_param;
  ELSE
    -- Delete specific notifications
    DELETE FROM user_notifications
    WHERE user_id = user_id_param
    AND id = ANY(notification_ids);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Modify badge award function to create notification
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
  thread_count INTEGER;
  reply_count INTEGER;
  vote_count INTEGER;
  badge_id UUID;
BEGIN
  -- Count threads
  SELECT COUNT(*) INTO thread_count 
  FROM forum_threads 
  WHERE user_id = NEW.user_id;
  
  -- Count replies
  SELECT COUNT(*) INTO reply_count 
  FROM forum_replies 
  WHERE user_id = NEW.user_id;
  
  -- Count votes
  SELECT COUNT(*) INTO vote_count 
  FROM forum_votes 
  WHERE user_id = NEW.user_id;
  
  -- Check thread badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE badge_type = 'thread' AND threshold <= thread_count
  LOOP
    -- Insert badge if not already awarded
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- If badge was newly inserted, create notification
    IF FOUND THEN
      PERFORM create_notification(
        NEW.user_id,
        'badge',
        'New Badge Earned!',
        'You have earned the ' || badge_record.name || ' badge.',
        badge_record.icon,
        badge_record.color,
        '/forum/section/badges',
        json_build_object(
          'badge_id', badge_record.id,
          'badge_name', badge_record.name,
          'badge_icon', badge_record.icon,
          'badge_color', badge_record.color,
          'badge_tier', badge_record.tier,
          'badge_category', badge_record.category
        )
      );
    END IF;
  END LOOP;
  
  -- Check reply badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE badge_type = 'reply' AND threshold <= reply_count
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- If badge was newly inserted, create notification
    IF FOUND THEN
      PERFORM create_notification(
        NEW.user_id,
        'badge',
        'New Badge Earned!',
        'You have earned the ' || badge_record.name || ' badge.',
        badge_record.icon,
        badge_record.color,
        '/forum/section/badges',
        json_build_object(
          'badge_id', badge_record.id,
          'badge_name', badge_record.name,
          'badge_icon', badge_record.icon,
          'badge_color', badge_record.color,
          'badge_tier', badge_record.tier,
          'badge_category', badge_record.category
        )
      );
    END IF;
  END LOOP;
  
  -- Check vote badges
  FOR badge_record IN 
    SELECT * FROM forum_badges 
    WHERE badge_type = 'vote' AND threshold <= vote_count
  LOOP
    INSERT INTO forum_user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- If badge was newly inserted, create notification
    IF FOUND THEN
      PERFORM create_notification(
        NEW.user_id,
        'badge',
        'New Badge Earned!',
        'You have earned the ' || badge_record.name || ' badge.',
        badge_record.icon,
        badge_record.color,
        '/forum/section/badges',
        json_build_object(
          'badge_id', badge_record.id,
          'badge_name', badge_record.name,
          'badge_icon', badge_record.icon,
          'badge_color', badge_record.color,
          'badge_tier', badge_record.tier,
          'badge_category', badge_record.category
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Modify achievement award function to create notification
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You have unlocked the ' || achievement_record.title || ' achievement and earned ' || achievement_record.reward_exp || ' XP.',
        achievement_record.icon,
        achievement_record.color,
        '/forum/section/achievements',
        json_build_object(
          'achievement_id', achievement_record.id,
          'achievement_title', achievement_record.title,
          'achievement_description', achievement_record.description,
          'achievement_icon', achievement_record.icon,
          'achievement_color', achievement_record.color,
          'achievement_reward_exp', achievement_record.reward_exp,
          'achievement_category', achievement_record.category,
          'achievement_tier', achievement_record.tier
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Modify challenge completion function to create notification
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
    
    -- If newly completed, update challenge participants count and create notification
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
      
      -- Create notification
      PERFORM create_notification(
        NEW.user_id,
        'challenge',
        'Challenge Completed!',
        'You have completed the ' || challenge.title || ' challenge and earned ' || challenge.reward_exp || ' XP.',
        COALESCE(challenge.reward_badge_icon, '🏆'),
        COALESCE(challenge.reward_badge_color, 'bg-green-100 text-green-800'),
        '/forum/section/challenges',
        json_build_object(
          'challenge_id', challenge.id,
          'challenge_title', challenge.title,
          'challenge_description', challenge.description,
          'challenge_reward_exp', challenge.reward_exp,
          'challenge_reward_badge_id', challenge.reward_badge_id,
          'challenge_reward_badge_name', challenge.reward_badge_name,
          'challenge_category', challenge.category,
          'challenge_difficulty', challenge.difficulty
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level up notifications
CREATE OR REPLACE FUNCTION notify_level_up()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if level increased
  IF NEW.level > OLD.level THEN
    -- Create level up notification
    PERFORM create_notification(
      NEW.id,
      'level_up',
      'Level Up!',
      'Congratulations! You have reached level ' || NEW.level || '.',
      '🌟',
      'bg-yellow-100 text-yellow-800',
      '/profile',
      json_build_object(
        'old_level', OLD.level,
        'new_level', NEW.level,
        'exp_points', NEW.exp_points
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level up
CREATE TRIGGER notify_on_level_up
AFTER UPDATE OF level ON auth.users
FOR EACH ROW
WHEN (NEW.level > OLD.level)
EXECUTE FUNCTION notify_level_up();

-- Create trigger for leaderboard rank notifications
CREATE OR REPLACE FUNCTION notify_leaderboard_rank_change()
RETURNS TRIGGER AS $$
DECLARE
  old_rank INTEGER;
  new_rank INTEGER;
BEGIN
  -- Get old rank
  SELECT rank INTO old_rank
  FROM forum_leaderboard_history
  WHERE user_id = NEW.user_id
  AND period = NEW.period
  AND leaderboard_type = NEW.leaderboard_type
  AND snapshot_date < NEW.snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  -- If no old rank or rank improved, create notification
  IF old_rank IS NULL OR NEW.rank < old_rank THEN
    -- Create leaderboard notification
    PERFORM create_notification(
      NEW.user_id,
      'leaderboard',
      'Leaderboard Rank Improved!',
      CASE 
        WHEN old_rank IS NULL THEN 'You are now ranked #' || NEW.rank || ' on the ' || NEW.period || ' ' || NEW.leaderboard_type || ' leaderboard!'
        ELSE 'Your rank improved from #' || old_rank || ' to #' || NEW.rank || ' on the ' || NEW.period || ' ' || NEW.leaderboard_type || ' leaderboard!'
      END,
      '🏆',
      'bg-amber-100 text-amber-800',
      '/forum/section/leaderboard',
      json_build_object(
        'old_rank', old_rank,
        'new_rank', NEW.rank,
        'period', NEW.period,
        'leaderboard_type', NEW.leaderboard_type,
        'score', NEW.score
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leaderboard rank changes
CREATE TRIGGER notify_on_leaderboard_rank_change
AFTER INSERT ON forum_leaderboard_history
FOR EACH ROW
EXECUTE FUNCTION notify_leaderboard_rank_change();

-- Enable realtime for notifications table
ALTER publication supabase_realtime ADD TABLE user_notifications;

-- Migration for enhanced leaderboard functionality

-- Create a table to store leaderboard history
CREATE TABLE IF NOT EXISTS forum_leaderboard_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly', 'all_time')),
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('exp', 'threads', 'replies', 'votes', 'badges')),
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS forum_leaderboard_history_period_type_idx ON forum_leaderboard_history(period, leaderboard_type);
CREATE INDEX IF NOT EXISTS forum_leaderboard_history_user_idx ON forum_leaderboard_history(user_id);
CREATE INDEX IF NOT EXISTS forum_leaderboard_history_date_idx ON forum_leaderboard_history(snapshot_date);

-- Improve the get_leaderboard function to support more options
CREATE OR REPLACE FUNCTION get_leaderboard(
  time_frame TEXT DEFAULT 'monthly',
  leaderboard_type TEXT DEFAULT 'exp',
  limit_count INTEGER DEFAULT 50,
  category_filter TEXT DEFAULT NULL,
  min_level INTEGER DEFAULT 1
)
RETURNS SETOF JSON AS $$
DECLARE
  date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set date filter based on time_frame
  IF time_frame = 'weekly' THEN
    date_filter := NOW() - INTERVAL '7 days';
  ELSIF time_frame = 'monthly' THEN
    date_filter := NOW() - INTERVAL '30 days';
  ELSIF time_frame = 'yearly' THEN
    date_filter := NOW() - INTERVAL '365 days';
  ELSE
    date_filter := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- All time
  END IF;

  -- Return leaderboard based on type
  IF leaderboard_type = 'exp' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'top_badges', (
        SELECT json_agg(json_build_object(
          'id', b.id,
          'name', b.name,
          'icon', b.icon,
          'color', b.color
        ))
        FROM forum_user_badges ub2
        JOIN forum_badges b ON ub2.badge_id = b.id
        WHERE ub2.user_id = u.id
        ORDER BY ub2.awarded_at DESC
        LIMIT 3
      ),
      'rank', ROW_NUMBER() OVER (ORDER BY u.exp_points DESC)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_votes v ON u.id = v.user_id AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    AND (
      category_filter IS NULL OR
      EXISTS (
        SELECT 1 FROM forum_threads t2
        WHERE t2.user_id = u.id
        AND t2.category_id = category_filter::UUID
        AND t2.created_at >= date_filter
      )
    )
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points
    ORDER BY u.exp_points DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'threads' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'rank', ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT t.id) DESC)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_votes v ON u.id = v.user_id AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    AND (
      category_filter IS NULL OR
      EXISTS (
        SELECT 1 FROM forum_threads t2
        WHERE t2.user_id = u.id
        AND t2.category_id = category_filter::UUID
        AND t2.created_at >= date_filter
      )
    )
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points
    HAVING COUNT(DISTINCT t.id) > 0
    ORDER BY COUNT(DISTINCT t.id) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'replies' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'rank', ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT r.id) DESC)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_votes v ON u.id = v.user_id AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    AND (
      category_filter IS NULL OR
      EXISTS (
        SELECT 1 FROM forum_replies r2
        JOIN forum_threads t2 ON r2.thread_id = t2.id
        WHERE r2.user_id = u.id
        AND t2.category_id = category_filter::UUID
        AND r2.created_at >= date_filter
      )
    )
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points
    HAVING COUNT(DISTINCT r.id) > 0
    ORDER BY COUNT(DISTINCT r.id) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'votes' THEN
    RETURN QUERY
    WITH vote_counts AS (
      SELECT 
        content_user_id,
        COUNT(*) as vote_count
      FROM (
        -- Votes on threads
        SELECT 
          t.user_id as content_user_id,
          v.id as vote_id
        FROM forum_votes v
        JOIN forum_threads t ON v.thread_id = t.id
        WHERE v.created_at >= date_filter
        AND v.vote_type = 'cendol'
        AND (
          category_filter IS NULL OR
          t.category_id = category_filter::UUID
        )
        
        UNION ALL
        
        -- Votes on replies
        SELECT 
          r.user_id as content_user_id,
          v.id as vote_id
        FROM forum_votes v
        JOIN forum_replies r ON v.reply_id = r.id
        JOIN forum_threads t ON r.thread_id = t.id
        WHERE v.created_at >= date_filter
        AND v.vote_type = 'cendol'
        AND (
          category_filter IS NULL OR
          t.category_id = category_filter::UUID
        )
      ) as votes
      GROUP BY content_user_id
    )
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COALESCE(vc.vote_count, 0),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'rank', ROW_NUMBER() OVER (ORDER BY COALESCE(vc.vote_count, 0) DESC)
    )
    FROM auth.users u
    LEFT JOIN vote_counts vc ON u.id = vc.content_user_id
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points, vc.vote_count
    HAVING COALESCE(vc.vote_count, 0) > 0
    ORDER BY COALESCE(vc.vote_count, 0) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'badges' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'top_badges', (
        SELECT json_agg(json_build_object(
          'id', b.id,
          'name', b.name,
          'icon', b.icon,
          'color', b.color
        ))
        FROM forum_user_badges ub2
        JOIN forum_badges b ON ub2.badge_id = b.id
        WHERE ub2.user_id = u.id
        ORDER BY b.tier DESC, ub2.awarded_at DESC
        LIMIT 3
      ),
      'rank', ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT ub.badge_id) DESC)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_votes v ON u.id = v.user_id AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points
    HAVING COUNT(DISTINCT ub.badge_id) > 0
    ORDER BY COUNT(DISTINCT ub.badge_id) DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp_points,
      'level', FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id),
      'rank', ROW_NUMBER() OVER (ORDER BY u.exp_points DESC)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_votes v ON u.id = v.user_id AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    WHERE FLOOR(SQRT(u.exp_points / 100))::INTEGER + 1 >= min_level
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp_points
    ORDER BY u.exp_points DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to take a snapshot of the current leaderboard
CREATE OR REPLACE FUNCTION take_leaderboard_snapshot()
RETURNS void AS $$
DECLARE
  period_type TEXT;
  leaderboard_type TEXT;
  user_record RECORD;
  snapshot_date TIMESTAMP WITH TIME ZONE;
BEGIN
  snapshot_date := NOW();
  
  -- Loop through each period type
  FOR period_type IN 
    SELECT unnest(ARRAY['weekly', 'monthly', 'yearly', 'all_time'])
  LOOP
    -- Loop through each leaderboard type
    FOR leaderboard_type IN 
      SELECT unnest(ARRAY['exp', 'threads', 'replies', 'votes', 'badges'])
    LOOP
      -- Get leaderboard data
      FOR user_record IN 
        SELECT 
          (data->>'id')::UUID as user_id,
          (data->>'rank')::INTEGER as rank,
          CASE 
            WHEN leaderboard_type = 'exp' THEN (data->>'exp')::INTEGER
            WHEN leaderboard_type = 'threads' THEN (data->>'thread_count')::INTEGER
            WHEN leaderboard_type = 'replies' THEN (data->>'reply_count')::INTEGER
            WHEN leaderboard_type = 'votes' THEN (data->>'vote_count')::INTEGER
            WHEN leaderboard_type = 'badges' THEN (data->>'badge_count')::INTEGER
            ELSE 0
          END as score
        FROM get_leaderboard(period_type, leaderboard_type, 100)
      LOOP
        -- Insert into history table
        INSERT INTO forum_leaderboard_history (
          user_id,
          period,
          leaderboard_type,
          rank,
          score,
          snapshot_date
        ) VALUES (
          user_record.user_id,
          period_type,
          leaderboard_type,
          user_record.rank,
          user_record.score,
          snapshot_date
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's leaderboard history
CREATE OR REPLACE FUNCTION get_user_leaderboard_history(
  user_id_param UUID,
  period_param TEXT DEFAULT 'monthly',
  leaderboard_type_param TEXT DEFAULT 'exp',
  limit_count INTEGER DEFAULT 10
)
RETURNS SETOF JSON AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'rank', rank,
    'score', score,
    'snapshot_date', snapshot_date,
    'period', period,
    'leaderboard_type', leaderboard_type
  )
  FROM forum_leaderboard_history
  WHERE user_id = user_id_param
  AND period = period_param
  AND leaderboard_type = leaderboard_type_param
  ORDER BY snapshot_date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's best rank
CREATE OR REPLACE FUNCTION get_user_best_rank(
  user_id_param UUID,
  period_param TEXT DEFAULT 'all_time',
  leaderboard_type_param TEXT DEFAULT 'exp'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'best_rank', MIN(rank),
    'best_score', MAX(score),
    'best_date', (
      SELECT snapshot_date
      FROM forum_leaderboard_history
      WHERE user_id = user_id_param
      AND period = period_param
      AND leaderboard_type = leaderboard_type_param
      ORDER BY rank ASC, score DESC
      LIMIT 1
    )
  ) INTO result
  FROM forum_leaderboard_history
  WHERE user_id = user_id_param
  AND period = period_param
  AND leaderboard_type = leaderboard_type_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_leaderboard_history;

-- Create a scheduled job to take leaderboard snapshots (this would be set up in Supabase)
-- This is just a placeholder - you would need to set up a cron job in Supabase
COMMENT ON FUNCTION take_leaderboard_snapshot() IS 'Run this weekly to take snapshots of the leaderboard';

-- Take an initial snapshot
SELECT take_leaderboard_snapshot();

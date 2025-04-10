-- Migration for advanced forum features

-- Add fields to forum_threads for enhanced features
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS last_reply_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Add fields to forum_categories for enhanced features
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_thread_id UUID REFERENCES forum_threads(id) ON DELETE SET NULL;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_thread_title TEXT;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_user_name TEXT;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS last_user_avatar TEXT;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Create forum_challenges table
CREATE TABLE IF NOT EXISTS forum_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('thread', 'reply', 'vote', 'badge', 'exp', 'special')),
  target_count INTEGER NOT NULL,
  reward_exp INTEGER NOT NULL,
  reward_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_user_challenges table
CREATE TABLE IF NOT EXISTS forum_user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES forum_challenges(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Create forum_reading_history table
CREATE TABLE IF NOT EXISTS forum_reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Create stored procedure for getting forum statistics
CREATE OR REPLACE FUNCTION get_forum_statistics(
  time_frame TEXT DEFAULT 'month',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set date filter based on time_frame
  IF start_date IS NOT NULL THEN
    date_filter := start_date;
  ELSIF time_frame = 'week' THEN
    date_filter := NOW() - INTERVAL '7 days';
  ELSIF time_frame = 'month' THEN
    date_filter := NOW() - INTERVAL '30 days';
  ELSIF time_frame = 'year' THEN
    date_filter := NOW() - INTERVAL '1 year';
  ELSE
    date_filter := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- All time
  END IF;

  -- Get statistics
  WITH thread_stats AS (
    SELECT
      COUNT(*) AS total_threads,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS threads_today
    FROM forum_threads
    WHERE created_at >= date_filter
  ),
  reply_stats AS (
    SELECT
      COUNT(*) AS total_replies,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS replies_today
    FROM forum_replies
    WHERE created_at >= date_filter
  ),
  user_stats AS (
    SELECT
      COUNT(DISTINCT user_id) AS total_users,
      COUNT(DISTINCT user_id) FILTER (
        WHERE created_at >= NOW() - INTERVAL '7 days'
      ) AS active_users
    FROM (
      SELECT user_id, created_at FROM forum_threads WHERE created_at >= date_filter
      UNION ALL
      SELECT user_id, created_at FROM forum_replies WHERE created_at >= date_filter
    ) AS user_activity
  ),
  category_stats AS (
    SELECT
      c.id,
      c.name,
      COUNT(t.id) AS thread_count,
      ROUND(COUNT(t.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM forum_threads WHERE created_at >= date_filter), 0), 1) AS percentage
    FROM forum_categories c
    LEFT JOIN forum_threads t ON c.id = t.category_id AND t.created_at >= date_filter
    GROUP BY c.id, c.name
    ORDER BY thread_count DESC
    LIMIT 10
  ),
  tag_stats AS (
    SELECT
      t.id,
      t.name,
      t.color,
      COUNT(tt.thread_id) AS usage_count
    FROM forum_tags t
    LEFT JOIN forum_thread_tags tt ON t.id = tt.tag_id
    LEFT JOIN forum_threads ft ON tt.thread_id = ft.id AND ft.created_at >= date_filter
    GROUP BY t.id, t.name, t.color
    ORDER BY usage_count DESC
    LIMIT 20
  ),
  contributor_stats AS (
    SELECT
      u.id AS user_id,
      u.username,
      u.avatar_url,
      u.exp,
      COUNT(DISTINCT t.id) AS thread_count,
      COUNT(DISTINCT r.id) AS reply_count
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    WHERE (t.id IS NOT NULL OR r.id IS NOT NULL)
    GROUP BY u.id, u.username, u.avatar_url, u.exp
    ORDER BY (COUNT(DISTINCT t.id) + COUNT(DISTINCT r.id)) DESC
    LIMIT 10
  ),
  trending_threads AS (
    SELECT
      t.id,
      t.title,
      t.user_id,
      u.username,
      t.view_count,
      t.reply_count,
      t.created_at
    FROM forum_threads t
    JOIN auth.users u ON t.user_id = u.id
    WHERE t.created_at >= date_filter
    ORDER BY (
      t.view_count * 0.3 +
      t.reply_count * 0.5 +
      (EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600) * (-0.2)
    ) DESC
    LIMIT 10
  ),
  activity_by_day AS (
    SELECT
      date_trunc('day', day)::DATE AS date,
      COUNT(DISTINCT t.id) AS threads,
      COUNT(DISTINCT r.id) AS replies
    FROM generate_series(
      date_filter::DATE,
      NOW()::DATE,
      '1 day'::INTERVAL
    ) AS day
    LEFT JOIN forum_threads t ON date_trunc('day', t.created_at) = date_trunc('day', day)
    LEFT JOIN forum_replies r ON date_trunc('day', r.created_at) = date_trunc('day', day)
    GROUP BY date
    ORDER BY date
  )
  SELECT
    json_build_object(
      'totalThreads', (SELECT total_threads FROM thread_stats),
      'totalReplies', (SELECT total_replies FROM reply_stats),
      'totalUsers', (SELECT total_users FROM user_stats),
      'activeUsers', (SELECT active_users FROM user_stats),
      'threadsToday', (SELECT threads_today FROM thread_stats),
      'repliesToday', (SELECT replies_today FROM reply_stats),
      'topCategories', (SELECT json_agg(category_stats) FROM category_stats),
      'topTags', (SELECT json_agg(tag_stats) FROM tag_stats),
      'topContributors', (SELECT json_agg(contributor_stats) FROM contributor_stats),
      'trendingThreads', (SELECT json_agg(trending_threads) FROM trending_threads),
      'activityByDay', (SELECT json_agg(activity_by_day) FROM activity_by_day)
    ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for getting leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
  time_frame TEXT DEFAULT 'monthly',
  leaderboard_type TEXT DEFAULT 'exp',
  limit_count INTEGER DEFAULT 50
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
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', 0,
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
      )
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY u.exp DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'threads' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', 0,
      'badge_count', COUNT(DISTINCT ub.badge_id)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY COUNT(DISTINCT t.id) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'replies' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', 0,
      'badge_count', COUNT(DISTINCT ub.badge_id)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY COUNT(DISTINCT r.id) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'votes' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', COUNT(DISTINCT v.id),
      'badge_count', COUNT(DISTINCT ub.badge_id)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id
    LEFT JOIN forum_replies r ON u.id = r.user_id
    LEFT JOIN forum_votes v ON (t.id = v.thread_id OR r.id = v.reply_id) AND v.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY COUNT(DISTINCT v.id) DESC
    LIMIT limit_count;
  ELSIF leaderboard_type = 'badges' THEN
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', 0,
      'badge_count', COUNT(DISTINCT ub.badge_id)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id
    LEFT JOIN forum_replies r ON u.id = r.user_id
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id AND ub.awarded_at >= date_filter
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY COUNT(DISTINCT ub.badge_id) DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'exp', u.exp,
      'level', FLOOR(SQRT(u.exp / 100))::INTEGER + 1,
      'thread_count', COUNT(DISTINCT t.id),
      'reply_count', COUNT(DISTINCT r.id),
      'vote_count', 0,
      'badge_count', COUNT(DISTINCT ub.badge_id)
    )
    FROM auth.users u
    LEFT JOIN forum_threads t ON u.id = t.user_id AND t.created_at >= date_filter
    LEFT JOIN forum_replies r ON u.id = r.user_id AND r.created_at >= date_filter
    LEFT JOIN forum_user_badges ub ON u.id = ub.user_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.exp
    ORDER BY u.exp DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample challenges
INSERT INTO forum_challenges (title, description, challenge_type, target_count, reward_exp, start_date, end_date)
VALUES 
  ('Weekly Discussion Master', 'Create 3 new discussion threads this week', 'thread', 3, 50, NOW(), NOW() + INTERVAL '7 days'),
  ('Helpful Responder', 'Reply to 10 threads to help other community members', 'reply', 10, 100, NOW(), NOW() + INTERVAL '30 days'),
  ('Engagement Champion', 'Get 20 upvotes on your content', 'vote', 20, 150, NOW(), NOW() + INTERVAL '30 days'),
  ('Perfume Expert', 'Create a detailed review thread about a perfume', 'special', 1, 200, NOW(), NOW() + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_challenges;
ALTER publication supabase_realtime ADD TABLE forum_user_challenges;
ALTER publication supabase_realtime ADD TABLE forum_reading_history;

-- Migration for advanced profile customization system

-- Add new columns to users table for profile customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_frame VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_background VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_accent_color VARCHAR(50);

-- Create table for available profile titles
CREATE TABLE IF NOT EXISTS profile_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  required_level INTEGER DEFAULT 1,
  required_achievement_id UUID REFERENCES forum_achievements(id) ON DELETE SET NULL,
  required_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  is_exclusive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for available profile frames
CREATE TABLE IF NOT EXISTS profile_frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  css_class VARCHAR(100),
  required_level INTEGER DEFAULT 1,
  required_achievement_id UUID REFERENCES forum_achievements(id) ON DELETE SET NULL,
  required_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  is_exclusive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for available profile backgrounds
CREATE TABLE IF NOT EXISTS profile_backgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  css_class VARCHAR(100),
  required_level INTEGER DEFAULT 1,
  required_achievement_id UUID REFERENCES forum_achievements(id) ON DELETE SET NULL,
  required_badge_id UUID REFERENCES forum_badges(id) ON DELETE SET NULL,
  is_exclusive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for user's favorite badges
CREATE TABLE IF NOT EXISTS user_favorite_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES forum_badges(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create table for user's favorite achievements
CREATE TABLE IF NOT EXISTS user_favorite_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES forum_achievements(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create table for user's showcase items (can be badges, achievements, or leaderboard positions)
CREATE TABLE IF NOT EXISTS user_showcase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('badge', 'achievement', 'leaderboard')),
  item_id UUID NOT NULL,
  display_order INTEGER NOT NULL,
  custom_caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Insert default profile titles
INSERT INTO profile_titles (title, description, icon, color, required_level)
VALUES
  ('Newbie', 'Just starting out in the community', '🌱', 'text-green-500', 1),
  ('Regular', 'An active member of the community', '🌿', 'text-green-600', 5),
  ('Enthusiast', 'A dedicated member of the community', '🌲', 'text-green-700', 10),
  ('Expert', 'A knowledgeable member of the community', '🏔️', 'text-blue-600', 20),
  ('Master', 'A highly respected member of the community', '🌋', 'text-red-600', 30),
  ('Legend', 'A legendary member of the community', '👑', 'text-amber-500', 50),
  ('Perfume Connoisseur', 'An expert in perfumes and fragrances', '👃', 'text-purple-600', 15),
  ('Fragrance Guru', 'A master of fragrance knowledge', '🧪', 'text-indigo-600', 25),
  ('Scent Maestro', 'A true master of scents and fragrances', '🌹', 'text-pink-600', 40)
ON CONFLICT DO NOTHING;

-- Insert default profile frames
INSERT INTO profile_frames (name, description, css_class, required_level)
VALUES
  ('Basic', 'A simple frame for your profile picture', 'frame-basic', 1),
  ('Silver', 'A silver frame for your profile picture', 'frame-silver', 10),
  ('Gold', 'A gold frame for your profile picture', 'frame-gold', 20),
  ('Platinum', 'A platinum frame for your profile picture', 'frame-platinum', 30),
  ('Diamond', 'A diamond frame for your profile picture', 'frame-diamond', 40),
  ('Obsidian', 'A rare obsidian frame for your profile picture', 'frame-obsidian', 50)
ON CONFLICT DO NOTHING;

-- Insert default profile backgrounds
INSERT INTO profile_backgrounds (name, description, css_class, required_level)
VALUES
  ('Default', 'The default profile background', 'bg-default', 1),
  ('Gradient Blue', 'A blue gradient background', 'bg-gradient-blue', 5),
  ('Gradient Purple', 'A purple gradient background', 'bg-gradient-purple', 10),
  ('Gradient Gold', 'A gold gradient background', 'bg-gradient-gold', 20),
  ('Pattern Dots', 'A dotted pattern background', 'bg-pattern-dots', 15),
  ('Pattern Waves', 'A wavy pattern background', 'bg-pattern-waves', 25),
  ('Perfume Bottles', 'A background with perfume bottles', 'bg-perfume-bottles', 30)
ON CONFLICT DO NOTHING;

-- Create function to check if user has access to a title
CREATE OR REPLACE FUNCTION check_title_access(
  user_id_param UUID,
  title_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  title_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get title requirements
  SELECT * INTO title_record FROM profile_titles WHERE id = title_id_param;
  
  -- If title doesn't exist, return false
  IF title_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Check level requirement
  IF user_level < title_record.required_level THEN
    RETURN FALSE;
  END IF;
  
  -- Check achievement requirement if any
  IF title_record.required_achievement_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_achievements
      WHERE user_id = user_id_param AND achievement_id = title_record.required_achievement_id
    ) INTO has_achievement;
    
    IF NOT has_achievement THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check badge requirement if any
  IF title_record.required_badge_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_badges
      WHERE user_id = user_id_param AND badge_id = title_record.required_badge_id
    ) INTO has_badge;
    
    IF NOT has_badge THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- If all checks pass, return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has access to a frame
CREATE OR REPLACE FUNCTION check_frame_access(
  user_id_param UUID,
  frame_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  frame_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get frame requirements
  SELECT * INTO frame_record FROM profile_frames WHERE id = frame_id_param;
  
  -- If frame doesn't exist, return false
  IF frame_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Check level requirement
  IF user_level < frame_record.required_level THEN
    RETURN FALSE;
  END IF;
  
  -- Check achievement requirement if any
  IF frame_record.required_achievement_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_achievements
      WHERE user_id = user_id_param AND achievement_id = frame_record.required_achievement_id
    ) INTO has_achievement;
    
    IF NOT has_achievement THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check badge requirement if any
  IF frame_record.required_badge_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_badges
      WHERE user_id = user_id_param AND badge_id = frame_record.required_badge_id
    ) INTO has_badge;
    
    IF NOT has_badge THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- If all checks pass, return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has access to a background
CREATE OR REPLACE FUNCTION check_background_access(
  user_id_param UUID,
  background_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  background_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get background requirements
  SELECT * INTO background_record FROM profile_backgrounds WHERE id = background_id_param;
  
  -- If background doesn't exist, return false
  IF background_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Check level requirement
  IF user_level < background_record.required_level THEN
    RETURN FALSE;
  END IF;
  
  -- Check achievement requirement if any
  IF background_record.required_achievement_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_achievements
      WHERE user_id = user_id_param AND achievement_id = background_record.required_achievement_id
    ) INTO has_achievement;
    
    IF NOT has_achievement THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check badge requirement if any
  IF background_record.required_badge_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forum_user_badges
      WHERE user_id = user_id_param AND badge_id = background_record.required_badge_id
    ) INTO has_badge;
    
    IF NOT has_badge THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- If all checks pass, return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available titles for a user
CREATE OR REPLACE FUNCTION get_available_titles(
  user_id_param UUID
)
RETURNS SETOF profile_titles AS $$
DECLARE
  title_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Return titles that user has access to
  FOR title_record IN 
    SELECT * FROM profile_titles
    WHERE required_level <= user_level
  LOOP
    -- Check achievement requirement if any
    IF title_record.required_achievement_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_achievements
        WHERE user_id = user_id_param AND achievement_id = title_record.required_achievement_id
      ) INTO has_achievement;
      
      IF NOT has_achievement THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Check badge requirement if any
    IF title_record.required_badge_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_badges
        WHERE user_id = user_id_param AND badge_id = title_record.required_badge_id
      ) INTO has_badge;
      
      IF NOT has_badge THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Return title if all requirements are met
    RETURN NEXT title_record;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available frames for a user
CREATE OR REPLACE FUNCTION get_available_frames(
  user_id_param UUID
)
RETURNS SETOF profile_frames AS $$
DECLARE
  frame_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Return frames that user has access to
  FOR frame_record IN 
    SELECT * FROM profile_frames
    WHERE required_level <= user_level
  LOOP
    -- Check achievement requirement if any
    IF frame_record.required_achievement_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_achievements
        WHERE user_id = user_id_param AND achievement_id = frame_record.required_achievement_id
      ) INTO has_achievement;
      
      IF NOT has_achievement THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Check badge requirement if any
    IF frame_record.required_badge_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_badges
        WHERE user_id = user_id_param AND badge_id = frame_record.required_badge_id
      ) INTO has_badge;
      
      IF NOT has_badge THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Return frame if all requirements are met
    RETURN NEXT frame_record;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available backgrounds for a user
CREATE OR REPLACE FUNCTION get_available_backgrounds(
  user_id_param UUID
)
RETURNS SETOF profile_backgrounds AS $$
DECLARE
  background_record RECORD;
  user_level INTEGER;
  has_achievement BOOLEAN;
  has_badge BOOLEAN;
BEGIN
  -- Get user level
  SELECT level INTO user_level FROM auth.users WHERE id = user_id_param;
  
  -- Return backgrounds that user has access to
  FOR background_record IN 
    SELECT * FROM profile_backgrounds
    WHERE required_level <= user_level
  LOOP
    -- Check achievement requirement if any
    IF background_record.required_achievement_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_achievements
        WHERE user_id = user_id_param AND achievement_id = background_record.required_achievement_id
      ) INTO has_achievement;
      
      IF NOT has_achievement THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Check badge requirement if any
    IF background_record.required_badge_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM forum_user_badges
        WHERE user_id = user_id_param AND badge_id = background_record.required_badge_id
      ) INTO has_badge;
      
      IF NOT has_badge THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Return background if all requirements are met
    RETURN NEXT background_record;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user profile customization
CREATE OR REPLACE FUNCTION update_profile_customization(
  user_id_param UUID,
  title_id_param UUID DEFAULT NULL,
  frame_id_param UUID DEFAULT NULL,
  background_id_param UUID DEFAULT NULL,
  theme_param VARCHAR DEFAULT NULL,
  accent_color_param VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check title access if provided
  IF title_id_param IS NOT NULL THEN
    SELECT check_title_access(user_id_param, title_id_param) INTO has_access;
    IF NOT has_access THEN
      RAISE EXCEPTION 'User does not have access to this title';
    END IF;
  END IF;
  
  -- Check frame access if provided
  IF frame_id_param IS NOT NULL THEN
    SELECT check_frame_access(user_id_param, frame_id_param) INTO has_access;
    IF NOT has_access THEN
      RAISE EXCEPTION 'User does not have access to this frame';
    END IF;
  END IF;
  
  -- Check background access if provided
  IF background_id_param IS NOT NULL THEN
    SELECT check_background_access(user_id_param, background_id_param) INTO has_access;
    IF NOT has_access THEN
      RAISE EXCEPTION 'User does not have access to this background';
    END IF;
  END IF;
  
  -- Update user profile
  UPDATE users
  SET 
    profile_title = COALESCE(title_id_param, profile_title),
    profile_frame = COALESCE(frame_id_param, profile_frame),
    profile_background = COALESCE(background_id_param, profile_background),
    profile_theme = COALESCE(theme_param, profile_theme),
    profile_accent_color = COALESCE(accent_color_param, profile_accent_color)
  WHERE id = user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user favorite badges
CREATE OR REPLACE FUNCTION update_favorite_badges(
  user_id_param UUID,
  badge_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  badge_id UUID;
  display_order INTEGER := 1;
BEGIN
  -- Delete existing favorite badges
  DELETE FROM user_favorite_badges
  WHERE user_id = user_id_param;
  
  -- Insert new favorite badges
  FOREACH badge_id IN ARRAY badge_ids
  LOOP
    -- Check if user has the badge
    IF EXISTS (
      SELECT 1 FROM forum_user_badges
      WHERE user_id = user_id_param AND badge_id = badge_id
    ) THEN
      INSERT INTO user_favorite_badges (user_id, badge_id, display_order)
      VALUES (user_id_param, badge_id, display_order);
      
      display_order := display_order + 1;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user favorite achievements
CREATE OR REPLACE FUNCTION update_favorite_achievements(
  user_id_param UUID,
  achievement_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  achievement_id UUID;
  display_order INTEGER := 1;
BEGIN
  -- Delete existing favorite achievements
  DELETE FROM user_favorite_achievements
  WHERE user_id = user_id_param;
  
  -- Insert new favorite achievements
  FOREACH achievement_id IN ARRAY achievement_ids
  LOOP
    -- Check if user has the achievement
    IF EXISTS (
      SELECT 1 FROM forum_user_achievements
      WHERE user_id = user_id_param AND achievement_id = achievement_id
    ) THEN
      INSERT INTO user_favorite_achievements (user_id, achievement_id, display_order)
      VALUES (user_id_param, achievement_id, display_order);
      
      display_order := display_order + 1;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user showcase items
CREATE OR REPLACE FUNCTION update_showcase_items(
  user_id_param UUID,
  showcase_items JSON[]
)
RETURNS BOOLEAN AS $$
DECLARE
  item JSON;
  item_type VARCHAR;
  item_id UUID;
  display_order INTEGER := 1;
  custom_caption TEXT;
  has_item BOOLEAN;
BEGIN
  -- Delete existing showcase items
  DELETE FROM user_showcase_items
  WHERE user_id = user_id_param;
  
  -- Insert new showcase items
  FOREACH item IN ARRAY showcase_items
  LOOP
    item_type := item->>'type';
    item_id := (item->>'id')::UUID;
    custom_caption := item->>'caption';
    
    -- Check if user has the item
    CASE item_type
      WHEN 'badge' THEN
        SELECT EXISTS (
          SELECT 1 FROM forum_user_badges
          WHERE user_id = user_id_param AND badge_id = item_id
        ) INTO has_item;
      WHEN 'achievement' THEN
        SELECT EXISTS (
          SELECT 1 FROM forum_user_achievements
          WHERE user_id = user_id_param AND achievement_id = item_id
        ) INTO has_item;
      WHEN 'leaderboard' THEN
        SELECT EXISTS (
          SELECT 1 FROM forum_leaderboard_history
          WHERE user_id = user_id_param AND id = item_id
        ) INTO has_item;
      ELSE
        has_item := FALSE;
    END CASE;
    
    IF has_item THEN
      INSERT INTO user_showcase_items (user_id, item_type, item_id, display_order, custom_caption)
      VALUES (user_id_param, item_type, item_id, display_order, custom_caption);
      
      display_order := display_order + 1;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user profile with customization
CREATE OR REPLACE FUNCTION get_user_profile_with_customization(
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  title_record RECORD;
  frame_record RECORD;
  background_record RECORD;
  favorite_badges JSON;
  favorite_achievements JSON;
  showcase_items JSON;
  available_titles JSON;
  available_frames JSON;
  available_backgrounds JSON;
BEGIN
  -- Get user profile
  SELECT * INTO user_record FROM users WHERE id = user_id_param;
  
  -- Get user's title if set
  IF user_record.profile_title IS NOT NULL THEN
    SELECT * INTO title_record FROM profile_titles WHERE id = user_record.profile_title;
  END IF;
  
  -- Get user's frame if set
  IF user_record.profile_frame IS NOT NULL THEN
    SELECT * INTO frame_record FROM profile_frames WHERE id = user_record.profile_frame;
  END IF;
  
  -- Get user's background if set
  IF user_record.profile_background IS NOT NULL THEN
    SELECT * INTO background_record FROM profile_backgrounds WHERE id = user_record.profile_background;
  END IF;
  
  -- Get user's favorite badges
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'icon', b.icon,
      'color', b.color,
      'tier', b.tier,
      'display_order', ufb.display_order
    )
  ) INTO favorite_badges
  FROM user_favorite_badges ufb
  JOIN forum_badges b ON ufb.badge_id = b.id
  WHERE ufb.user_id = user_id_param
  ORDER BY ufb.display_order;
  
  -- Get user's favorite achievements
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'title', a.title,
      'description', a.description,
      'icon', a.icon,
      'color', a.color,
      'tier', a.tier,
      'category', a.category,
      'display_order', ufa.display_order
    )
  ) INTO favorite_achievements
  FROM user_favorite_achievements ufa
  JOIN forum_achievements a ON ufa.achievement_id = a.id
  WHERE ufa.user_id = user_id_param
  ORDER BY ufa.display_order;
  
  -- Get user's showcase items
  SELECT json_agg(
    json_build_object(
      'id', usi.id,
      'type', usi.item_type,
      'item_id', usi.item_id,
      'display_order', usi.display_order,
      'custom_caption', usi.custom_caption,
      'item_details', CASE
        WHEN usi.item_type = 'badge' THEN (
          SELECT json_build_object(
            'name', b.name,
            'description', b.description,
            'icon', b.icon,
            'color', b.color,
            'tier', b.tier
          )
          FROM forum_badges b
          WHERE b.id = usi.item_id
        )
        WHEN usi.item_type = 'achievement' THEN (
          SELECT json_build_object(
            'title', a.title,
            'description', a.description,
            'icon', a.icon,
            'color', a.color,
            'tier', a.tier,
            'category', a.category
          )
          FROM forum_achievements a
          WHERE a.id = usi.item_id
        )
        WHEN usi.item_type = 'leaderboard' THEN (
          SELECT json_build_object(
            'rank', lh.rank,
            'score', lh.score,
            'period', lh.period,
            'leaderboard_type', lh.leaderboard_type,
            'snapshot_date', lh.snapshot_date
          )
          FROM forum_leaderboard_history lh
          WHERE lh.id = usi.item_id
        )
        ELSE NULL
      END
    )
  ) INTO showcase_items
  FROM user_showcase_items usi
  WHERE usi.user_id = user_id_param
  ORDER BY usi.display_order;
  
  -- Get available titles
  SELECT json_agg(t) INTO available_titles
  FROM get_available_titles(user_id_param) t;
  
  -- Get available frames
  SELECT json_agg(f) INTO available_frames
  FROM get_available_frames(user_id_param) f;
  
  -- Get available backgrounds
  SELECT json_agg(b) INTO available_backgrounds
  FROM get_available_backgrounds(user_id_param) b;
  
  -- Return user profile with customization
  RETURN json_build_object(
    'id', user_record.id,
    'username', user_record.username,
    'full_name', user_record.full_name,
    'avatar_url', user_record.avatar_url,
    'level', user_record.level,
    'exp_points', user_record.exp_points,
    'profile_customization', json_build_object(
      'title', CASE WHEN title_record IS NULL THEN NULL ELSE json_build_object(
        'id', title_record.id,
        'title', title_record.title,
        'description', title_record.description,
        'icon', title_record.icon,
        'color', title_record.color
      ) END,
      'frame', CASE WHEN frame_record IS NULL THEN NULL ELSE json_build_object(
        'id', frame_record.id,
        'name', frame_record.name,
        'description', frame_record.description,
        'image_url', frame_record.image_url,
        'css_class', frame_record.css_class
      ) END,
      'background', CASE WHEN background_record IS NULL THEN NULL ELSE json_build_object(
        'id', background_record.id,
        'name', background_record.name,
        'description', background_record.description,
        'image_url', background_record.image_url,
        'css_class', background_record.css_class
      ) END,
      'theme', user_record.profile_theme,
      'accent_color', user_record.profile_accent_color
    ),
    'favorite_badges', COALESCE(favorite_badges, '[]'::JSON),
    'favorite_achievements', COALESCE(favorite_achievements, '[]'::JSON),
    'showcase_items', COALESCE(showcase_items, '[]'::JSON),
    'available_customization', json_build_object(
      'titles', COALESCE(available_titles, '[]'::JSON),
      'frames', COALESCE(available_frames, '[]'::JSON),
      'backgrounds', COALESCE(available_backgrounds, '[]'::JSON)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE profile_titles;
ALTER publication supabase_realtime ADD TABLE profile_frames;
ALTER publication supabase_realtime ADD TABLE profile_backgrounds;
ALTER publication supabase_realtime ADD TABLE user_favorite_badges;
ALTER publication supabase_realtime ADD TABLE user_favorite_achievements;
ALTER publication supabase_realtime ADD TABLE user_showcase_items;

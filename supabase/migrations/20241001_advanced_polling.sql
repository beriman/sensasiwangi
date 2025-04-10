-- Migration for advanced polling system

-- Create table for polls
CREATE TABLE IF NOT EXISTS forum_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  max_choices INTEGER DEFAULT 1,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_public_results BOOLEAN DEFAULT TRUE,
  close_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for poll options
CREATE TABLE IF NOT EXISTS forum_poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  image_url TEXT,
  color VARCHAR(50),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for poll votes
CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Create function to check if poll is open
CREATE OR REPLACE FUNCTION is_poll_open(poll_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
BEGIN
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF poll_record.close_date IS NOT NULL AND poll_record.close_date < NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to vote on a poll
CREATE OR REPLACE FUNCTION vote_on_poll(
  poll_id_param UUID,
  option_ids UUID[],
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
  option_id UUID;
  is_open BOOLEAN;
  max_choices INTEGER;
  current_votes INTEGER;
BEGIN
  -- Check if poll exists
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if poll is open
  is_open := is_poll_open(poll_id_param);
  
  IF NOT is_open THEN
    RAISE EXCEPTION 'Poll is closed';
  END IF;
  
  -- Check if number of options is valid
  max_choices := poll_record.max_choices;
  
  IF array_length(option_ids, 1) > max_choices THEN
    RAISE EXCEPTION 'Too many options selected. Maximum allowed: %', max_choices;
  END IF;
  
  -- Check if user has already voted
  SELECT COUNT(*) INTO current_votes
  FROM forum_poll_votes
  WHERE poll_id = poll_id_param AND user_id = user_id_param;
  
  -- If user has already voted, delete previous votes
  IF current_votes > 0 THEN
    DELETE FROM forum_poll_votes
    WHERE poll_id = poll_id_param AND user_id = user_id_param;
  END IF;
  
  -- Insert new votes
  FOREACH option_id IN ARRAY option_ids
  LOOP
    -- Check if option belongs to poll
    IF NOT EXISTS (
      SELECT 1 FROM forum_poll_options
      WHERE id = option_id AND poll_id = poll_id_param
    ) THEN
      RAISE EXCEPTION 'Invalid option ID: %', option_id;
    END IF;
    
    -- Insert vote
    INSERT INTO forum_poll_votes (poll_id, option_id, user_id)
    VALUES (poll_id_param, option_id, user_id_param);
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(
  poll_id_param UUID,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  poll_record RECORD;
  options_with_votes JSON;
  user_votes JSON;
  total_votes INTEGER;
  is_open BOOLEAN;
BEGIN
  -- Get poll
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if poll is open
  is_open := is_poll_open(poll_id_param);
  
  -- Check if results are public or if user is the creator
  IF NOT poll_record.is_public_results AND poll_record.created_by != user_id_param AND is_open THEN
    RAISE EXCEPTION 'Results are not public for this poll';
  END IF;
  
  -- Get total votes
  SELECT COUNT(*) INTO total_votes
  FROM forum_poll_votes
  WHERE poll_id = poll_id_param;
  
  -- Get options with vote counts
  SELECT json_agg(
    json_build_object(
      'id', po.id,
      'option_text', po.option_text,
      'image_url', po.image_url,
      'color', po.color,
      'display_order', po.display_order,
      'vote_count', COALESCE(vote_counts.count, 0),
      'percentage', CASE 
        WHEN total_votes > 0 THEN 
          ROUND((COALESCE(vote_counts.count, 0)::FLOAT / total_votes) * 100, 1)
        ELSE 0
      END
    )
  ) INTO options_with_votes
  FROM forum_poll_options po
  LEFT JOIN (
    SELECT option_id, COUNT(*) as count
    FROM forum_poll_votes
    WHERE poll_id = poll_id_param
    GROUP BY option_id
  ) vote_counts ON po.id = vote_counts.option_id
  WHERE po.poll_id = poll_id_param
  ORDER BY po.display_order;
  
  -- Get user's votes
  SELECT json_agg(option_id) INTO user_votes
  FROM forum_poll_votes
  WHERE poll_id = poll_id_param AND user_id = user_id_param;
  
  -- Return poll with results
  RETURN json_build_object(
    'id', poll_record.id,
    'thread_id', poll_record.thread_id,
    'title', poll_record.title,
    'description', poll_record.description,
    'is_multiple_choice', poll_record.is_multiple_choice,
    'max_choices', poll_record.max_choices,
    'is_anonymous', poll_record.is_anonymous,
    'is_public_results', poll_record.is_public_results,
    'close_date', poll_record.close_date,
    'created_by', poll_record.created_by,
    'created_at', poll_record.created_at,
    'updated_at', poll_record.updated_at,
    'is_open', is_open,
    'total_votes', total_votes,
    'options', options_with_votes,
    'user_votes', user_votes
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to create a poll
CREATE OR REPLACE FUNCTION create_poll(
  thread_id_param UUID,
  title_param TEXT,
  description_param TEXT,
  is_multiple_choice_param BOOLEAN,
  max_choices_param INTEGER,
  is_anonymous_param BOOLEAN,
  is_public_results_param BOOLEAN,
  close_date_param TIMESTAMP WITH TIME ZONE,
  options_param JSON[],
  user_id_param UUID
)
RETURNS UUID AS $$
DECLARE
  poll_id UUID;
  option_json JSON;
  option_text TEXT;
  image_url TEXT;
  color TEXT;
  display_order INTEGER;
BEGIN
  -- Create poll
  INSERT INTO forum_polls (
    thread_id,
    title,
    description,
    is_multiple_choice,
    max_choices,
    is_anonymous,
    is_public_results,
    close_date,
    created_by
  ) VALUES (
    thread_id_param,
    title_param,
    description_param,
    is_multiple_choice_param,
    max_choices_param,
    is_anonymous_param,
    is_public_results_param,
    close_date_param,
    user_id_param
  ) RETURNING id INTO poll_id;
  
  -- Create options
  display_order := 1;
  FOREACH option_json IN ARRAY options_param
  LOOP
    option_text := option_json->>'text';
    image_url := option_json->>'image_url';
    color := option_json->>'color';
    
    INSERT INTO forum_poll_options (
      poll_id,
      option_text,
      image_url,
      color,
      display_order
    ) VALUES (
      poll_id,
      option_text,
      image_url,
      color,
      display_order
    );
    
    display_order := display_order + 1;
  END LOOP;
  
  RETURN poll_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update a poll
CREATE OR REPLACE FUNCTION update_poll(
  poll_id_param UUID,
  title_param TEXT,
  description_param TEXT,
  is_multiple_choice_param BOOLEAN,
  max_choices_param INTEGER,
  is_anonymous_param BOOLEAN,
  is_public_results_param BOOLEAN,
  close_date_param TIMESTAMP WITH TIME ZONE,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
BEGIN
  -- Get poll
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if user is the creator
  IF poll_record.created_by != user_id_param THEN
    RAISE EXCEPTION 'Only the creator can update the poll';
  END IF;
  
  -- Check if poll has votes
  IF EXISTS (
    SELECT 1 FROM forum_poll_votes
    WHERE poll_id = poll_id_param
  ) THEN
    RAISE EXCEPTION 'Cannot update poll with existing votes';
  END IF;
  
  -- Update poll
  UPDATE forum_polls
  SET
    title = title_param,
    description = description_param,
    is_multiple_choice = is_multiple_choice_param,
    max_choices = max_choices_param,
    is_anonymous = is_anonymous_param,
    is_public_results = is_public_results_param,
    close_date = close_date_param,
    updated_at = NOW()
  WHERE id = poll_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update poll options
CREATE OR REPLACE FUNCTION update_poll_options(
  poll_id_param UUID,
  options_param JSON[],
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
  option_json JSON;
  option_id UUID;
  option_text TEXT;
  image_url TEXT;
  color TEXT;
  display_order INTEGER;
BEGIN
  -- Get poll
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if user is the creator
  IF poll_record.created_by != user_id_param THEN
    RAISE EXCEPTION 'Only the creator can update the poll';
  END IF;
  
  -- Check if poll has votes
  IF EXISTS (
    SELECT 1 FROM forum_poll_votes
    WHERE poll_id = poll_id_param
  ) THEN
    RAISE EXCEPTION 'Cannot update poll with existing votes';
  END IF;
  
  -- Delete existing options
  DELETE FROM forum_poll_options
  WHERE poll_id = poll_id_param;
  
  -- Create new options
  display_order := 1;
  FOREACH option_json IN ARRAY options_param
  LOOP
    option_text := option_json->>'text';
    image_url := option_json->>'image_url';
    color := option_json->>'color';
    
    INSERT INTO forum_poll_options (
      poll_id,
      option_text,
      image_url,
      color,
      display_order
    ) VALUES (
      poll_id_param,
      option_text,
      image_url,
      color,
      display_order
    );
    
    display_order := display_order + 1;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to close a poll
CREATE OR REPLACE FUNCTION close_poll(
  poll_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
BEGIN
  -- Get poll
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if user is the creator
  IF poll_record.created_by != user_id_param THEN
    RAISE EXCEPTION 'Only the creator can close the poll';
  END IF;
  
  -- Close poll
  UPDATE forum_polls
  SET
    close_date = NOW(),
    updated_at = NOW()
  WHERE id = poll_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete a poll
CREATE OR REPLACE FUNCTION delete_poll(
  poll_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
BEGIN
  -- Get poll
  SELECT * INTO poll_record FROM forum_polls WHERE id = poll_id_param;
  
  IF poll_record IS NULL THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;
  
  -- Check if user is the creator
  IF poll_record.created_by != user_id_param THEN
    RAISE EXCEPTION 'Only the creator can delete the poll';
  END IF;
  
  -- Delete poll
  DELETE FROM forum_polls
  WHERE id = poll_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_polls;
ALTER publication supabase_realtime ADD TABLE forum_poll_options;
ALTER publication supabase_realtime ADD TABLE forum_poll_votes;

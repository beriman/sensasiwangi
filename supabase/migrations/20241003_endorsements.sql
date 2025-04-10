-- Migration for user endorsements system

-- Create table for user endorsements
CREATE TABLE IF NOT EXISTS user_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill VARCHAR(100) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill)
);

-- Create table for endorsements given
CREATE TABLE IF NOT EXISTS user_endorsements_given (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endorsement_id UUID NOT NULL REFERENCES user_endorsements(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endorsement_id, endorser_id)
);

-- Create function to increment endorsement count
CREATE OR REPLACE FUNCTION increment_endorsement_count(
  endorsement_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_endorsements
  SET 
    count = count + 1,
    updated_at = NOW()
  WHERE id = endorsement_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement endorsement count
CREATE OR REPLACE FUNCTION decrement_endorsement_count(
  endorsement_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_endorsements
  SET 
    count = GREATEST(0, count - 1),
    updated_at = NOW()
  WHERE id = endorsement_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify user when they receive an endorsement
CREATE OR REPLACE FUNCTION notify_endorsement()
RETURNS TRIGGER AS $$
DECLARE
  endorsement_record RECORD;
  endorser_username TEXT;
BEGIN
  -- Get endorsement info
  SELECT e.skill, e.user_id INTO endorsement_record
  FROM user_endorsements e
  WHERE e.id = NEW.endorsement_id;
  
  -- Get endorser username
  SELECT username INTO endorser_username
  FROM users
  WHERE id = NEW.endorser_id;
  
  -- Create notification
  PERFORM create_notification(
    endorsement_record.user_id,
    'endorsement',
    'New Skill Endorsement',
    endorser_username || ' endorsed your skill: ' || endorsement_record.skill,
    '/profile'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_endorsement_trigger
AFTER INSERT ON user_endorsements_given
FOR EACH ROW
EXECUTE FUNCTION notify_endorsement();

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE user_endorsements;
ALTER publication supabase_realtime ADD TABLE user_endorsements_given;

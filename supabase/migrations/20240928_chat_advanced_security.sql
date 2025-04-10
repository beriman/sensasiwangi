-- Create table for user blocks
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id 
ON user_blocks(blocker_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id 
ON user_blocks(blocked_id);

-- Enable RLS for user_blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_blocks
CREATE POLICY "Users can view their own blocks" 
ON user_blocks FOR SELECT 
USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks" 
ON user_blocks FOR INSERT 
TO authenticated 
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks" 
ON user_blocks FOR DELETE 
USING (blocker_id = auth.uid());

-- Create table for spam violations
CREATE TABLE IF NOT EXISTS spam_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  reason TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spam_violations_user_id 
ON spam_violations(user_id);

CREATE INDEX IF NOT EXISTS idx_spam_violations_created_at 
ON spam_violations(created_at);

-- Enable RLS for spam_violations
ALTER TABLE spam_violations ENABLE ROW LEVEL SECURITY;

-- Create policies for spam_violations
CREATE POLICY "Admins can view all spam violations" 
ON spam_violations FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = $1 AND blocked_id = $2
  );
END;
$$;

-- Create function to filter messages from blocked users
CREATE OR REPLACE FUNCTION filter_blocked_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the sender is blocked by the recipient
  IF EXISTS (
    SELECT 1 FROM private_conversation_participants p
    JOIN user_blocks b ON p.user_id = b.blocker_id
    WHERE p.conversation_id = NEW.conversation_id
    AND b.blocked_id = NEW.sender_id
  ) THEN
    -- Mark message as from blocked user
    NEW.is_from_blocked_user = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add is_from_blocked_user column to private_messages
ALTER TABLE IF EXISTS private_messages 
ADD COLUMN IF NOT EXISTS is_from_blocked_user BOOLEAN DEFAULT false;

-- Create trigger for filtering blocked messages
DROP TRIGGER IF EXISTS filter_blocked_messages_trigger ON private_messages;
CREATE TRIGGER filter_blocked_messages_trigger
BEFORE INSERT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION filter_blocked_messages();

-- Create function to prevent sending messages to users who blocked you
CREATE OR REPLACE FUNCTION prevent_messaging_blockers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For direct messages (non-group conversations)
  IF NOT EXISTS (
    SELECT 1 FROM private_conversations
    WHERE id = NEW.conversation_id AND is_group = true
  ) THEN
    -- Check if the recipient has blocked the sender
    IF EXISTS (
      SELECT 1 FROM private_conversation_participants p
      JOIN user_blocks b ON p.user_id = b.blocker_id
      WHERE p.conversation_id = NEW.conversation_id
      AND p.user_id != NEW.sender_id -- The other participant (recipient)
      AND b.blocked_id = NEW.sender_id
    ) THEN
      RAISE EXCEPTION 'Cannot send message: recipient has blocked you';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent messaging blockers
DROP TRIGGER IF EXISTS prevent_messaging_blockers_trigger ON private_messages;
CREATE TRIGGER prevent_messaging_blockers_trigger
BEFORE INSERT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION prevent_messaging_blockers();

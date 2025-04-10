-- Add encryption support to private_messages
ALTER TABLE IF EXISTS private_messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_metadata JSONB;

-- Create table for user encryption keys
CREATE TABLE IF NOT EXISTS user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for user_encryption_keys
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for user_encryption_keys
CREATE POLICY "Users can view their own encryption keys" 
ON user_encryption_keys FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own encryption keys" 
ON user_encryption_keys FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own encryption keys" 
ON user_encryption_keys FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Public keys are readable by all authenticated users" 
ON user_encryption_keys FOR SELECT 
TO authenticated 
USING (true);

-- Create table for self-destruct messages
CREATE TABLE IF NOT EXISTS self_destruct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
  expiration_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read_once BOOLEAN DEFAULT false,
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

-- Enable RLS for self_destruct_messages
ALTER TABLE self_destruct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for self_destruct_messages
CREATE POLICY "Users can view self-destruct messages in their conversations" 
ON self_destruct_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM private_messages m
    JOIN private_conversation_participants p ON m.conversation_id = p.conversation_id
    WHERE m.id = self_destruct_messages.message_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create self-destruct messages for their own messages" 
ON self_destruct_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM private_messages m
    WHERE m.id = self_destruct_messages.message_id
    AND m.sender_id = auth.uid()
  )
);

-- Create table for identity verifications
CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id, verification_code)
);

-- Enable RLS for identity_verifications
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for identity_verifications
CREATE POLICY "Users can view their own verification codes" 
ON identity_verifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create verification codes for their conversations" 
ON identity_verifications FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = identity_verifications.conversation_id
    AND user_id = auth.uid()
  )
);

-- Add identity verification fields to conversation participants
ALTER TABLE IF EXISTS private_conversation_participants 
ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create function to handle self-destruct messages
CREATE OR REPLACE FUNCTION process_self_destruct_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired messages
  UPDATE self_destruct_messages
  SET is_expired = true
  WHERE expiration_time < NOW()
  AND is_expired = false;
  
  -- Delete expired messages content
  UPDATE private_messages m
  SET 
    content = '<p><em>Pesan ini telah dihapus secara otomatis</em></p>',
    is_deleted = true,
    deleted_at = NOW()
  FROM self_destruct_messages s
  WHERE m.id = s.message_id
  AND s.is_expired = true
  AND m.is_deleted = false;
  
  -- Handle read-once messages
  IF TG_OP = 'SELECT' AND NEW.id IS NOT NULL THEN
    -- Check if this is a read-once message
    DECLARE
      self_destruct_record RECORD;
    BEGIN
      SELECT * INTO self_destruct_record
      FROM self_destruct_messages
      WHERE message_id = NEW.id
      AND is_read_once = true
      AND is_expired = false;
      
      IF FOUND THEN
        -- Mark as expired
        UPDATE self_destruct_messages
        SET is_expired = true
        WHERE message_id = NEW.id;
        
        -- Delete message content
        UPDATE private_messages
        SET 
          content = '<p><em>Pesan ini telah dihapus setelah dibaca</em></p>',
          is_deleted = true,
          deleted_at = NOW()
        WHERE id = NEW.id;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for self-destruct messages
DROP TRIGGER IF EXISTS process_self_destruct_trigger ON private_messages;
CREATE TRIGGER process_self_destruct_trigger
AFTER SELECT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION process_self_destruct_messages();

-- Create scheduled function to clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- Mark expired messages
  UPDATE self_destruct_messages
  SET is_expired = true
  WHERE expiration_time < NOW()
  AND is_expired = false;
  
  -- Delete expired messages content
  UPDATE private_messages m
  SET 
    content = '<p><em>Pesan ini telah dihapus secara otomatis</em></p>',
    is_deleted = true,
    deleted_at = NOW()
  FROM self_destruct_messages s
  WHERE m.id = s.message_id
  AND s.is_expired = true
  AND m.is_deleted = false;
END;
$$ LANGUAGE plpgsql;
